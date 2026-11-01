# CONCORD Mega Project Phase-I Report Generator

This module contains the automated report generation suite for **Mega Project Group 03 (G3)**, Department of Computer Science and Engineering, Kolhapur Institute of Technology’s College of Engineering Kolhapur (Empowered Autonomous).

It compiles a complete, publication-grade academic report in `.docx` format following the **IQAC Guidelines (Approved 19 Sept 2023)** and the **CSE Department Notice dated 31-10-2026**.

## Report Metadata
- **Project Title:** Retrieval-Augmented Generative AI for Institutional Knowledge Management
- **Project Group:** G3 (Final Year B.Tech CSE, Semester VII)
- **Project Guide & HOD:** Prof. Dr. Lingaraj A. Hadimani
- **Project Coordinator:** Dr. Abhinandan P. Shirahatti
- **Team Members:**
  - Abhay Amol Patil (A-46, PRN: 2324000744)
  - Niranjan Balkrishna Pawar (A-02, PRN: 2324000007)
  - Saprem Satish Khot (A-05, PRN: 2324000005)
  - Sneha Ashok Mogali (A-36, PRN: 2324000036)

## Module Structure
- `generate_docx_report.py`: Master compilation script that orchestrates all chapters and saves the output.
- `report_frontmatter.py`: Appendix 1 (Cover), Appendix 2 (Certificate), Plagiarism Certificate (<15%), Appendix 3 (Declaration), Appendix 4 (Acknowledgement), Abstract, Appendix 5 (TOC), LOT, LOF, Abbreviations.
- `report_chapters.py`: Chapter 1 to 6, IEEE References ([1] to [22]), Appendix A (124 tests matrix), Appendix B (Syllabus query benchmarks).
- `report_helpers.py`: Formatting helpers, 1.5" spiral binding margin, booktabs tables with top captions, centered equations, and figure diagrams.
- `assets/kit_logo.png`: Official college emblem.

## How to Run
Ensure dependencies are installed:
```bash
pip install python-docx
```

Run the compiler from the project root:
```bash
python scripts/report/generate_docx_report.py
```
The output file is saved to `C:\Users\Admin\Desktop\IKMS\CONCORD_Phase1_Project_Report_G3.docx`.
If the file is already open in Word, the generator automatically saves the updated version to `..._new.docx` without crashing.

