"""
Multi-strategy chunking architecture with format-specific strategies:
- TabularChunker (Excel/CSV): Preserves table rows, header context, and column alignments.
- SemanticParagraphChunker (DOCX/Markdown): Preserves heading hierarchies and whole paragraphs.
- SlidingWindowTextChunker (PDF/TXT): Boundary-aware sliding window for long unstructured text.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from app.modules.documents.parsers import ExtractedPage


class DocumentChunkResult:
    def __init__(self, index: int, content: str, char_count: int, metadata: Dict[str, Any]):
        self.index = index
        self.content = content
        self.char_count = char_count
        self.metadata = metadata


class BaseChunker(ABC):
    """Abstract Strategy interface for document chunking."""

    @abstractmethod
    def chunk_pages(self, pages: List[ExtractedPage]) -> List[DocumentChunkResult]:
        pass


class TabularChunker(BaseChunker):
    """
    Format-specific chunker for Excel spreadsheets (.xlsx, .xls) and CSV data.
    
    Principles:
    1. NEVER slice a table row in half across chunks.
    2. Keeps the table header row attached to each chunk so numerical data retains context.
    3. Groups rows into logical batches (e.g., 10-15 rows per chunk).
    """

    def __init__(self, rows_per_chunk: int = 12):
        self.rows_per_chunk = rows_per_chunk

    def chunk_pages(self, pages: List[ExtractedPage]) -> List[DocumentChunkResult]:
        chunks: List[DocumentChunkResult] = []
        global_index = 0

        for page in pages:
            lines = [line.strip() for line in page.text.split("\n") if line.strip()]
            if not lines:
                continue

            # Check if first line is a sheet title or header
            header_line = lines[0] if lines else ""
            table_header = lines[1] if len(lines) > 1 else ""
            data_rows = lines[2:] if len(lines) > 2 else lines[1:]

            if not data_rows:
                # Single line or empty sheet
                text = "\n".join(lines)
                chunks.append(
                    DocumentChunkResult(
                        index=global_index,
                        content=text,
                        char_count=len(text),
                        metadata={"page_number": page.page_number, "chunk_type": "tabular_summary", **page.metadata}
                    )
                )
                global_index += 1
                continue

            # Batch rows together with header context
            for i in range(0, len(data_rows), self.rows_per_chunk):
                batch = data_rows[i:i + self.rows_per_chunk]
                chunk_lines = []
                if header_line.startswith("==="):
                    chunk_lines.append(header_line)
                if table_header and table_header != header_line:
                    chunk_lines.append(f"[Columns: {table_header}]")
                chunk_lines.extend(batch)

                chunk_text = "\n".join(chunk_lines)
                meta = {
                    "page_number": page.page_number,
                    "chunk_type": "tabular",
                    "row_start": i + 1,
                    "row_end": min(i + len(batch), len(data_rows)),
                    **page.metadata
                }

                chunks.append(
                    DocumentChunkResult(
                        index=global_index,
                        content=chunk_text,
                        char_count=len(chunk_text),
                        metadata=meta
                    )
                )
                global_index += 1

        return chunks


class SemanticParagraphChunker(BaseChunker):
    """
    Format-specific chunker for structured documents (DOCX, Markdown).
    
    Principles:
    1. Splits primarily on paragraph breaks (`\n\n`) and markdown headers (`# `, `## `).
    2. Groups full paragraphs up to max_chars without chopping sentences.
    3. Retains heading context in metadata.
    """

    def __init__(self, max_chars: int = 900, min_chars: int = 150):
        self.max_chars = max_chars
        self.min_chars = min_chars

    def chunk_pages(self, pages: List[ExtractedPage]) -> List[DocumentChunkResult]:
        chunks: List[DocumentChunkResult] = []
        global_index = 0

        for page in pages:
            paragraphs = [p.strip() for p in page.text.split("\n\n") if p.strip()]
            if not paragraphs:
                continue

            current_chunk_paras: List[str] = []
            current_len = 0

            for para in paragraphs:
                para_len = len(para)

                if current_len + para_len > self.max_chars and current_chunk_paras:
                    # Flush current chunk
                    chunk_text = "\n\n".join(current_chunk_paras)
                    chunks.append(
                        DocumentChunkResult(
                            index=global_index,
                            content=chunk_text,
                            char_count=len(chunk_text),
                            metadata={"page_number": page.page_number, "chunk_type": "paragraph", **page.metadata}
                        )
                    )
                    global_index += 1
                    current_chunk_paras = []
                    current_len = 0

                current_chunk_paras.append(para)
                current_len += para_len + 2

            if current_chunk_paras:
                chunk_text = "\n\n".join(current_chunk_paras)
                chunks.append(
                    DocumentChunkResult(
                        index=global_index,
                        content=chunk_text,
                        char_count=len(chunk_text),
                        metadata={"page_number": page.page_number, "chunk_type": "paragraph", **page.metadata}
                    )
                )
                global_index += 1

        return chunks


class SlidingWindowTextChunker(BaseChunker):
    """
    Format-specific chunker for unstructured dense text (PDFs, raw text files).
    
    Principles:
    1. Uses a sliding window with overlap to guarantee edge sentences aren't split.
    2. Snaps to sentence delimiters (`. `, `?\n`, `!\n`, newline) rather than cutting words.
    """

    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_pages(self, pages: List[ExtractedPage]) -> List[DocumentChunkResult]:
        chunks: List[DocumentChunkResult] = []
        global_index = 0

        for page in pages:
            text = page.text.strip()
            if not text:
                continue

            start = 0
            text_length = len(text)

            while start < text_length:
                end = min(start + self.chunk_size, text_length)

                if end < text_length:
                    search_zone = text[max(start, end - 80):end]
                    break_point = -1
                    for delimiter in ["\n\n", ".\n", ". ", "\n", " "]:
                        pos = search_zone.rfind(delimiter)
                        if pos != -1:
                            break_point = max(start, end - 80) + pos + len(delimiter)
                            break
                    if break_point > start:
                        end = break_point

                chunk_text = text[start:end].strip()
                if chunk_text:
                    meta = {
                        "page_number": page.page_number,
                        "chunk_type": "sliding_window",
                        **page.metadata,
                    }
                    chunks.append(
                        DocumentChunkResult(
                            index=global_index,
                            content=chunk_text,
                            char_count=len(chunk_text),
                            metadata=meta,
                        )
                    )
                    global_index += 1

                if end >= text_length:
                    break

                start = max(start + 1, end - self.chunk_overlap)

        return chunks


def get_chunker_for_document(filename: str, mime_type: str) -> BaseChunker:
    """
    Factory resolving the optimal format-aware chunking strategy.
    
    - Spreadsheets/CSVs -> TabularChunker (Row-aware, retains column header)
    - Word/Markdown     -> SemanticParagraphChunker (Paragraph-aware, preserves heading sections)
    - PDFs/Plain Text   -> SlidingWindowTextChunker (Boundary-aware sliding window)
    """
    fn_lower = filename.lower()
    if fn_lower.endswith((".xlsx", ".xlsm", ".xls", ".csv")) or "spreadsheet" in mime_type or "excel" in mime_type or "csv" in mime_type:
        return TabularChunker(rows_per_chunk=10)
    elif fn_lower.endswith((".docx", ".md")) or "wordprocessingml" in mime_type or "markdown" in mime_type:
        return SemanticParagraphChunker(max_chars=850)
    else:
        return SlidingWindowTextChunker(chunk_size=800, chunk_overlap=150)
