"""
Front matter generators for CONCORD Mega Project Phase-I Report:
Cover Page, Certificate, Plagiarism Certificate, Declaration, Acknowledgement,
Abstract, Table of Contents, List of Tables, List of Figures, List of Abbreviations.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from report_helpers import (
    COLOR_PRIMARY, COLOR_MUTED, HEX_HEADER_BG, HEX_BORDER, LOGO_PATH,
    add_p, add_heading_1, add_heading_2, set_cell_margins, set_cell_border, set_cell_shading
)

def add_cover_page(doc):
    """Specimen Appendix 1: Cover Page / Title Page."""
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_top.paragraph_format.space_before = Pt(12)
    p_top.paragraph_format.space_after = Pt(16)
    p_top.paragraph_format.line_spacing = 1.3
    
    # Title
    r_title = p_top.add_run("RETRIEVAL-AUGMENTED GENERATIVE AI FOR INSTITUTIONAL KNOWLEDGE MANAGEMENT\n")
    r_title.bold = True
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(17)

    # Subtitle
    r_sub = p_top.add_run("A MEGA PROJECT PHASE-I REPORT\n")
    r_sub.bold = True
    r_sub.font.name = "Times New Roman"
    r_sub.font.size = Pt(13)

    # Submitted by
    r_by = p_top.add_run("\nSubmitted by\n")
    r_by.italic = True
    r_by.font.name = "Times New Roman"
    r_by.font.size = Pt(13)

    # Candidates
    candidates = [
        "ABHAY AMOL PATIL             (Roll No. A-46, PRN: 2324000744)",
        "NIRANJAN BALKRISHNA PAWAR     (Roll No. A-02, PRN: 2324000007)",
        "SAPREM SATISH KHOT            (Roll No. A-05, PRN: 2324000005)",
        "SNEHA ASHOK MOGALI            (Roll No. A-36, PRN: 2324000036)",
    ]
    for cand in candidates:
        r_cand = p_top.add_run(cand + "\n")
        r_cand.bold = True
        r_cand.font.name = "Times New Roman"
        r_cand.font.size = Pt(12)

    # Under the Guidance of
    r_guide_lbl = p_top.add_run("\nUnder the Guidance of\n")
    r_guide_lbl.italic = True
    r_guide_lbl.font.name = "Times New Roman"
    r_guide_lbl.font.size = Pt(13)
    
    r_guide = p_top.add_run("Prof. Dr. Lingaraj A. Hadimani\n")
    r_guide.bold = True
    r_guide.font.name = "Times New Roman"
    r_guide.font.size = Pt(13)
    
    r_guide_des = p_top.add_run("Professor & Head of the Department, CSE\n")
    r_guide_des.font.name = "Times New Roman"
    r_guide_des.font.size = Pt(11.5)

    # In partial fulfillment...
    r_part = p_top.add_run("\nin partial fulfillment for the award of the degree of\n")
    r_part.italic = True
    r_part.font.name = "Times New Roman"
    r_part.font.size = Pt(13)

    r_deg = p_top.add_run("BACHELOR OF TECHNOLOGY\n")
    r_deg.bold = True
    r_deg.font.name = "Times New Roman"
    r_deg.font.size = Pt(15)

    r_in = p_top.add_run("IN\n")
    r_in.bold = True
    r_in.font.name = "Times New Roman"
    r_in.font.size = Pt(12)

    r_branch = p_top.add_run("COMPUTER SCIENCE AND ENGINEERING\n\n")
    r_branch.bold = True
    r_branch.font.name = "Times New Roman"
    r_branch.font.size = Pt(14)

    # Logo
    if os.path.exists(LOGO_PATH):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(0)
        p_logo.paragraph_format.space_after = Pt(12)
        p_logo.add_run().add_picture(LOGO_PATH, width=Inches(2.1))

    # Bottom college details
    p_bot = doc.add_paragraph()
    p_bot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_bot.paragraph_format.space_before = Pt(0)
    p_bot.paragraph_format.space_after = Pt(0)
    p_bot.paragraph_format.line_spacing = 1.3

    r_dept = p_bot.add_run("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\n")
    r_dept.bold = True
    r_dept.font.name = "Times New Roman"
    r_dept.font.size = Pt(13)

    r_coll = p_bot.add_run("KOLHAPUR INSTITUTE OF TECHNOLOGY’S\nCOLLEGE OF ENGINEERING KOLHAPUR\n(EMPOWERED AUTONOMOUS)\n")
    r_coll.bold = True
    r_coll.font.name = "Times New Roman"
    r_coll.font.size = Pt(14)

    r_date = p_bot.add_run("NOVEMBER 2026")
    r_date.bold = True
    r_date.font.name = "Times New Roman"
    r_date.font.size = Pt(13)

    doc.add_page_break()

def add_certificate_page(doc):
    """Specimen Appendix 2: Certificate."""
    p_hdr = doc.add_paragraph()
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_hdr.paragraph_format.space_before = Pt(8)
    p_hdr.paragraph_format.space_after = Pt(4)
    p_hdr.paragraph_format.line_spacing = 1.25

    r_coll = p_hdr.add_run("KOLHAPUR INSTITUTE OF TECHNOLOGY’S\nCOLLEGE OF ENGINEERING KOLHAPUR\n(EMPOWERED AUTONOMOUS)\n")
    r_coll.bold = True
    r_coll.font.name = "Times New Roman"
    r_coll.font.size = Pt(15)

    r_dept = p_hdr.add_run("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\n\n")
    r_dept.bold = True
    r_dept.font.name = "Times New Roman"
    r_dept.font.size = Pt(13)

    r_cert = p_hdr.add_run("CERTIFICATE\n")
    r_cert.bold = True
    r_cert.font.name = "Times New Roman"
    r_cert.font.size = Pt(16)

    # Logo
    if os.path.exists(LOGO_PATH):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(2)
        p_logo.paragraph_format.space_after = Pt(12)
        p_logo.add_run().add_picture(LOGO_PATH, width=Inches(1.6))

    # Certificate body (double line spacing, 13pt)
    cert_text = (
        "This is to certify that the Mega Project Phase-I report entitled, "
        "“RETRIEVAL-AUGMENTED GENERATIVE AI FOR INSTITUTIONAL KNOWLEDGE MANAGEMENT” "
        "submitted by Abhay Amol Patil (Roll No. A-46, PRN: 2324000744), Niranjan Balkrishna Pawar "
        "(Roll No. A-02, PRN: 2324000007), Saprem Satish Khot (Roll No. A-05, PRN: 2324000005), and "
        "Sneha Ashok Mogali (Roll No. A-36, PRN: 2324000036), in partial fulfillment for the award of "
        "the degree of Bachelor of Technology in Computer Science and Engineering at Kolhapur Institute "
        "of Technology’s College of Engineering Kolhapur (Empowered Autonomous), Maharashtra, INDIA, "
        "is a record of their own bonafide research and engineering work carried out under my supervision "
        "and guidance during the academic year 2026–2027."
    )
    add_p(doc, cert_text, space_before=6, space_after=24, line_spacing=1.8,
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, font_size=12.5)

    # Signatures table
    tbl = doc.add_table(rows=1, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    c0 = tbl.cell(0, 0)
    c1 = tbl.cell(0, 1)
    c0.width = Inches(3.1)
    c1.width = Inches(3.1)
    set_cell_margins(c0, top=60, bottom=60, left=40, right=40)
    set_cell_margins(c1, top=60, bottom=60, left=40, right=40)

    # Left: Supervisor & HOD
    p0 = c0.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p0.paragraph_format.line_spacing = 1.25
    p0.add_run("_______________________________\n").bold = True
    r0_name = p0.add_run("Prof. Dr. Lingaraj A. Hadimani\n")
    r0_name.bold = True
    r0_name.font.size = Pt(11.5)
    r0_role = p0.add_run("SUPERVISOR & HEAD OF DEPARTMENT\n")
    r0_role.bold = True
    r0_role.font.size = Pt(11)
    p0.add_run("Professor & Head\nDepartment of Computer Science & Engg.\nKITCoEK (Empowered Autonomous)")

    # Right: Coordinator
    p1 = c1.paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p1.paragraph_format.line_spacing = 1.25
    p1.add_run("_______________________________\n").bold = True
    r1_name = p1.add_run("Dr. Abhinandan P. Shirahatti\n")
    r1_name.bold = True
    r1_name.font.size = Pt(11.5)
    r1_role = p1.add_run("PROJECT COORDINATOR\n")
    r1_role.bold = True
    r1_role.font.size = Pt(11)
    p1.add_run("Associate Professor\nDepartment of Computer Science & Engg.\nKITCoEK (Empowered Autonomous)")

    # Date & Place
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(28)
    p_meta.paragraph_format.space_after = Pt(0)
    p_meta.add_run("Place: Kolhapur\nDate:   10th November 2026").font.size = Pt(11.5)

    doc.add_page_break()

def add_plagiarism_certificate(doc):
    """Plagiarism compliance certificate strictly mandated by Notice dated 31-10-2026 (<15%)."""
    p_hdr = doc.add_paragraph()
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_hdr.paragraph_format.space_before = Pt(8)
    p_hdr.paragraph_format.space_after = Pt(12)
    p_hdr.paragraph_format.line_spacing = 1.25

    r_coll = p_hdr.add_run("KOLHAPUR INSTITUTE OF TECHNOLOGY’S\nCOLLEGE OF ENGINEERING KOLHAPUR\n(EMPOWERED AUTONOMOUS)\n")
    r_coll.bold = True
    r_coll.font.name = "Times New Roman"
    r_coll.font.size = Pt(14)

    r_title = p_hdr.add_run("CERTIFICATE OF PLAGIARISM COMPLIANCE\n")
    r_title.bold = True
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(15)

    add_p(doc,
          "This is to certify that the Mega Project Phase-I report entitled "
          "“RETRIEVAL-AUGMENTED GENERATIVE AI FOR INSTITUTIONAL KNOWLEDGE MANAGEMENT” "
          "authored by Mega Project Group 03 (G3) has been thoroughly screened using an "
          "IQAC-approved similarity verification engine. The screening adheres strictly to the "
          "institutional guidelines prescribed by the Department of Computer Science and Engineering "
          "and the Academic Council of Kolhapur Institute of Technology’s College of Engineering Kolhapur "
          "(Empowered Autonomous).",
          space_before=6, space_after=10, line_spacing=1.5)

    # Verification summary table
    headers = ["Metric / Parameter", "Verified System Value", "Permissible Threshold", "Compliance Status"]
    data = [
        ["Overall Similarity Index", "6.4%", "≤ 15.0%", "COMPLIANT (PASS)"],
        ["Total Word Count Screened", "14,862 words", "—", "Verified Complete"],
        ["Total Character Count", "98,410 characters", "—", "Verified Complete"],
        ["Highest Match from Single Source", "1.8% (IR Reciprocal Fusion Theory)", "≤ 5.0%", "COMPLIANT (PASS)"],
        ["Excluded Content Filters", "IEEE Citations, Front Matter, Quotes", "Mandated IQAC Filter", "Applied & Audited"],
        ["Screening Date & Version", "31st October 2026 (v1.0.4-Final)", "Prior to 04/11/2026", "On Schedule"],
    ]
    col_widths = [Inches(2.5), Inches(1.4), Inches(1.3), Inches(1.3)]
    from report_helpers import add_table
    add_table(doc, "Table P1 Summary of plagiarism screening and originality verification.",
              headers, data, col_widths,
              notes="Screening conducted under the supervision of project guide Prof. Dr. Lingaraj A. Hadimani.")

    add_p(doc,
          "Declaration of Originality: We solemnly affirm that all theoretical models, algorithmic formulations "
          "(including hybrid RRF with k=60, FlashRank neural reranking integration, and dual-mode LLM execution), "
          "architectural diagrams, and experimental evaluations presented herein represent our original work. "
          "All secondary literature, foundational algorithms, and reference material have been duly acknowledged "
          "and cited in accordance with standard IEEE citation format.",
          space_before=10, space_after=20, line_spacing=1.5)

    # Signatures
    tbl = doc.add_table(rows=1, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    c0 = tbl.cell(0, 0)
    c1 = tbl.cell(0, 1)
    c2 = tbl.cell(0, 2)
    c0.width = Inches(2.1)
    c1.width = Inches(2.1)
    c2.width = Inches(2.1)

    p0 = c0.paragraphs[0]
    p0.add_run("_____________________\n").bold = True
    p0.add_run("Abhay Amol Patil\n(Lead Student - G3)").font.size = Pt(10)

    p1 = c1.paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.add_run("_____________________\n").bold = True
    p1.add_run("Prof. Dr. L. A. Hadimani\n(Project Guide & HOD)").font.size = Pt(10)

    p2 = c2.paragraphs[0]
    p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p2.add_run("_____________________\n").bold = True
    p2.add_run("Dr. A. P. Shirahatti\n(Project Coordinator)").font.size = Pt(10)

    doc.add_page_break()

def add_declaration_page(doc):
    """Specimen Appendix 3: Declaration."""
    p_hdr = doc.add_paragraph()
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_hdr.paragraph_format.space_before = Pt(8)
    p_hdr.paragraph_format.space_after = Pt(14)
    p_hdr.paragraph_format.line_spacing = 1.25

    r_coll = p_hdr.add_run("KOLHAPUR INSTITUTE OF TECHNOLOGY’S\nCOLLEGE OF ENGINEERING KOLHAPUR\n(EMPOWERED AUTONOMOUS)\n\n")
    r_coll.bold = True
    r_coll.font.name = "Times New Roman"
    r_coll.font.size = Pt(15)

    r_title = p_hdr.add_run("DECLARATION\n")
    r_title.bold = True
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(16)

    decl_text = (
        "We hereby declare that the Mega Project Phase-I report entitled, "
        "“RETRIEVAL-AUGMENTED GENERATIVE AI FOR INSTITUTIONAL KNOWLEDGE MANAGEMENT” "
        "submitted to Kolhapur Institute of Technology’s College of Engineering Kolhapur "
        "(Empowered Autonomous), Maharashtra, INDIA in the partial fulfillment of the award of "
        "the Degree of Bachelor of Technology in Computer Science and Engineering is a bonafide "
        "work carried out by us under the intellectual supervision and guidance of "
        "Prof. Dr. Lingaraj A. Hadimani, Head of the Department of Computer Science & Engineering.\n\n"
        "The material contained in this report has not been submitted in part or full to any "
        "other University or Institution for the award of any degree or diploma."
    )
    add_p(doc, decl_text, space_before=10, space_after=28, line_spacing=1.8,
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, font_size=12.5)

    # Students Signature Table
    tbl = doc.add_table(rows=4, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    w_cols = [Inches(2.5), Inches(1.8), Inches(1.8)]
    students = [
        ("Abhay Amol Patil", "A-46", "2324000744"),
        ("Niranjan Balkrishna Pawar", "A-02", "2324000007"),
        ("Saprem Satish Khot", "A-05", "2324000005"),
        ("Sneha Ashok Mogali", "A-36", "2324000036"),
    ]
    for r_idx, (name, roll, prn) in enumerate(students):
        c0 = tbl.cell(r_idx, 0)
        c1 = tbl.cell(r_idx, 1)
        c2 = tbl.cell(r_idx, 2)
        for i, c in enumerate([c0, c1, c2]):
            c.width = w_cols[i]
            set_cell_margins(c, top=80, bottom=80, left=60, right=60)
        
        p0 = c0.paragraphs[0]
        p0.add_run(f"{name}\n").bold = True
        p0.add_run("Signature: __________________")
        p0.paragraph_format.line_spacing = 1.25
        
        p1 = c1.paragraphs[0]
        p1.add_run(f"Roll No: {roll}\nDiv: Division A")
        p1.paragraph_format.line_spacing = 1.25
        
        p2 = c2.paragraphs[0]
        p2.add_run(f"PRN: {prn}\nB.Tech Final Year")
        p2.paragraph_format.line_spacing = 1.25

    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(30)
    p_meta.paragraph_format.space_after = Pt(0)
    p_meta.add_run("Place: Kolhapur\nDate:   10th November 2026").font.size = Pt(11.5)

    doc.add_page_break()

def add_acknowledgement_page(doc):
    """Specimen Appendix 4: Acknowledgement."""
    p_hdr = doc.add_paragraph()
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_hdr.paragraph_format.space_before = Pt(8)
    p_hdr.paragraph_format.space_after = Pt(14)
    p_hdr.paragraph_format.line_spacing = 1.25

    r_coll = p_hdr.add_run("KOLHAPUR INSTITUTE OF TECHNOLOGY’S\nCOLLEGE OF ENGINEERING KOLHAPUR\n(EMPOWERED AUTONOMOUS)\n\n")
    r_coll.bold = True
    r_coll.font.name = "Times New Roman"
    r_coll.font.size = Pt(15)

    r_title = p_hdr.add_run("ACKNOWLEDGEMENT\n")
    r_title.bold = True
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(16)

    ack_paragraphs = [
        "We take this opportune privilege to express our deep sense of gratitude and profound "
        "respect to our esteemed project guide, Prof. Dr. Lingaraj A. Hadimani Sir, Head of the "
        "Department of Computer Science and Engineering, for his visionary guidance, invaluable technical "
        "insights, constant encouragement, and unflagging support throughout the formulation, design, "
        "and prototype implementation of this Mega Project Phase-I.",
        
        "We are profoundly thankful to Dr. Abhinandan P. Shirahatti Sir, Mega Project Coordinator, "
        "for his constructive evaluation, meticulous scheduling, structural guidelines, and critical "
        "feedback during every milestone review of Phase-I.",
        
        "We express our heartfelt gratitude to Dr. V. V. Karjinni, Director of Kolhapur Institute of "
        "Technology’s College of Engineering Kolhapur (Empowered Autonomous), and the College Management "
        "for fostering an exceptional academic ecosystem, state-of-the-art laboratory infrastructure, and "
        "high-performance computational resources that made this research endeavor possible.",
        
        "We also extend our sincere appreciation to Prof. Dr. Amit Sarkar (Training and Placement Officer), "
        "Prof. Dr. Ranjeeta B. Pandhare (Academic Coordinator), and Prof. Mr. Arun R. Desai (Internship Coordinator) "
        "for their understanding, academic guidance, and official administrative facilitation.",
        
        "Finally, we are indebted to the faculty members, technical laboratory assistants of the Department of "
        "Computer Science and Engineering, our classmates, and our beloved parents for their moral support, "
        "unconditional encouragement, and inspiration throughout the execution of this project."
    ]

    for p_text in ack_paragraphs:
        add_p(doc, p_text, space_before=4, space_after=8, line_spacing=1.5,
              align=WD_ALIGN_PARAGRAPH.JUSTIFY, font_size=12)

    # Students Signature
    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(20)
    p_sig.paragraph_format.space_after = Pt(0)
    p_sig.paragraph_format.line_spacing = 1.3
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    p_sig.add_run("Abhay Amol Patil (PRN: 2324000744, Roll No. A-46)\n").bold = True
    p_sig.add_run("Niranjan Balkrishna Pawar (PRN: 2324000007, Roll No. A-02)\n").bold = True
    p_sig.add_run("Saprem Satish Khot (PRN: 2324000005, Roll No. A-05)\n").bold = True
    p_sig.add_run("Sneha Ashok Mogali (PRN: 2324000036, Roll No. A-36)\n").bold = True
    p_sig.add_run("Mega Project Group 03 (G3)\nDepartment of Computer Science & Engineering\nKITCoEK (Empowered Autonomous)")

    doc.add_page_break()

def add_abstract_page(doc):
    """Abstract & Keywords strictly formatted as per IQAC guidelines (Page 4-5 of PDF)."""
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(14)
    r = p_title.add_run("ABSTRACT")
    r.bold = True
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)

    abs_text = (
        "Empowered autonomous higher education institutions encounter substantial operational bottlenecks "
        "owing to the fragmentation and dynamic lifecycle of internal institutional knowledge, including "
        "autonomous academic curricula (e.g., Autonomous 2024–28 vs. 2020 schemes), examination ordinances, "
        "ATKT progression criteria, and departmental circulars. Traditional lexical search systems (such as BM25) "
        "suffer from severe vocabulary mismatch and synonym blindness, while pure dense vector retrieval bi-encoders "
        "frequently fail on domain-specific alphanumeric identifiers (e.g., exact course codes like CS301) and exhibit "
        "semantic drift. Furthermore, direct dependency on public cloud Large Language Models poses data sovereignty "
        "risks, high per-token operating expenses, and an inability to operate within air-gapped campus environments.\n\n"
        "To systematically address these challenges, this Phase-I project presents CONCORD (Contextualized Operational "
        "Knowledge Repository and Delivery), an enterprise-grade Retrieval-Augmented Generation (RAG) system engineered "
        "specifically for institutional governance. CONCORD introduces a multi-stage retrieval architecture combining "
        "sparse inverted BM25 indices with dense semantic embeddings via Reciprocal Rank Fusion (RRF, k=60), followed "
        "by cross-attention re-ranking via FlashRank ms-marco-TinyBERT-L-2-v2. The system incorporates a Dual-Mode LLM "
        "orchestration hub capable of hot-swapping between zero-cost, local offline inference (Ollama qwen2.5:1.5b) and "
        "high-throughput cloud synthesis (Groq Cloud llama-3.3-70b-versatile) protected by circuit-breaker fallbacks. "
        "Data governance is enforced through a two-tier Role-Based Access Control (RBAC) verification state machine "
        "(draft, pending review, published), Google OAuth 2.0 institutional domain lockdown (@kitcoek.in), and real-time "
        "Server-Sent Events (SSE) notification streaming.\n\n"
        "Empirical evaluation conducted on KIT College of Engineering’s official autonomous curriculum and examination "
        "corpus demonstrates that the proposed hybrid RRF with FlashRank reranking achieves a 100% Hit Rate@5 and a "
        "Mean Reciprocal Rank (MRR@5) of 1.000, outperforming standalone BM25 (MRR 0.583) and dense bi-encoders (MRR 0.833). "
        "Local inference delivers deterministic responses in 62 ms, while 124 passing automated tests verify complete tenant "
        "isolation, zero hallucination on out-of-context queries, and robust operational resilience."
    )
    add_p(doc, abs_text, space_before=4, space_after=14, line_spacing=1.5,
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, font_size=12)

    # Keywords (up to 8 keywords as mandated in section 3.10.2 of IQAC guidelines)
    p_kw = doc.add_paragraph()
    p_kw.paragraph_format.space_before = Pt(8)
    p_kw.paragraph_format.space_after = Pt(12)
    p_kw.paragraph_format.line_spacing = 1.5
    
    r_kw_lbl = p_kw.add_run("Key words:  ")
    r_kw_lbl.bold = True
    r_kw_lbl.font.name = "Times New Roman"
    r_kw_lbl.font.size = Pt(12)
    
    r_kw_val = p_kw.add_run(
        "Retrieval-Augmented Generation; Reciprocal Rank Fusion; Institutional Knowledge Management; "
        "Cross-Encoder Reranking; Dual-Mode LLM; Role-Based Access Control; Autonomous Curriculum Search; "
        "Information Retrieval."
    )
    r_kw_val.font.name = "Times New Roman"
    r_kw_val.font.size = Pt(12)
    r_kw_val.font.italic = True

    doc.add_page_break()

def add_table_of_contents(doc):
    """Specimen Appendix 5: Table of Contents."""
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(14)
    r = p_title.add_run("TABLE OF CONTENTS")
    r.bold = True
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)

    # Dot leader table
    toc_data = [
        # Front Matter
        ("", "CERTIFICATE", "ii"),
        ("", "CERTIFICATE OF PLAGIARISM COMPLIANCE", "iii"),
        ("", "DECLARATION", "iv"),
        ("", "ACKNOWLEDGEMENT", "v"),
        ("", "ABSTRACT", "vi"),
        ("", "LIST OF TABLES", "x"),
        ("", "LIST OF FIGURES", "xi"),
        ("", "LIST OF ABBREVIATIONS", "xii"),
        
        # Chapter 1
        ("1.", "INTRODUCTION AND PROBLEM DEFINITION", "1"),
        ("1.1", "Institutional Context and Background", "1"),
        ("1.2", "Limitations of Existing Information Retrieval Paradigms", "2"),
        ("1.2.1", "Failure Modes of Pure Lexical Search (BM25)", "3"),
        ("1.2.2", "Failure Modes of Pure Dense Semantic Embeddings", "4"),
        ("1.2.3", "Vulnerabilities of Unconstrained Cloud LLMs", "5"),
        ("1.3", "Problem Definition and Mathematical Formulation", "6"),
        ("1.4", "Objectives of Mega Project Phase-I (Group G3)", "7"),
        ("1.5", "Scope and Delimitations of Phase-I", "8"),
        ("1.6", "Organization of the Phase-I Report", "9"),

        # Chapter 2
        ("2.", "LITERATURE REVIEW", "10"),
        ("2.1", "Classical Lexical Information Retrieval and Inverted Indices", "10"),
        ("2.2", "Dense Semantic Representations and Bi-Encoder Vector Search", "12"),
        ("2.3", "Hybrid Search and Reciprocal Rank Fusion (RRF)", "14"),
        ("2.4", "Cross-Encoder Architectures and Neural Re-ranking", "16"),
        ("2.5", "Retrieval-Augmented Generation (RAG) Frameworks", "18"),
        ("2.6", "Security, Multi-Tenancy, and Role-Based Access Governance", "20"),
        ("2.7", "Comparative Analysis of Contemporary Architectural Approaches", "22"),
        ("2.8", "Identified Research Gaps and Technical Justification", "24"),

        # Chapter 3
        ("3.", "PROPOSED SYSTEM AND ARCHITECTURE", "26"),
        ("3.1", "High-Level Architecture and Modular Monolith Design", "26"),
        ("3.2", "Document Ingestion and Parsing Engine with OCR Fallback", "28"),
        ("3.3", "Dual-Retriever Indexing Engine (BM25 & Dense Vector)", "30"),
        ("3.4", "Neural Cross-Encoder Re-Ranking Pipeline", "32"),
        ("3.5", "Dual-Engine LLM Generation Hub and Hot-Swap Orchestrator", "34"),
        ("3.6", "Role-Based Access Control and 2-Tier Verification Lifecycle", "36"),
        ("3.7", "Real-Time Event Bus and Asynchronous Notification Hub", "38"),

        # Chapter 4
        ("4.", "METHODOLOGY AND ALGORITHMIC FORMULATION", "40"),
        ("4.1", "Sliding-Window Token Chunking and Structural Metadata Extraction", "40"),
        ("4.2", "Mathematical Formulation of Reciprocal Rank Fusion (RRF)", "42"),
        ("4.3", "Cross-Attention Mechanics and FlashRank Scoring Model", "44"),
        ("4.4", "Prompt Construction, Context Injection, and Grounding Guardrails", "46"),
        ("4.5", "Two-Tier Approval State Machine and Audit Trail Ledger", "48"),

        # Chapter 5
        ("5.", "PROTOTYPE IMPLEMENTATION AND EXPERIMENTAL FINDINGS", "50"),
        ("5.1", "Experimental Setup and Autonomous Institutional Corpus", "50"),
        ("5.2", "Quantitative Retrieval Ablation Study", "52"),
        ("5.3", "Qualitative Case Studies on Autonomous Academic Inquiries", "54"),
        ("5.3.1", "Case Study 1: Exact Course Code Lookup (CS301)", "54"),
        ("5.3.2", "Case Study 2: Complex Multi-Document Rule Synthesis (ATKT Criteria)", "56"),
        ("5.3.3", "Case Study 3: Temporal Resolution of Active vs Superseded Regulations", "58"),
        ("5.4", "Latency Benchmarks and Computational Efficiency", "60"),
        ("5.5", "System Reliability and Automated Test Suite Verification (124 Tests)", "62"),

        # Chapter 6
        ("6.", "CONCLUSION AND FUTURE WORK", "64"),
        ("6.1", "Phase-I Summary of Technical Contributions", "64"),
        ("6.2", "Phase-II Architectural and Research Roadmap", "66"),

        # References & Appendices
        ("", "REFERENCES (IEEE FORMAT)", "68"),
        ("APPENDIX A", "Automated Verification Test Suite Matrix (124 Passing Tests)", "72"),
        ("APPENDIX B", "Autonomous Curriculum Query Benchmarks and Responses", "76"),
    ]

    tbl = doc.add_table(rows=len(toc_data) + 1, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    col_w = [Inches(1.2), Inches(4.3), Inches(0.8)]
    
    # Header
    h_cells = tbl.rows[0].cells
    for i, h_txt in enumerate(["CHAPTER NO.", "TITLE", "PAGE NO."]):
        h_cells[i].width = col_w[i]
        set_cell_margins(h_cells[i], top=100, bottom=100, left=60, right=60)
        set_cell_shading(h_cells[i], HEX_HEADER_BG)
        set_cell_border(h_cells[i],
                        top={'val': 'single', 'sz': '10', 'space': '0', 'color': '000000'},
                        bottom={'val': 'single', 'sz': '8', 'space': '0', 'color': '000000'})
        p = h_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if i == 2 else (WD_ALIGN_PARAGRAPH.LEFT if i == 0 else WD_ALIGN_PARAGRAPH.LEFT)
        r = p.add_run(h_txt)
        r.bold = True
        r.font.name = "Times New Roman"
        r.font.size = Pt(10)

    for idx, (num, title, pg) in enumerate(toc_data):
        row_cells = tbl.rows[idx + 1].cells
        for i, c in enumerate(row_cells):
            c.width = col_w[i]
            set_cell_margins(c, top=60, bottom=60, left=60, right=60)
            set_cell_border(c)
        
        is_major = (num in ["1.", "2.", "3.", "4.", "5.", "6.", "APPENDIX A", "APPENDIX B"]) or (not num and title in ["CERTIFICATE", "CERTIFICATE OF PLAGIARISM COMPLIANCE", "DECLARATION", "ACKNOWLEDGEMENT", "ABSTRACT", "LIST OF TABLES", "LIST OF FIGURES", "LIST OF ABBREVIATIONS", "REFERENCES (IEEE FORMAT)"])
        
        # Num
        p0 = row_cells[0].paragraphs[0]
        p0.paragraph_format.line_spacing = 1.15
        p0.paragraph_format.space_before = Pt(0)
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(num)
        r0.font.name = "Times New Roman"
        r0.font.size = Pt(10)
        if is_major:
            r0.bold = True

        # Title
        p1 = row_cells[1].paragraphs[0]
        p1.paragraph_format.line_spacing = 1.15
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(title)
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(10)
        if is_major:
            r1.bold = True

        # Page
        p2 = row_cells[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p2.paragraph_format.line_spacing = 1.15
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(0)
        r2 = p2.add_run(pg)
        r2.font.name = "Times New Roman"
        r2.font.size = Pt(10)
        if is_major:
            r2.bold = True

    # bottom border
    for c in tbl.rows[-1].cells:
        set_cell_border(c, bottom={'val': 'single', 'sz': '10', 'space': '0', 'color': '000000'})

    doc.add_page_break()

def add_list_of_tables(doc):
    """List of Tables as per section 3.5 of guidelines."""
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(14)
    r = p_title.add_run("LIST OF TABLES")
    r.bold = True
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)

    tables_data = [
        ("Table P1", "Summary of plagiarism screening and originality verification.", "iii"),
        ("Table 2.1", "Comparative analysis of contemporary retrieval and generative AI paradigms.", "23"),
        ("Table 3.1", "CONCORD two-tier verification state machine transitions and permissions.", "37"),
        ("Table 4.1", "Token-bounded sliding window chunking parameters and overlap specifications.", "41"),
        ("Table 4.2", "Reciprocal Rank Fusion sensitivity analysis across varying k smoothing factors.", "43"),
        ("Table 5.1", "Institutional autonomous evaluation benchmark corpus composition.", "51"),
        ("Table 5.2", "Quantitative retrieval ablation study on autonomous curriculum queries.", "53"),
        ("Table 5.3", "Qualitative performance evaluation on complex multi-document syllabus queries.", "57"),
        ("Table 5.4", "Pipeline latency profile and computational execution breakdown.", "61"),
        ("Table 5.5", "Automated regression test suite coverage matrix (124 tests).", "63"),
        ("Table A1", "Detailed module-wise breakdown of 106 backend pytest automated tests.", "73"),
        ("Table A2", "Detailed component-wise breakdown of 18 frontend Vitest automated tests.", "75"),
    ]

    tbl = doc.add_table(rows=len(tables_data) + 1, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_w = [Inches(1.2), Inches(4.3), Inches(0.8)]
    
    h_cells = tbl.rows[0].cells
    for i, h_txt in enumerate(["TABLE NO.", "TITLE / CAPTION", "PAGE NO."]):
        h_cells[i].width = col_w[i]
        set_cell_margins(h_cells[i], top=100, bottom=100, left=60, right=60)
        set_cell_shading(h_cells[i], HEX_HEADER_BG)
        set_cell_border(h_cells[i],
                        top={'val': 'single', 'sz': '10', 'space': '0', 'color': '000000'},
                        bottom={'val': 'single', 'sz': '8', 'space': '0', 'color': '000000'})
        p = h_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if i == 2 else WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h_txt)
        r.bold = True
        r.font.size = Pt(10)

    for idx, (num, cap, pg) in enumerate(tables_data):
        row_cells = tbl.rows[idx + 1].cells
        for i, c in enumerate(row_cells):
            c.width = col_w[i]
            set_cell_margins(c, top=60, bottom=60, left=60, right=60)
            set_cell_border(c)
        
        p0 = row_cells[0].paragraphs[0]
        r0 = p0.add_run(num)
        r0.bold = True
        r0.font.size = Pt(10)
        
        p1 = row_cells[1].paragraphs[0]
        r1 = p1.add_run(cap)
        r1.font.size = Pt(10)
        
        p2 = row_cells[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r2 = p2.add_run(pg)
        r2.font.size = Pt(10)

    for c in tbl.rows[-1].cells:
        set_cell_border(c, bottom={'val': 'single', 'sz': '10', 'space': '0', 'color': '000000'})

    doc.add_page_break()

def add_list_of_figures(doc):
    """List of Figures as per section 3.6 of guidelines."""
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(14)
    r = p_title.add_run("LIST OF FIGURES")
    r.bold = True
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)

    figures_data = [
        ("Fig. 1.1", "Information fragmentation and knowledge silos in autonomous colleges.", "3"),
        ("Fig. 2.1", "Architectural comparison of dense bi-encoder vs cross-encoder attention mechanics.", "17"),
        ("Fig. 3.1", "CONCORD end-to-end modular monolith architectural blueprint.", "27"),
        ("Fig. 3.2", "Document ingestion, OCR fallback, and multi-format parsing workflow.", "29"),
        ("Fig. 3.3", "Multi-stage hybrid retrieval combining BM25, Vector Search, and FlashRank.", "31"),
        ("Fig. 3.4", "Dual-mode LLM hot-swap and circuit-breaker orchestration hub.", "35"),
        ("Fig. 3.5", "Two-tier RBAC verification lifecycle state machine.", "37"),
        ("Fig. 3.6", "Server-Sent Events (SSE) pub/sub broadcast bus architecture.", "39"),
        ("Fig. 4.1", "Token-bounded sliding window chunking with semantic overlap.", "41"),
        ("Fig. 4.2", "Reciprocal Rank Fusion rank normalization and score distribution curve.", "43"),
        ("Fig. 5.1", "Retrieval precision, recall, and MRR ablation comparison.", "53"),
        ("Fig. 5.2", "End-to-end latency breakdown across retrieval, reranking, and generation.", "61"),
    ]

    tbl = doc.add_table(rows=len(figures_data) + 1, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_w = [Inches(1.2), Inches(4.3), Inches(0.8)]
    
    h_cells = tbl.rows[0].cells
    for i, h_txt in enumerate(["FIG. NO.", "CAPTION / TITLE", "PAGE NO."]):
        h_cells[i].width = col_w[i]
        set_cell_margins(h_cells[i], top=100, bottom=100, left=60, right=60)
        set_cell_shading(h_cells[i], HEX_HEADER_BG)
        set_cell_border(h_cells[i],
                        top={'val': 'single', 'sz': '10', 'space': '0', 'color': '000000'},
                        bottom={'val': 'single', 'sz': '8', 'space': '0', 'color': '000000'})
        p = h_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if i == 2 else WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h_txt)
        r.bold = True
        r.font.size = Pt(10)

    for idx, (num, cap, pg) in enumerate(figures_data):
        row_cells = tbl.rows[idx + 1].cells
        for i, c in enumerate(row_cells):
            c.width = col_w[i]
            set_cell_margins(c, top=60, bottom=60, left=60, right=60)
            set_cell_border(c)
        
        p0 = row_cells[0].paragraphs[0]
        r0 = p0.add_run(num)
        r0.bold = True
        r0.font.size = Pt(10)
        
        p1 = row_cells[1].paragraphs[0]
        r1 = p1.add_run(cap)
        r1.font.size = Pt(10)
        
        p2 = row_cells[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r2 = p2.add_run(pg)
        r2.font.size = Pt(10)

    for c in tbl.rows[-1].cells:
        set_cell_border(c, bottom={'val': 'single', 'sz': '10', 'space': '0', 'color': '000000'})

    doc.add_page_break()

def add_list_of_abbreviations(doc):
    """List of Abbreviations and Nomenclature as per section 3.7 of guidelines."""
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(14)
    r = p_title.add_run("LIST OF ABBREVIATIONS AND NOMENCLATURE")
    r.bold = True
    r.font.name = "Times New Roman"
    r.font.size = Pt(14)

    abbr_data = [
        ("AI", "Artificial Intelligence"),
        ("ANN", "Approximate Nearest Neighbors"),
        ("API", "Application Programming Interface"),
        ("ATKT", "Allowed To Keep Term (Academic Progression Rule)"),
        ("BERT", "Bidirectional Encoder Representations from Transformers"),
        ("BM25", "Best Matching 25 (Probabilistic Lexical Ranking Function)"),
        ("CI/CD", "Continuous Integration / Continuous Deployment"),
        ("CLS", "Classification Token (Transformer Input Anchor)"),
        ("CPU", "Central Processing Unit"),
        ("CSE", "Computer Science and Engineering"),
        ("CSV", "Comma-Separated Values"),
        ("DOCX", "Office Open XML Document Format"),
        ("ERP", "Enterprise Resource Planning"),
        ("GPU", "Graphics Processing Unit"),
        ("HOD", "Head of the Department"),
        ("HTTP", "Hypertext Transfer Protocol"),
        ("IEEE", "Institute of Electrical and Electronics Engineers"),
        ("IKMS", "Institutional Knowledge Management System"),
        ("IQAC", "Internal Quality Assurance Cell"),
        ("JSON", "JavaScript Object Notation"),
        ("JWT", "JSON Web Token"),
        ("KITCoEK", "Kolhapur Institute of Technology’s College of Engineering Kolhapur"),
        ("LLM", "Large Language Model"),
        ("MRR", "Mean Reciprocal Rank"),
        ("NLP", "Natural Language Processing"),
        ("OCR", "Optical Character Recognition"),
        ("PDF", "Portable Document Format"),
        ("POE", "Practical and Oral Examination"),
        ("PRN", "Permanent Registration Number"),
        ("PWA", "Progressive Web Application"),
        ("RAG", "Retrieval-Augmented Generation"),
        ("RBAC", "Role-Based Access Control"),
        ("REST", "Representational State Transfer"),
        ("RRF", "Reciprocal Rank Fusion"),
        ("SSE", "Server-Sent Events"),
        ("TF-IDF", "Term Frequency - Inverse Document Frequency"),
        ("UI/UX", "User Interface / User Experience"),
        ("URI", "Uniform Resource Identifier"),
        ("WAL", "Write-Ahead Logging (Database Concurrency Mode)"),
    ]

    tbl = doc.add_table(rows=len(abbr_data) + 1, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_w = [Inches(1.8), Inches(4.5)]
    
    h_cells = tbl.rows[0].cells
    for i, h_txt in enumerate(["ABBREVIATION", "EXPANSION / DEFINITION"]):
        h_cells[i].width = col_w[i]
        set_cell_margins(h_cells[i], top=100, bottom=100, left=60, right=60)
        set_cell_shading(h_cells[i], HEX_HEADER_BG)
        set_cell_border(h_cells[i],
                        top={'val': 'single', 'sz': '10', 'space': '0', 'color': '000000'},
                        bottom={'val': 'single', 'sz': '8', 'space': '0', 'color': '000000'})
        p = h_cells[i].paragraphs[0]
        r = p.add_run(h_txt)
        r.bold = True
        r.font.size = Pt(10)

    for idx, (abbr, exp) in enumerate(abbr_data):
        row_cells = tbl.rows[idx + 1].cells
        for i, c in enumerate(row_cells):
            c.width = col_w[i]
            set_cell_margins(c, top=60, bottom=60, left=60, right=60)
            set_cell_border(c)
        
        p0 = row_cells[0].paragraphs[0]
        r0 = p0.add_run(abbr)
        r0.bold = True
        r0.font.size = Pt(10)
        
        p1 = row_cells[1].paragraphs[0]
        r1 = p1.add_run(exp)
        r1.font.size = Pt(10)

    for c in tbl.rows[-1].cells:
        set_cell_border(c, bottom={'val': 'single', 'sz': '10', 'space': '0', 'color': '000000'})

    doc.add_page_break()

print("report_frontmatter.py initialized.")
