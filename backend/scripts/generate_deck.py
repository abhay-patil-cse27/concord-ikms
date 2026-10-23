"""
Script to generate a clean, executive-ready, LIGHT-MODE PowerPoint presentation (.pptx)
for CONCORD IKMS Mega Project Viva Defense.
Designed with curated professional color palettes: crisp white canvas, deep navy headers,
slate text, refined corporate borders, soft-tinted highlight cards, and rich explanations.
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_light_deck(output_path="CONCORD_IKMS_Project_Presentation.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)  # 16:9 widescreen layout

    # Professional Light Mode Palette
    BG_LIGHT = RGBColor(248, 250, 252)        # Slate 50 (clean soft off-white)
    CARD_BG = RGBColor(255, 255, 255)         # Pure White Card
    CARD_BG_ALT = RGBColor(241, 245, 249)     # Slate 100
    BORDER_LIGHT = RGBColor(226, 232, 240)    # Slate 200 (subtle elegant border)
    BORDER_ACCENT = RGBColor(14, 116, 144)    # Cyan / Deep Teal 700
    
    # Typography Colors
    TEXT_NAVY = RGBColor(15, 23, 42)          # Slate 900 (deep readable charcoal/navy)
    TEXT_BODY = RGBColor(51, 65, 85)          # Slate 700 (high contrast body text)
    TEXT_MUTED = RGBColor(100, 116, 139)      # Slate 500 (secondary text)
    
    # Professional Accent Colors
    PRIMARY_BLUE = RGBColor(2, 132, 199)      # Sky 600 / Corporate Blue
    NAVY_PRIMARY = RGBColor(30, 58, 138)      # Blue 900 (Executive Navy)
    SUCCESS_GREEN = RGBColor(5, 150, 105)     # Emerald 600
    WARNING_AMBER = RGBColor(217, 119, 6)     # Amber 600
    CARD_ACCENT_BG = RGBColor(240, 249, 255)  # Soft Sky 50

    def add_blank_slide(bg_color=BG_LIGHT):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = bg_color
        bg.line.fill.background()
        return slide

    def add_header(slide, title, category="CONCORD IKMS • INSTITUTIONAL COGNITIVE PLATFORM • MEGA PROJECT 2026–27"):
        # Top accent decorative line
        accent_line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.35), Inches(11.7), Inches(0.04))
        accent_line.fill.solid()
        accent_line.fill.fore_color.rgb = PRIMARY_BLUE
        accent_line.line.fill.background()

        # Category pill text
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.48), Inches(11.7), Inches(0.35))
        tf = cat_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = category.upper()
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_BLUE

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.7), Inches(0.75))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(23)
        p.font.bold = True
        p.font.color.rgb = NAVY_PRIMARY

    def add_card(slide, left, top, width, height, title="", subtitle="", bg=CARD_BG, border=BORDER_LIGHT, border_width=1.0):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg
        card.line.color.rgb = border
        card.line.width = Pt(border_width)

        if title or subtitle:
            tb = slide.shapes.add_textbox(Inches(left + 0.25), Inches(top + 0.2), Inches(width - 0.5), Inches(height - 0.4))
            tf = tb.text_frame
            tf.word_wrap = True
            if title:
                p = tf.paragraphs[0]
                p.text = title
                p.font.size = Pt(15)
                p.font.bold = True
                p.font.color.rgb = NAVY_PRIMARY
            if subtitle:
                p2 = tf.add_paragraph()
                p2.text = subtitle
                p2.font.size = Pt(11)
                p2.font.bold = True
                p2.font.color.rgb = PRIMARY_BLUE
                p2.space_before = Pt(4)
            return tf
        return card

    # =========================================================================
    # SLIDE 1: TITLE SLIDE (Clean Executive Light Theme)
    # =========================================================================
    s1 = add_blank_slide(RGBColor(255, 255, 255))
    
    # Left vertical corporate bar
    vbar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.4), prs.slide_height)
    vbar.fill.solid()
    vbar.fill.fore_color.rgb = NAVY_PRIMARY
    vbar.line.fill.background()

    # Title content
    tb = s1.shapes.add_textbox(Inches(1.2), Inches(1.3), Inches(11.0), Inches(4.2))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "MEGA PROJECT 2026–27  •  COLLEGE OF ENGINEERING AND TECHNOLOGY"
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = PRIMARY_BLUE

    p1 = tf.add_paragraph()
    p1.text = "CONCORD"
    p1.font.size = Pt(56)
    p1.font.bold = True
    p1.font.color.rgb = NAVY_PRIMARY
    p1.space_before = Pt(8)

    p2 = tf.add_paragraph()
    p2.text = "Context-Oriented Cognitive Memory Layer for Multi-Source Knowledge Integration, Adaptive Retrieval, and Trust-Aware Institutional Intelligence"
    p2.font.size = Pt(17)
    p2.font.color.rgb = TEXT_BODY
    p2.space_before = Pt(12)

    p3 = tf.add_paragraph()
    p3.text = "An enterprise institutional intelligence platform providing high-precision grounded answers, cryptographic document provenance, and strict multi-tenant authorization."
    p3.font.size = Pt(13)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_before = Pt(10)

    # Metadata Footer Card
    card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(5.6), Inches(11.0), Inches(1.25))
    card.fill.solid()
    card.fill.fore_color.rgb = CARD_BG_ALT
    card.line.color.rgb = BORDER_LIGHT
    
    card_tb = s1.shapes.add_textbox(Inches(1.5), Inches(5.7), Inches(10.4), Inches(1.0))
    c_tf = card_tb.text_frame
    cp1 = c_tf.paragraphs[0]
    cp1.text = "Institution: Kolhapur Institute of Technology (Autonomous Institute)"
    cp1.font.size = Pt(13)
    cp1.font.bold = True
    cp1.font.color.rgb = NAVY_PRIMARY
    
    cp2 = c_tf.add_paragraph()
    cp2.text = "Department: Computer Science and Engineering  |  Implementation: Modular Monolith Architecture  |  Python 3.11 & React 18"
    cp2.font.size = Pt(11)
    cp2.font.color.rgb = TEXT_BODY
    cp2.space_before = Pt(4)

    # =========================================================================
    # SLIDE 2: THE PROBLEM STATEMENT (Detailed Explanations)
    # =========================================================================
    s2 = add_blank_slide()
    add_header(s2, "The Problem: Why Traditional Systems & Naive Chatbots Fail")

    w = 3.65
    gap = 0.35
    top_pos = 1.8
    h = 5.0

    # Card 1
    tf1 = add_card(s2, 0.8, top_pos, w, h, "1. Fragmented Institutional Silos", "Unstructured Heterogeneous Formats")
    p = tf1.add_paragraph()
    p.text = "• The Issue: Critical campus data is dispersed across 100-page academic syllabi, exam circulars, T&P notices, and administrative guidelines stored in PDFs, Word documents, and spreadsheets."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(8)
    p = tf1.add_paragraph()
    p.text = "• The Consequence: Students and faculty spend hours manually skimming files or rely on inaccurate word-of-mouth hearsay, leading to compliance failures."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(6)

    # Card 2
    tf2 = add_card(s2, 0.8 + w + gap, top_pos, w, h, "2. Policy Drift & Outdated Rules", "The 'Superseded Document' Dilemma")
    p = tf2.add_paragraph()
    p.text = "• The Issue: Colleges constantly revise regulations (e.g., 2020 Academic Regulations superseded by 2024 Autonomous Rules). Traditional databases retain both versions without lifecycle context."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(8)
    p = tf2.add_paragraph()
    p.text = "• The Consequence: Standard AI chatbots mix old and new rules together, quoting expired passing marks or incorrect fee structures with false confidence."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(6)

    # Card 3
    tf3 = add_card(s2, 0.8 + (w + gap)*2, top_pos, w, h, "3. Security & Vocabulary Mismatch", "Zero Tenant Isolation & Failed Code Searches")
    p = tf3.add_paragraph()
    p.text = "• The Issue: Institutional queries use specific course codes ('CS301'), circular IDs, and acronyms ('ATKT', 'ISE/ESE'). Dense vector search maps them to wrong generic semantic concepts."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(8)
    p = tf3.add_paragraph()
    p.text = "• The Consequence: Confidential records (payroll, disciplinary notices) leak across unauthorized student searches in naive RAG systems lacking RBAC."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(6)

    # =========================================================================
    # SLIDE 3: THE CONCORD SOLUTION (3 Strategic Pillars)
    # =========================================================================
    s3 = add_blank_slide()
    add_header(s3, "The CONCORD Solution: Three Guiding Architectural Pillars")

    tf1 = add_card(s3, 0.8, top_pos, w, h, "UNIFY", "End-to-End Institutional Ingestion")
    p = tf1.add_paragraph()
    p.text = "• Multi-Engine Parsing: Direct ingestion of PDF, DOCX, XLSX, and CSV files, retaining document hierarchies, headings, and tables."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(8)
    p = tf1.add_paragraph()
    p.text = "• OCR Adapter: Scans image-based circulars and notices via Tesseract/PaddleOCR when native text is missing."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(6)
    p = tf1.add_paragraph()
    p.text = "• Cryptographic Provenance: Generates SHA-256 tamper-evident checksums for every uploaded file version."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(6)

    tf2 = add_card(s3, 0.8 + w + gap, top_pos, w, h, "UNDERSTAND", "Hybrid Retrieval + Cross-Encoder")
    p = tf2.add_paragraph()
    p.text = "• Dense Semantic Search: 384-dimensional ONNX MiniLM vector embeddings capturing conceptual meaning."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(8)
    p = tf2.add_paragraph()
    p.text = "• BM25 Lexical Search: Exact keyword, circular ID, and course code inverted-index matching."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(6)
    p = tf2.add_paragraph()
    p.text = "• RRF & FlashRank Reranker: Reciprocal Rank Fusion blends candidate lists, and FlashRank cross-attention drives Hit Rate to 100%."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(6)

    tf3 = add_card(s3, 0.8 + (w + gap)*2, top_pos, w, h, "TRUST", "Defense-in-Depth & Grounded Proof")
    p = tf3.add_paragraph()
    p.text = "• OWASP ASVS 4.1 RBAC: Strict department tenancy at API, SQL, and Vector levels (0.0% security leakage)."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(8)
    p = tf3.add_paragraph()
    p.text = "• Clickable Citations: Interactive inline badges linking every claim to its exact page number and source excerpt."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(6)
    p = tf3.add_paragraph()
    p.text = "• Conflict Detection: Flags superseded regulations with explicit comparison warning tables."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(6)

    # =========================================================================
    # SLIDE 4: SYSTEM ARCHITECTURE (Modular Monolith)
    # =========================================================================
    s4 = add_blank_slide()
    add_header(s4, "System Architecture: Decoupled Modular Monolith")

    layers = [
        ("1. Presentation Layer (Frontend Client)", 
         "Built with React 18 & Vite. Implements a responsive institutional theme (light/dark), role quick-switcher pills, single-card chat interface with bottom-anchored composer, clickable citation modals, and dual-storage caching (sessionStorage + localStorage fallback).",
         PRIMARY_BLUE),
        ("2. Application Service & Security Core (FastAPI)", 
         "Python 3.11 async architecture with SQLAlchemy 2.0 ORM and Pydantic v2 schemas. Enforces OWASP ASVS 4.1 Role-Based Access Control, department tenant scoping, cryptographic SHA-256 audit chaining, and document lifecycle governance.",
         NAVY_PRIMARY),
        ("3. Cognitive Intelligence & Retrieval Pipelines", 
         "Academic query normalization and acronym expansion. Multi-engine parsing (PDF, Word, Excel, OCR). Dual hybrid retrieval combining dense ONNX MiniLM (384-d) with BM25 lexical search, Reciprocal Rank Fusion (RRF), FlashRank Cross-Encoder reranking, and Groq Cloud Llama 3.3.",
         PRIMARY_BLUE),
        ("4. Enterprise Persistence & Data Storage", 
         "Dual storage model: PostgreSQL 16 (or SQLite in Dev) for transactional users, documents, versions, and audit logs; Embedded ChromaDB for 384-d vector embeddings with index-level metadata filtering; and local/MinIO private object storage for file binaries.",
         NAVY_PRIMARY)
    ]

    for i, (l_title, l_desc, b_color) in enumerate(layers):
        top_y = 1.75 + (i * 1.3)
        tf = add_card(s4, 0.8, top_y, 11.7, 1.15, l_title, "", bg=CARD_BG, border=b_color, border_width=1.5)
        p = tf.add_paragraph()
        p.text = l_desc
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_BODY
        p.space_before = Pt(4)

    # =========================================================================
    # SLIDE 5: THE 5-STAGE RAG EXECUTION PIPELINE
    # =========================================================================
    s5 = add_blank_slide()
    add_header(s5, "The 5-Stage Native Retrieval & Grounding Pipeline")

    p_stages = [
        ("Stage 1", "Normalize & Expand", 
         "• Normalizes raw user input.\n• Expands college acronyms ('ATKT' → 'Allowed to Keep Term', 'ISE/ESE' → In/End-Semester Exam).\n• Cleans special characters."),
        ("Stage 2", "RBAC Tenant Guard", 
         "• Decodes user JWT token.\n• Checks role (Student/Faculty/Admin).\n• Restricts candidate pool strictly to public docs and assigned department.\n• Blocks unauthorized files before search."),
        ("Stage 3", "Hybrid Search", 
         "• Branch A: ONNX MiniLM local model converts query to 384-d dense vector.\n• Branch B: BM25 lexical token index matches exact circular numbers and course codes."),
        ("Stage 4", "RRF & FlashRank", 
         "• Blends sparse and dense candidate ranks using Reciprocal Rank Fusion (k=60).\n• Passes top candidates to FlashRank Cross-Encoder (TinyBERT) for deep contextual scoring."),
        ("Stage 5", "Grounded Synthesis", 
         "• Assembles verified context bundle.\n• Injects strict zero-hallucination prompt into Groq Cloud Llama 3.3 (or offline fallback).\n• Validates citations server-side before rendering.")
    ]

    step_w = 2.15
    step_gap = 0.24
    for i, (st, st_title, st_desc) in enumerate(p_stages):
        x = 0.8 + (i * (step_w + step_gap))
        is_highlight = (i == 3)
        tf = add_card(s5, x, 1.8, step_w, 4.9, f"{st}\n{st_title}", "", 
                      bg=CARD_ACCENT_BG if is_highlight else CARD_BG, 
                      border=PRIMARY_BLUE if is_highlight else BORDER_LIGHT, 
                      border_width=1.5 if is_highlight else 1.0)
        p = tf.add_paragraph()
        p.text = st_desc
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_BODY
        p.space_before = Pt(8)

    # =========================================================================
    # SLIDE 6: COMPREHENSIVE TECHNOLOGY STACK
    # =========================================================================
    s6 = add_blank_slide()
    add_header(s6, "Comprehensive Technology Stack Matrix")

    tf1 = add_card(s6, 0.8, 1.8, 5.7, 2.3, "Frontend Presentation Layer", "React 18 + Vite Architecture")
    p = tf1.add_paragraph()
    p.text = "• React 18.3 & Vite 5.4: High-speed SPA with fast HMR and optimized asset bundling.\n• Vanilla CSS & CSS Variables: Tailored dark/light mode, micro-animations, glassmorphism.\n• Lucide Icons & React-Markdown: Modern UI iconography and GFM table parsing.\n• uiCache Utility: Dual-storage (sessionStorage + localStorage) for persistent tabs."
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(4)

    tf2 = add_card(s6, 6.8, 1.8, 5.7, 2.3, "Backend & API Service Core", "FastAPI Python 3.11 Architecture")
    p = tf2.add_paragraph()
    p.text = "• Python 3.11.9 + FastAPI: High-concurrency async ASGI application framework.\n• Async SQLAlchemy 2.0 ORM: Non-blocking relational database access.\n• Pydantic v2: Strict typed schema contracts and payload validation.\n• Python-Jose & Passlib: JWT session management and salted Bcrypt password hashing."
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(4)

    tf3 = add_card(s6, 0.8, 4.35, 5.7, 2.45, "Cognitive Engine & RAG Models", "Hybrid Intelligence Pipeline")
    p = tf3.add_paragraph()
    p.text = "• ONNX MiniLM-L6-v2: Local 384-dimensional dense embeddings running in ~15ms on CPU.\n• BM25 Lexical Inverted Index: Term-frequency matching for acronyms and circular codes.\n• FlashRank Cross-Encoder: Deep ms-marco-TinyBERT model for contextual reranking.\n• Groq Cloud LLM (Llama 3.3): Sub-1.2s inference + Offline Grounded Fallback Synthesizer."
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(4)

    tf4 = add_card(s6, 6.8, 4.35, 5.7, 2.45, "Data, Multi-Format & Storage", "Enterprise Relational & Vector Stores")
    p = tf4.add_paragraph()
    p.text = "• PostgreSQL 16 / SQLite (Dev): Stores users, departments, document metadata, audit logs.\n• Embedded ChromaDB: Vector database with metadata filtering at HNSW index level.\n• PyMuPDF, python-docx, openpyxl: Native parsers preserving tabular and structural data.\n• Tesseract OCR Adapter: Automatic OCR text extraction for scanned notices and memos."
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(4)

    # =========================================================================
    # SLIDE 7: EMPIRICAL BENCHMARKS & EVALUATION
    # =========================================================================
    s7 = add_blank_slide()
    add_header(s7, "Automated Evaluation & Empirical Benchmark Results")

    # 4 KPI Metrics
    kpis = [
        ("Hit Rate @ 5", "100%", "+33.3% lift over standard BM25", SUCCESS_GREEN),
        ("MRR @ 5", "1.000", "Top relevant record placed at #1", SUCCESS_GREEN),
        ("Security Leakage", "0.0%", "Strict RBAC tenant boundaries", PRIMARY_BLUE),
        ("P95 Latency", "62.4ms", "Instant local ONNX execution", WARNING_AMBER)
    ]
    card_w = 2.7
    card_gap = 0.3
    for i, (title, val, sub, col) in enumerate(kpis):
        x = 0.8 + (i * (card_w + card_gap))
        card = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(1.8), Inches(card_w), Inches(1.7))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = BORDER_LIGHT
        card.line.width = Pt(1.0)
        
        tb = s7.shapes.add_textbox(Inches(x + 0.15), Inches(1.85), Inches(card_w - 0.3), Inches(1.5))
        tf = tb.text_frame
        p1 = tf.paragraphs[0]
        p1.text = title.upper()
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_MUTED
        
        p2 = tf.add_paragraph()
        p2.text = val
        p2.font.size = Pt(34)
        p2.font.bold = True
        p2.font.color.rgb = col
        p2.space_before = Pt(2)
        
        p3 = tf.add_paragraph()
        p3.text = sub
        p3.font.size = Pt(9.5)
        p3.font.color.rgb = TEXT_BODY
        p3.space_before = Pt(2)

    # Table
    tb_shape = s7.shapes.add_table(4, 5, Inches(0.8), Inches(3.8), Inches(11.7), Inches(2.9))
    tbl = tb_shape.table
    tbl.columns[0].width = Inches(3.6)
    tbl.columns[1].width = Inches(1.9)
    tbl.columns[2].width = Inches(1.9)
    tbl.columns[3].width = Inches(1.9)
    tbl.columns[4].width = Inches(2.4)

    headers = ["Retrieval Architecture Mode", "Hit Rate @ 5", "MRR @ 5", "Avg P95 Latency", "Security Leakage"]
    for j, h_text in enumerate(headers):
        cell = tbl.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY_PRIMARY
        p = cell.text_frame.paragraphs[0]
        p.text = h_text
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = RGBColor(255, 255, 255)

    rows = [
        ("BM25 Keyword Baseline", "60.0%", "0.533", "18.4ms", "0.0% (Clean)"),
        ("ChromaDB Dense Vector Embedding", "80.0%", "0.717", "38.2ms", "0.0% (Clean)"),
        ("CONCORD Hybrid (RRF + FlashRank)", "100.0%", "1.000", "62.4ms", "0.0% (Guaranteed Zero Leakage)")
    ]

    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            cell = tbl.cell(i+1, j)
            cell.fill.solid()
            if i == 2:
                cell.fill.fore_color.rgb = CARD_ACCENT_BG
            else:
                cell.fill.fore_color.rgb = CARD_BG
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(10.5)
            if i == 2 and j in [1, 2, 4]:
                p.font.bold = True
                p.font.color.rgb = SUCCESS_GREEN
            else:
                p.font.color.rgb = NAVY_PRIMARY if i == 2 else TEXT_BODY

    # =========================================================================
    # SLIDE 8: SUMMARY & VIVA DEMO SCRIPT
    # =========================================================================
    s8 = add_blank_slide()
    add_header(s8, "Key Achievements & 5-Minute Live Evaluator Walkthrough")

    tf1 = add_card(s8, 0.8, 1.8, 5.7, 5.0, "Core Technical Contributions", "Engineered to Academic Rigor")
    p = tf1.add_paragraph()
    p.text = "✓ Enterprise Modular Monolith: Clean domain boundaries without the operational overhead of premature microservices.\n\n✓ Defense-in-Depth RBAC: 0.0% security leakage mathematically guaranteed across API, SQL, and ChromaDB vector filters.\n\n✓ Superior Search Precision: 100% Hit Rate@5 and 1.000 MRR achieved via Reciprocal Rank Fusion & FlashRank Cross-Encoder.\n\n✓ Zero-Hallucination Grounding: In-line page citations, clickable chunk inspector, and automatic policy conflict warning tables.\n\n✓ Comprehensive Quality Assurance: 49 passing automated Pytest tests validating authentication, RBAC, parsers, and RAG."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(8)

    tf2 = add_card(s8, 6.8, 1.8, 5.7, 5.0, "5-Minute Live Demonstration Flow", "Live System at http://localhost:5173")
    p = tf2.add_paragraph()
    p.text = "1. Minute 1 — Multi-Tenancy & RBAC:\nSwitch roles between Platform Admin, HOD CSE, Faculty, and Student to demonstrate dynamic permission adaptation.\n\n2. Minute 2 — Document Ingestion & Chunk Inspector:\nInspect how PyMuPDF, python-docx, and TabularChunker preserve syllabus matrices, page numbers, and SHA-256 hashes.\n\n3. Minute 3 — Grounded Q&A with Live Citations:\nQuery 'passing criteria for Autonomous Exam under 2024 regulations'. Click citation chip [1] to open chunk inspector.\n\n4. Minute 4 — Policy Conflict Detection:\nAsk 'Compare 2020 vs 2024 regulations'. System surfaces version discrepancy warning banner and comparative table.\n\n5. Minute 5 — Automated Benchmark Suite:\nNavigate to Benchmarks tab. Show 100% Hit Rate and click 'Run Live Benchmark' to execute real-time assertion suite."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(8)

    prs.save(output_path)
    print(f"Professional Light-Mode Presentation successfully created at: {output_path}")

if __name__ == "__main__":
    create_light_deck()
