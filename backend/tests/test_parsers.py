import io
import pytest
import docx
import pypdf
from app.modules.documents.parsers import PDFParser, DocxParser, TextParser, get_parser_for_mime_or_ext
from app.modules.documents.chunker import TextChunker, ExtractedPage


def test_text_parser():
    sample_text = "This is a test of the Institutional Knowledge Management System.\n\nSection 1: Guidelines."
    parser = TextParser()
    pages = parser.extract_pages(sample_text.encode("utf-8"))
    assert len(pages) == 1
    assert "Institutional Knowledge Management System" in pages[0].text
    assert pages[0].page_number == 1


def test_docx_parser():
    doc = docx.Document()
    doc.add_heading("Institutional Exam Policy", level=1)
    doc.add_paragraph("All semester examinations must be completed within 3 hours.")
    
    # Save to in-memory bytes
    f_bytes = io.BytesIO()
    doc.save(f_bytes)
    
    parser = DocxParser()
    pages = parser.extract_pages(f_bytes.getvalue())
    assert len(pages) == 1
    assert "Institutional Exam Policy" in pages[0].text
    assert "3 hours" in pages[0].text


def test_pdf_parser():
    # Create simple PDF in memory using pypdf
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=200, height=200)
    
    f_bytes = io.BytesIO()
    writer.write(f_bytes)
    
    parser = PDFParser()
    pages = parser.extract_pages(f_bytes.getvalue())
    assert len(pages) == 1
    assert pages[0].page_number == 1


def test_chunker_sliding_window():
    chunker = TextChunker(chunk_size=100, chunk_overlap=20)
    long_text = (
        "Paragraph 1 contains some standard institutional background information that is quite extensive. "
        "Paragraph 2 continues with guidelines for attendance, assignments, and semester lab credits. "
        "Paragraph 3 concludes the policy document with regulatory references."
    )
    pages = [ExtractedPage(text=long_text, page_number=1)]
    chunks = chunker.chunk_pages(pages)
    
    assert len(chunks) > 1
    assert chunks[0].index == 0
    assert chunks[1].index == 1
    assert all(c.char_count <= 110 for c in chunks)
    assert all(c.metadata["page_number"] == 1 for c in chunks)


def test_parser_factory():
    p_pdf = get_parser_for_mime_or_ext("handbook.pdf", "application/pdf")
    p_docx = get_parser_for_mime_or_ext("curriculum.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    p_xlsx = get_parser_for_mime_or_ext("grades.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    p_txt = get_parser_for_mime_or_ext("notes.txt", "text/plain")

    from app.modules.documents.parsers import ExcelParser
    assert isinstance(p_pdf, PDFParser)
    assert isinstance(p_docx, DocxParser)
    assert isinstance(p_xlsx, ExcelParser)
    assert isinstance(p_txt, TextParser)


def test_excel_parser_extraction():
    import io
    import openpyxl
    from app.modules.documents.parsers import ExcelParser

    # Create an in-memory workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "FeeStructure"
    ws.append(["Category", "Amount", "DueDate"])
    ws.append(["Tuition", 85000, "2026-08-30"])
    ws.append(["Library", 5000, "2026-08-30"])

    buffer = io.BytesIO()
    wb.save(buffer)
    excel_bytes = buffer.getvalue()

    parser = ExcelParser()
    pages = parser.extract_pages(excel_bytes)

    assert len(pages) == 1
    assert "FeeStructure" in pages[0].text
    assert "Tuition | 85000 | 2026-08-30" in pages[0].text
    assert pages[0].metadata["row_count"] == 3
