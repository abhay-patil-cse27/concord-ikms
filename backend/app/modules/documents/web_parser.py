"""Web Notice & HTML semantic parser. Extracts clean Markdown prose from institutional portals."""
import re
from html.parser import HTMLParser
from typing import Tuple, Optional


class SemanticHTMLTextExtractor(HTMLParser):
    """
    Zero-heavy-dependency semantic HTML parser.
    Strips scripts, styles, navigation bars, footers, headers, and comments,
    preserving structural headings, paragraphs, and list items as readable Markdown.
    """

    IGNORABLE_TAGS = {
        "script", "style", "nav", "footer", "header", "aside",
        "noscript", "svg", "form", "button", "iframe"
    }

    def __init__(self):
        super().__init__()
        self._ignore_depth = 0
        self._title_depth = 0
        self._extracted_title = ""
        self._lines = []
        self._current_line = []

    @property
    def title(self) -> str:
        return self._extracted_title.strip()

    def handle_starttag(self, tag: str, attrs):
        tag_lower = tag.lower()
        if tag_lower in self.IGNORABLE_TAGS:
            self._ignore_depth += 1
            return

        if self._ignore_depth > 0:
            return

        if tag_lower == "title":
            self._title_depth += 1
        elif tag_lower in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self._flush_line()
            level = int(tag_lower[1])
            self._current_line.append(f"\n{'#' * level} ")
        elif tag_lower in ("p", "div", "article", "section"):
            self._flush_line()
        elif tag_lower == "li":
            self._flush_line()
            self._current_line.append("- ")
        elif tag_lower == "br":
            self._flush_line()

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()
        if tag_lower in self.IGNORABLE_TAGS:
            if self._ignore_depth > 0:
                self._ignore_depth -= 1
            return

        if self._ignore_depth > 0:
            return

        if tag_lower == "title":
            if self._title_depth > 0:
                self._title_depth -= 1
        elif tag_lower in ("p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr"):
            self._flush_line()

    def handle_data(self, data: str):
        if self._title_depth > 0 and self._ignore_depth == 0:
            self._extracted_title += data
            return

        if self._ignore_depth > 0:
            return

        cleaned = data.strip()
        if cleaned:
            self._current_line.append(data)

    def _flush_line(self):
        if self._current_line:
            line_str = "".join(self._current_line).strip()
            if line_str:
                self._lines.append(line_str)
            self._current_line = []

    def get_markdown(self) -> str:
        self._flush_line()
        raw = "\n\n".join(self._lines)
        # Normalize multiple duplicate newlines and leading/trailing whitespace
        normalized = re.sub(r"\n{3,}", "\n\n", raw).strip()
        return normalized


class WebNoticeParser:
    """Service to purify raw HTML into semantic Markdown content."""

    @classmethod
    def parse_html_to_markdown(cls, html_content: str, default_title: Optional[str] = None) -> Tuple[str, str]:
        """
        Parses raw HTML string, returning (extracted_title, clean_markdown).
        """
        if not html_content or not html_content.strip():
            return (default_title or "Web Notice Document", "")

        parser = SemanticHTMLTextExtractor()
        try:
            parser.feed(html_content)
        except Exception:
            pass

        title = parser.title or default_title or "Institutional Web Notice"
        markdown = parser.get_markdown()

        # If parser extracted empty text due to dynamic JS framing, fall back to regex text strip
        if not markdown:
            stripped = re.sub(r"<[^>]+>", " ", html_content)
            markdown = re.sub(r"\s+", " ", stripped).strip()

        return (title, markdown)
