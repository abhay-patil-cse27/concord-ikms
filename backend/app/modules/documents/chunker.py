"""Document chunking engine."""
from typing import List, Dict, Any
from app.modules.documents.parsers import ExtractedPage


class DocumentChunkResult:
    def __init__(self, index: int, content: str, char_count: int, metadata: Dict[str, Any]):
        self.index = index
        self.content = content
        self.char_count = char_count
        self.metadata = metadata


class TextChunker:
    """Chunks structured pages into overlapping semantic segments for RAG retrieval."""

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

            # Simple sliding window chunker respecting word boundaries where possible
            start = 0
            text_length = len(text)

            while start < text_length:
                end = min(start + self.chunk_size, text_length)
                
                # Attempt to snap end to a paragraph break or sentence boundary
                if end < text_length:
                    # Look back for nearest double newline, period, or space within 100 chars
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

                # Advance with overlap
                start = max(start + 1, end - self.chunk_overlap)

        return chunks


default_chunker = TextChunker(chunk_size=800, chunk_overlap=150)
