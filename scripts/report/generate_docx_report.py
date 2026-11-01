"""
Main Execution Script: CONCORD Phase-I Mega Project Report Compiler.
Compiles frontmatter, chapters, references, and appendices into a publication-grade .docx.
Location: scripts/report/generate_docx_report.py
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import docx
from report_helpers import (
    setup_document_styles, add_header_footer, OUTPUT_PATH
)
from report_frontmatter import (
    add_cover_page, add_certificate_page, add_plagiarism_certificate,
    add_declaration_page, add_acknowledgement_page, add_abstract_page,
    add_table_of_contents, add_list_of_tables, add_list_of_figures,
    add_list_of_abbreviations
)
from report_chapters import (
    add_chapter_1, add_chapter_2, add_chapter_3,
    add_chapter_4, add_chapter_5, add_chapter_6,
    add_references, add_appendix_a, add_appendix_b
)

def build_full_report():
    print("=" * 70)
    print("CONCORD Mega Project Phase-I Report Generation Initiated")
    print(f"Target Output Path: {OUTPUT_PATH}")
    print("Department of Computer Science and Engineering")
    print("Kolhapur Institute of Technology’s College of Engineering Kolhapur")
    print("=" * 70)

    doc = docx.Document()
    setup_document_styles(doc)

    print("[1/19] Generating Cover Page (Appendix 1 Specimen)...")
    add_cover_page(doc)

    print("[2/19] Generating Certificate (Appendix 2 Specimen)...")
    add_certificate_page(doc)

    print("[3/19] Generating Certificate of Plagiarism Compliance (<15% Mandate)...")
    add_plagiarism_certificate(doc)

    print("[4/19] Generating Declaration (Appendix 3 Specimen)...")
    add_declaration_page(doc)

    print("[5/19] Generating Acknowledgement (Appendix 4 Specimen)...")
    add_acknowledgement_page(doc)

    print("[6/19] Generating Abstract & Keywords...")
    add_abstract_page(doc)

    print("[7/19] Generating Table of Contents (Appendix 5 Specimen)...")
    add_table_of_contents(doc)

    print("[8/19] Generating List of Tables...")
    add_list_of_tables(doc)

    print("[9/19] Generating List of Figures...")
    add_list_of_figures(doc)

    print("[10/19] Generating List of Abbreviations and Nomenclature...")
    add_list_of_abbreviations(doc)

    print("[11/19] Generating Chapter 1: Introduction & Problem Definition...")
    add_chapter_1(doc)

    print("[12/19] Generating Chapter 2: Literature Review...")
    add_chapter_2(doc)

    print("[13/19] Generating Chapter 3: Proposed System & Architecture...")
    add_chapter_3(doc)

    print("[14/19] Generating Chapter 4: Methodology & Algorithmic Formulation...")
    add_chapter_4(doc)

    print("[15/19] Generating Chapter 5: Prototype Implementation & Findings...")
    add_chapter_5(doc)

    print("[16/19] Generating Chapter 6: Conclusion & Future Work...")
    add_chapter_6(doc)

    print("[17/19] Generating References (IEEE Format)...")
    add_references(doc)

    print("[18/19] Generating Appendix A: Test Verification Suite (124 Tests)...")
    add_appendix_a(doc)

    print("[19/19] Generating Appendix B: Sample Academic Queries & Outputs...")
    add_appendix_b(doc)

    print("Applying Page Margins (1.5 in Left for spiral binding), Headers, and Footers...")
    add_header_footer(doc)

    # Save to disk with graceful fallback if file is currently open in Word
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    actual_output = OUTPUT_PATH
    try:
        doc.save(OUTPUT_PATH)
    except PermissionError:
        base, ext = os.path.splitext(OUTPUT_PATH)
        actual_output = f"{base}_new{ext}"
        doc.save(actual_output)
        print(f"\n[NOTE] {OUTPUT_PATH} is currently open in Microsoft Word.")
        print(f"       Saved updated copy to: {actual_output}\n")

    file_size_kb = os.path.getsize(actual_output) / 1024

    print("=" * 70)
    print("REPORT GENERATION COMPLETED SUCCESSFULLY!")
    print(f"File Location: {actual_output}")
    print(f"File Size:     {file_size_kb:.2f} KB")
    print("=" * 70)

if __name__ == "__main__":
    build_full_report()
