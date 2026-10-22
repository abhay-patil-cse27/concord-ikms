"""
Canonical Institutional Demo Seed Data for CONCORD IKMS.
Seeds realistic multi-department documents, chunks, and embeddings into the database and ChromaDB.
"""
import asyncio
import hashlib
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

# Ensure backend root is on Python module search path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.logging import logger
from app.modules.organizations.models import Department
from app.modules.identity.models import User
from app.modules.documents.models import Document, DocumentChunk
from app.modules.retrieval.chroma_store import get_vector_store


DEMO_DOCUMENTS = [
    {
        "filename": "KIT_Autonomous_Academic_Regulations_2024.pdf",
        "title": "Autonomous Academic & Examination Regulations (2024 Curriculum)",
        "dept_code": "EXAM",
        "mime_type": "application/pdf",
        "lifecycle_status": "active",
        "approval_status": "approved",
        "version_number": 2,
        "content": """KOLHAPUR INSTITUTE OF TECHNOLOGY (AUTONOMOUS)
ACADEMIC REGULATIONS AND EVALUATION RULES (2024 BATCH ONWARDS)

SECTION 1: ATTENDANCE & ELIGIBILITY
1.1 Every registered student must maintain a minimum attendance of 75% in each enrolled theory course and 80% in laboratory practical courses.
1.2 Condonation up to 10% may be granted by the Academic Council on medical grounds with valid documentation.
1.3 Students with attendance below 65% are categorically detained and cannot appear for End Semester Examinations (ESE).

SECTION 2: PASSING STANDARDS & EVALUATION
2.1 Continuous Internal Evaluation (CIE) contributes 40% and End Semester Examination (ESE) contributes 60% of total grade.
2.2 A student must secure at least 40% in ESE (minimum 24 out of 60) and 40% overall (CIE + ESE, minimum 40 out of 100) to pass a course.
2.3 The grading system follows a 10-point scale: O (90-100%, Grade Point 10), A+ (80-89%, GP 9), A (70-79%, GP 8), B+ (60-69%, GP 7), B (55-59%, GP 6), C (50-54%, GP 5), P (40-49%, GP 4), and F (<40%, GP 0).

SECTION 3: ATKT & PROMOTION CRITERIA
3.1 A student can carry a maximum of 4 backlogs into the next academic year.
3.2 Promotion to Third Year (Semester 5) requires passing all First Year (Semester 1 & 2) credits with zero backlogs.
3.3 Minimum cumulative grade point average (CGPA) of 5.0 is mandatory for the award of B.Tech Degree.""",
    },
    {
        "filename": "KIT_Academic_Regulations_2020_Superseded.pdf",
        "title": "Autonomous Academic Regulations (2020 Curriculum - Superseded)",
        "dept_code": "EXAM",
        "mime_type": "application/pdf",
        "lifecycle_status": "superseded",
        "approval_status": "approved",
        "version_number": 1,
        "content": """KOLHAPUR INSTITUTE OF TECHNOLOGY (AUTONOMOUS)
HISTORICAL ACADEMIC REGULATIONS (2020-2023) [SUPERSEDED]

ATTENDANCE RULES:
Minimum attendance requirement was 70% with 15% discretionary medical allowance.

PASSING STANDARDS:
Passing standard required minimum 35% in End Semester Examination (21 out of 60) and 35% in aggregate.
NOTE: This policy is strictly superseded by Academic Regulations 2024 which raised the passing threshold to 40%.""",
    },
    {
        "filename": "BTech_CSE_Autonomous_Curriculum_2024_28.pdf",
        "title": "B.Tech Computer Science & Engineering Structure & Syllabus (2024-2028)",
        "dept_code": "CSE",
        "mime_type": "application/pdf",
        "lifecycle_status": "active",
        "approval_status": "approved",
        "version_number": 1,
        "content": """DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
FOUR-YEAR B.TECH DEGREE PROGRAMME STRUCTURE (2024-2028)

SEMESTER 5 (THIRD YEAR CSE):
1. CS301: Advanced Data Structures & Algorithms (Credits: 4, L-T-P: 3-0-2)
   Covers graph algorithms, randomized algorithms, B-Trees, Fibonacci heaps, and amortized complexity.
2. CS302: Database Management Systems & NoSQL (Credits: 4, L-T-P: 3-0-2)
   Relational algebra, ACID transaction management, indexing, distributed MongoDB, and vector databases.
3. CS303: Artificial Intelligence & Cognitive Systems (Credits: 3, L-T-P: 3-0-0)
   Search techniques, probabilistic reasoning, knowledge representation, neural networks, and RAG architectures.
4. Professional Elective I: Full-Stack Cloud Native Development OR Applied Deep Learning (Credits: 3)
5. CS305: Mini Project 2A (Credits: 2) - Capstone domain prototype.

TOTAL CREDITS REQUIRED FOR B.TECH DEGREE: 160 Credits across 8 Semesters.""",
    },
    {
        "filename": "CSE_Department_Lab_Safety_and_AI_Ethics_2024.docx",
        "title": "CSE Department Computing Lab Safety & Generative AI Ethics Guidelines",
        "dept_code": "CSE",
        "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "lifecycle_status": "active",
        "approval_status": "approved",
        "version_number": 1,
        "content": """DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
COMPUTING INFRASTRUCTURE USAGE & GENERATIVE AI POLICY

1. LAB GPU SERVER ALLOCATION
High-performance NVIDIA A100 GPU computing clusters are reserved for final year capstone projects and faculty research in deep learning.
Access requests must be submitted via the HOD portal with project supervisor approval.

2. INSTITUTIONAL AI ETHICS & PLAGIARISM
Students submitting programming assignments, project reports, or thesis documents must disclose any generative AI assistance.
Code copied verbatim from generative models without architectural understanding or citation violates the KIT Academic Honor Code.""",
    },
    {
        "filename": "ENTC_VLSI_and_Embedded_Lab_Manual_2024.pdf",
        "title": "Electronics & Telecommunication VLSI and Embedded Systems Lab Directives",
        "dept_code": "ADMIN",
        "mime_type": "application/pdf",
        "lifecycle_status": "active",
        "approval_status": "approved",
        "version_number": 1,
        "content": """DEPARTMENT OF ELECTRONICS & TELECOMMUNICATION ENGINEERING
VLSI & EMBEDDED SYSTEMS DESIGN LAB GUIDELINES 2024

LABORATORY PROTOCOLS:
1. Cadence EDA tools and FPGA development boards (Xilinx Artix-7) are restricted to authorized ENTC research personnel.
2. All ESD (Electrostatic Discharge) wrist straps must be grounded before handling microcontroller development kits.
3. Cross-departmental interdisciplinary projects require prior joint sign-off from HOD ENTC and Dean Academics.""",
    },
]


async def seed_institutional_demo_data():
    """Seeds the demo documents and populates ChromaDB."""
    logger.info("Starting institutional demo data seeding...")
    vector_store = get_vector_store()

    async with AsyncSessionLocal() as db:
        # Fetch admin user
        admin_res = await db.execute(select(User).where(User.email == "admin@concord.kit.edu"))
        admin_user = admin_res.scalar_one_or_none()
        if not admin_user:
            logger.error("Admin user not found! Please run app startup seed first.")
            return

        for doc_meta in DEMO_DOCUMENTS:
            # Check if document already exists by filename
            existing_res = await db.execute(select(Document).where(Document.filename == doc_meta["filename"]))
            existing_doc = existing_res.scalar_one_or_none()
            if existing_doc:
                logger.info(f"Document already exists: {doc_meta['filename']}, skipping creation.")
                continue

            # Lookup department
            dept_res = await db.execute(select(Department).where(Department.code == doc_meta["dept_code"]))
            dept = dept_res.scalar_one_or_none()
            dept_id = dept.id if dept else None

            # Calculate content hash
            text_bytes = doc_meta["content"].encode("utf-8")
            content_hash = hashlib.sha256(text_bytes).hexdigest()

            # Create Document entity
            doc = Document(
                id=str(uuid.uuid4()),
                title=doc_meta["title"],
                filename=doc_meta["filename"],
                file_path=f"demo/{doc_meta['filename']}",
                file_size_bytes=len(text_bytes),
                mime_type=doc_meta["mime_type"],
                sha256_hash=content_hash,
                department_id=dept_id,
                uploader_id=admin_user.id,
                status="processed",
                lifecycle_status=doc_meta["lifecycle_status"],
                version=f"v{doc_meta['version_number']}.0",
                approval_status=doc_meta["approval_status"],
                approved_by_id=admin_user.id if doc_meta["approval_status"] == "approved" else None,
                approved_at=datetime.utcnow() if doc_meta["approval_status"] == "approved" else None,
                chunk_count=0,
            )
            db.add(doc)
            await db.flush()

            # Create realistic paragraphs as chunks
            paragraphs = [p.strip() for p in doc_meta["content"].split("\n\n") if p.strip()]
            chroma_chunks_data = []

            for idx, p_text in enumerate(paragraphs):
                chunk = DocumentChunk(
                    id=str(uuid.uuid4()),
                    document_id=doc.id,
                    chunk_index=idx,
                    content=p_text,
                    char_count=len(p_text),
                    metadata_={
                        "heading": doc_meta["title"],
                        "page_number": 1,
                        "token_estimate": len(p_text) // 4,
                    },
                )
                db.add(chunk)
                await db.flush()

                chroma_chunks_data.append({
                    "id": str(chunk.id),
                    "content": p_text,
                    "metadata": {
                        "document_id": str(doc.id),
                        "document_filename": doc.filename,
                        "document_title": doc_meta["title"],
                        "department_id": str(dept_id) if dept_id else "",
                        "lifecycle_status": doc.lifecycle_status,
                        "approval_status": doc.approval_status,
                        "version": doc.version,
                        "chunk_index": idx,
                        "page_number": 1,
                    }
                })

            doc.chunk_count = len(paragraphs)
            await db.commit()
            logger.info(f"Persisted document {doc.filename} with {len(paragraphs)} chunks.")

            # Sync to ChromaDB if approved
            if doc_meta["approval_status"] == "approved":
                synced = vector_store.upsert_chunks(chroma_chunks_data)
                logger.info(f"ChromaDB indexed {synced} chunks for {doc.filename}.")

    logger.info("Institutional demo data seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_institutional_demo_data())
