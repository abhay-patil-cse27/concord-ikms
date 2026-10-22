"""Automated tests for Phase 4b: Embedded ChromaDB Vector Store."""
import os
import shutil
import pytest
from app.modules.retrieval.chroma_store import ChromaVectorStore


@pytest.fixture
def temp_chroma_store(tmp_path):
    chroma_dir = str(tmp_path / "test_chroma_db")
    store = ChromaVectorStore(persist_directory=chroma_dir, collection_name="test_concord")
    yield store
    if os.path.exists(chroma_dir):
        shutil.rmtree(chroma_dir, ignore_errors=True)


def test_chroma_upsert_and_similarity_query(temp_chroma_store: ChromaVectorStore):
    chunks = [
        {
            "id": "doc1_0",
            "content": "Students must complete mandatory 8-week summer internship in core engineering industries.",
            "metadata": {
                "document_id": "doc-internship",
                "document_title": "Internship Manual 2026",
                "document_filename": "internship_manual.pdf",
                "department_id": "dept-cse",
                "chunk_index": 0,
                "page_number": 2
            }
        },
        {
            "id": "doc2_0",
            "content": "Hostel curfew timing is 9:30 PM for all undergraduate residential students.",
            "metadata": {
                "document_id": "doc-hostel",
                "document_title": "Hostel Regulations",
                "document_filename": "hostel_rules.pdf",
                "department_id": "dept-campus",
                "chunk_index": 0,
                "page_number": 1
            }
        }
    ]

    count = temp_chroma_store.upsert_chunks(chunks)
    assert count == 2

    # Query for internship
    results = temp_chroma_store.query_similarity(query="internship requirements", top_k=2)
    assert len(results) > 0
    top_result = results[0]
    assert top_result["document_id"] == "doc-internship"
    assert top_result["document_title"] == "Internship Manual 2026"
    assert top_result["page_number"] == 2
    assert "8-week summer internship" in top_result["content"]
    assert top_result["score"] > 0.0


def test_chroma_rbac_department_filtering(temp_chroma_store: ChromaVectorStore):
    chunks = [
        {
            "id": "cse_chunk_1",
            "content": "Computer Science lab access is permitted 24/7 with RFID card.",
            "metadata": {
                "document_id": "cse_doc",
                "department_id": "dept-cse",
                "document_title": "CSE Lab Rules",
                "chunk_index": 0,
                "page_number": 1
            }
        },
        {
            "id": "mech_chunk_1",
            "content": "Mechanical workshop safety shoes and helmets are mandatory.",
            "metadata": {
                "document_id": "mech_doc",
                "department_id": "dept-mech",
                "document_title": "Mechanical Workshop Rules",
                "chunk_index": 0,
                "page_number": 1
            }
        }
    ]

    temp_chroma_store.upsert_chunks(chunks)

    # Scoped to CSE department only
    cse_results = temp_chroma_store.query_similarity(
        query="rules and safety access",
        top_k=5,
        department_id="dept-cse"
    )

    # Scoped search must ONLY return CSE chunks, never Mech chunks
    assert len(cse_results) > 0
    for res in cse_results:
        assert res["department_id"] == "dept-cse"
        assert res["document_id"] == "cse_doc"


def test_chroma_delete_document_chunks(temp_chroma_store: ChromaVectorStore):
    chunks = [
        {
            "id": "doc_del_0",
            "content": "Temporary exam guideline to be deleted.",
            "metadata": {
                "document_id": "doc-to-delete",
                "department_id": "dept-cse",
                "document_title": "Old Exam Circular",
                "chunk_index": 0,
                "page_number": 1
            }
        }
    ]

    temp_chroma_store.upsert_chunks(chunks)

    # Verify present
    res_before = temp_chroma_store.query_similarity(query="exam guideline", top_k=2)
    assert len(res_before) == 1

    # Delete
    temp_chroma_store.delete_document_chunks("doc-to-delete")

    # Verify deleted
    res_after = temp_chroma_store.query_similarity(query="exam guideline", top_k=2)
    assert len(res_after) == 0
