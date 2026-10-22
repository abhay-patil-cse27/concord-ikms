"""Document Parsers for PDF, DOCX, TXT, and Markdown files."""
import io
from abc import ABC, abstractmethod
from typing import List, Dict, Any
import pypdf
import docx


class ExtractedPage:
    def __init__(self, text: str, page_number: int, metadata: Dict[str, Any] = None):
        self.text = text
        self.page_number = page_number
        self.metadata = metadata or {}


class BaseDocumentParser(ABC):
    """Abstract contract for document content parsers."""

    @abstractmethod
    def extract_pages(self, file_bytes: bytes) -> List[ExtractedPage]:
        """Extract structured pages and text from raw file bytes."""
        pass


class PDFParser(BaseDocumentParser):
    """Extracts text from PDF documents page by page using pypdf."""

    def extract_pages(self, file_bytes: bytes) -> List[ExtractedPage]:
        pages = []
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        for idx, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            pages.append(ExtractedPage(text=text.strip(), page_number=idx, metadata={"total_pages": len(reader.pages)}))
        return pages


class DocxParser(BaseDocumentParser):
    """Extracts text from Microsoft Word .docx documents."""

    def extract_pages(self, file_bytes: bytes) -> List[ExtractedPage]:
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs_text = []
        for p in doc.paragraphs:
            if p.text.strip():
                paragraphs_text.append(p.text.strip())
                
        # Also include table text
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    paragraphs_text.append(" | ".join(row_text))

        combined_text = "\n\n".join(paragraphs_text)
        return [ExtractedPage(text=combined_text, page_number=1, metadata={"paragraph_count": len(doc.paragraphs)})]


class TextParser(BaseDocumentParser):
    """Extracts text from plain text or markdown files."""

    def extract_pages(self, file_bytes: bytes) -> List[ExtractedPage]:
        # Handle UTF-8 with fallback to latin-1
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("latin-1", errors="replace")
        return [ExtractedPage(text=text.strip(), page_number=1, metadata={})]


class ExcelParser(BaseDocumentParser):
    """Extracts structured rows, sheets, and cell data from Excel spreadsheets (.xlsx)."""

    def extract_pages(self, file_bytes: bytes) -> List[ExtractedPage]:
        import openpyxl

        workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
        pages: List[ExtractedPage] = []

        for sheet_idx, sheet_name in enumerate(workbook.sheetnames, start=1):
            sheet = workbook[sheet_name]
            rows_text: List[str] = [f"=== Sheet: {sheet_name} ==="]

            for row in sheet.iter_rows(values_only=True):
                # Clean and filter non-empty cell values
                row_vals = [str(cell).strip() for cell in row if cell is not None and str(cell).strip()]
                if row_vals:
                    rows_text.append(" | ".join(row_vals))

            if len(rows_text) > 1:  # More than just the header
                sheet_content = "\n".join(rows_text)
                pages.append(
                    ExtractedPage(
                        text=sheet_content,
                        page_number=sheet_idx,
                        metadata={"sheet_name": sheet_name, "row_count": len(rows_text) - 1}
                    )
                )

        if not pages:
            pages.append(ExtractedPage(text="[Empty Excel Workbook]", page_number=1, metadata={}))

        return pages


def get_parser_for_mime_or_ext(filename: str, mime_type: str) -> BaseDocumentParser:
    """Factory resolving appropriate parser based on file extension and MIME type."""
    fn_lower = filename.lower()
    if fn_lower.endswith(".pdf") or "pdf" in mime_type:
        return PDFParser()
    elif fn_lower.endswith(".docx") or "wordprocessingml" in mime_type:
        return DocxParser()
    elif fn_lower.endswith((".xlsx", ".xlsm", ".xltx")) or "spreadsheetml" in mime_type or "excel" in mime_type:
        return ExcelParser()
    elif fn_lower.endswith((".txt", ".md", ".csv", ".json", ".log")) or "text" in mime_type or "csv" in mime_type:
        return TextParser()
    else:
        # Default fallback to plain text parsing
        return TextParser()
