"""
Report formatting helpers and utilities for IEEE and Autonomous College guidelines.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.join(BASE_DIR, "assets", "kit_logo.png")
REPO_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
PARENT_DIR = os.path.dirname(REPO_ROOT)
OUTPUT_PATH = os.path.join(PARENT_DIR, "CONCORD_Phase1_Project_Report_G3.docx")

COLOR_PRIMARY = RGBColor(0, 0, 0)
COLOR_MUTED = RGBColor(80, 80, 80)
HEX_HEADER_BG = "EBF0F5"
HEX_ALT_ROW = "F9FAFB"
HEX_BORDER = "94A3B8"
HEX_CARD_BG = "F8FAFC"

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    """Sets cell padding in dxa (1 pt = 20 dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_border(cell, **kwargs):
    """
    Sets specific cell borders.
    kwargs: top, bottom, left, right, insideH, insideV
    e.g. bottom={'val': 'single', 'sz': '8', 'space': '0', 'color': '000000'}
    """
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = tcPr.first_child_found_in('w:tcBorders')
    if tcBorders is None:
        tcBorders = OxmlElement('w:tcBorders')
        tcPr.append(tcBorders)
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = f'w:{edge}'
            element = tcBorders.find(qn(tag))
            if element is None:
                element = OxmlElement(tag)
                tcBorders.append(element)
            for key, val in edge_data.items():
                element.set(qn(f'w:{key}'), str(val))

def set_cell_shading(cell, hex_color):
    """Sets background shading of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def apply_page_setup(section):
    """Applies strict college margin specifications (1.5 in Left for spiral binding, 1.0 in others)."""
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.5)  # Required 1.5 in (38.1 mm) for binding margin
    section.right_margin = Inches(1.0)

def setup_document_styles(doc):
    """Configure default font to Times New Roman 12pt."""
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = COLOR_PRIMARY
    style.paragraph_format.line_spacing = 1.5
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

def add_header_footer(doc):
    """Applies running header and footer with page number to sections."""
    for i, section in enumerate(doc.sections):
        apply_page_setup(section)
        
        # Enable header and footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hp.paragraph_format.space_after = Pt(4)
        hrun = hp.add_run("Kolhapur Institute of Technology’s College of Engineering Kolhapur (Empowered Autonomous)")
        hrun.font.name = "Times New Roman"
        hrun.font.size = Pt(8.5)
        hrun.font.italic = True
        hrun.font.color.rgb = COLOR_MUTED

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        fp.paragraph_format.space_before = Pt(4)
        frun = fp.add_run("Mega Project Phase-I Report (Group G3)  |  Page ")
        frun.font.name = "Times New Roman"
        frun.font.size = Pt(9.0)
        frun.font.color.rgb = COLOR_MUTED
        
        fld = OxmlElement('w:fldSimple')
        fld.set(qn('w:instr'), 'PAGE')
        fp._p.append(fld)

def add_p(doc, text="", space_before=0, space_after=6, line_spacing=1.5,
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, italic=False, font_size=12,
          font_color=COLOR_PRIMARY, keep_with_next=False):
    """Helper to add standard styled paragraphs."""
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    p.paragraph_format.keep_with_next = keep_with_next
    
    if text:
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
        run.font.name = "Times New Roman"
        run.font.size = Pt(font_size)
        run.font.color.rgb = font_color
    return p

def add_heading_1(doc, title):
    """Major heading: 14pt, Bold, UPPERCASE, flush left, 14pt before, 6pt after."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(title.upper())
    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(14)
    run.font.color.rgb = COLOR_PRIMARY
    return p

def add_heading_2(doc, title):
    """Subheading: 12pt, Bold, Title Case, 10pt before, 4pt after."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(title)
    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)
    run.font.color.rgb = COLOR_PRIMARY
    return p

def add_heading_3(doc, title):
    """Sub-subheading: 12pt, Italic, 8pt before, 2pt after."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(title)
    run.italic = True
    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)
    run.font.color.rgb = COLOR_PRIMARY
    return p

def add_table(doc, caption_text, headers, data, col_widths, notes=""):
    """
    Renders an academic table meeting college guidelines:
    - Caption above table: Table X [bold, no full point after] Caption.
    - Booktabs horizontal rules: top rule (12/8 pt), header bottom (8 pt), table bottom (12/8 pt).
    - No vertical lines.
    - Notes ranged left below table.
    """
    cp = doc.add_paragraph()
    cp.paragraph_format.space_before = Pt(10)
    cp.paragraph_format.space_after = Pt(3)
    cp.paragraph_format.keep_with_next = True
    cp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    
    parts = caption_text.split(" ", 2)
    r_lbl = cp.add_run(parts[0] + " " + parts[1] + "  ")
    r_lbl.bold = True
    r_lbl.font.name = "Times New Roman"
    r_lbl.font.size = Pt(11)
    
    r_cap = cp.add_run(parts[2] if len(parts) > 2 else "")
    r_cap.font.name = "Times New Roman"
    r_cap.font.size = Pt(11)
    
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    hdr_cells = table.rows[0].cells
    for i, h_text in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_margins(hdr_cells[i], top=140, bottom=140, left=140, right=140)
        set_cell_shading(hdr_cells[i], HEX_HEADER_BG)
        set_cell_border(hdr_cells[i],
                        top={'val': 'single', 'sz': '12', 'space': '0', 'color': '000000'},
                        bottom={'val': 'single', 'sz': '8', 'space': '0', 'color': '000000'})
        hp = hdr_cells[i].paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        hp.paragraph_format.space_before = Pt(0)
        hp.paragraph_format.space_after = Pt(0)
        hrun = hp.add_run(h_text)
        hrun.bold = True
        hrun.font.name = "Times New Roman"
        hrun.font.size = Pt(10)

    for r_idx, row in enumerate(data):
        row_cells = table.rows[r_idx + 1].cells
        is_last = (r_idx == len(data) - 1)
        bg = HEX_ALT_ROW if (r_idx % 2 == 1) else "FFFFFF"
        for c_idx, val in enumerate(row):
            row_cells[c_idx].width = col_widths[c_idx]
            set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
            if bg != "FFFFFF":
                set_cell_shading(row_cells[c_idx], bg)
            
            border_kwargs = {}
            if is_last:
                border_kwargs['bottom'] = {'val': 'single', 'sz': '12', 'space': '0', 'color': '000000'}
            set_cell_border(row_cells[c_idx], **border_kwargs)

            rp = row_cells[c_idx].paragraphs[0]
            if c_idx == 0:
                rp.alignment = WD_ALIGN_PARAGRAPH.LEFT
            else:
                rp.alignment = WD_ALIGN_PARAGRAPH.CENTER
            rp.paragraph_format.space_before = Pt(0)
            rp.paragraph_format.space_after = Pt(0)
            rrun = rp.add_run(str(val))
            rrun.font.name = "Times New Roman"
            rrun.font.size = Pt(9.5)

    if notes:
        np = doc.add_paragraph()
        np.paragraph_format.space_before = Pt(3)
        np.paragraph_format.space_after = Pt(8)
        np.alignment = WD_ALIGN_PARAGRAPH.LEFT
        nrun = np.add_run(f"Note: {notes}")
        nrun.font.name = "Times New Roman"
        nrun.font.size = Pt(9)
        nrun.font.italic = True
        nrun.font.color.rgb = COLOR_MUTED

def add_equation_box(doc, formula_str, eq_num_str):
    """Places centered equation with right-aligned equation number in parentheses."""
    tbl = doc.add_table(rows=1, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    c0 = tbl.cell(0, 0)
    c1 = tbl.cell(0, 1)
    c0.width = Inches(5.2)
    c1.width = Inches(0.8)
    
    set_cell_margins(c0, top=60, bottom=60, left=60, right=60)
    set_cell_margins(c1, top=60, bottom=60, left=60, right=60)
    
    p0 = c0.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_before = Pt(2)
    p0.paragraph_format.space_after = Pt(2)
    r0 = p0.add_run(formula_str)
    r0.font.name = "Times New Roman"
    r0.font.size = Pt(11)
    r0.font.italic = True
    
    p1 = c1.paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p1.paragraph_format.space_before = Pt(2)
    p1.paragraph_format.space_after = Pt(2)
    r1 = p1.add_run(f"({eq_num_str})")
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(11)
    
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(4)

def add_figure_diagram(doc, caption_text, diagram_lines):
    """Creates a boxed schematic architectural diagram with caption below."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.0)
    set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
    set_cell_shading(cell, HEX_CARD_BG)
    set_cell_border(cell,
                    top={'val': 'single', 'sz': '6', 'space': '0', 'color': HEX_BORDER},
                    bottom={'val': 'single', 'sz': '6', 'space': '0', 'color': HEX_BORDER},
                    left={'val': 'single', 'sz': '6', 'space': '0', 'color': HEX_BORDER},
                    right={'val': 'single', 'sz': '6', 'space': '0', 'color': HEX_BORDER})

    cp = cell.paragraphs[0]
    cp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    cp.paragraph_format.space_before = Pt(0)
    cp.paragraph_format.space_after = Pt(0)
    cp.paragraph_format.line_spacing = 1.15
    for i, line in enumerate(diagram_lines):
        if i > 0:
            cp = cell.add_paragraph()
            cp.paragraph_format.space_before = Pt(0)
            cp.paragraph_format.space_after = Pt(0)
            cp.paragraph_format.line_spacing = 1.15
        run = cp.add_run(line)
        run.font.name = "Consolas"
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(30, 41, 59)

    fp = doc.add_paragraph()
    fp.paragraph_format.space_before = Pt(4)
    fp.paragraph_format.space_after = Pt(10)
    fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    parts = caption_text.split(" ", 2)
    r_lbl = fp.add_run(parts[0] + " " + parts[1] + "  ")
    r_lbl.bold = True
    r_lbl.font.name = "Times New Roman"
    r_lbl.font.size = Pt(11)
    
    r_cap = fp.add_run(parts[2] if len(parts) > 2 else "")
    r_cap.font.name = "Times New Roman"
    r_cap.font.size = Pt(11)
