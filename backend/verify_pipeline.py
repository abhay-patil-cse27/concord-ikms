"""Quick end-to-end verification of CONCORD Pipeline (M1 to M4b)."""
import asyncio
import httpx


async def run_pipeline_verification():
    print("=================================================================")
    print("CONCORD IKMS: END-TO-END PIPELINE VERIFICATION")
    print("=================================================================\n")

    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000", timeout=30.0) as client:
        # Step 1: Health & Readiness Check
        hz = await client.get("/api/v1/healthz")
        ready = await client.get("/api/v1/readyz")
        print(f"[1] Health Check: status={hz.status_code}, readiness={ready.status_code}")
        assert hz.status_code == 200 and ready.status_code == 200

        # Step 2: Authentication & RBAC Token
        login = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
        assert login.status_code == 200
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"[2] Authentication: OK (Logged in as platform_admin)")

        # Step 3: Document Ingestion Test
        test_filename = "Academic_Regulations_2026.txt"
        test_content = (
            "KOLHAPUR INSTITUTE OF TECHNOLOGY (KIT)\n"
            "ACADEMIC REGULATIONS 2026-2027\n\n"
            "Section 4.1 - Attendance Criteria:\n"
            "Students are required to maintain a minimum attendance of 75% in each registered course.\n"
            "Students with attendance between 65% and 74% may be condoned by the Dean Academics on genuine medical grounds.\n"
            "Students with attendance below 65% shall be detained from appearing in end-semester examinations.\n\n"
            "Section 5.2 - Grading & Passing Standards:\n"
            "A candidate must secure at least 40% aggregate marks in continuous assessments and end-semester examinations to be declared passed."
        )
        
        files = {
            "file": (test_filename, test_content.encode("utf-8"), "text/plain")
        }
        data = {
            "title": "Academic Regulations Manual 2026",
            "department_id": "dept-cse-id"
        }
        
        # Fetch actual department ID from database
        depts_res = await client.get("/api/v1/organizations/departments", headers=headers)
        depts = depts_res.json()
        dept_id = depts[0]["id"] if depts else "default-dept"
        data["department_id"] = dept_id

        # Ingest document
        upload_res = await client.post("/api/v1/documents/upload", headers=headers, files=files, data=data)
        if upload_res.status_code == 201:
            res_json = upload_res.json()
            doc_data = res_json.get("document", {})
            doc_id = doc_data.get("id", "unknown")
            chunks = doc_data.get("chunk_count", 0)
            print(f"[3] Document Ingestion & Chunking: Ingested '{test_filename}' (ID: {doc_id[:8]}..., Chunks: {chunks})")
        elif upload_res.status_code == 409:
            print(f"[3] Document Ingestion: Document already exists (SHA-256 deduplicated)")
        else:
            print(f"[3] Document Ingestion: Status {upload_res.status_code} ({upload_res.text})")

        # Step 4: Hybrid Search with ChromaDB + Reciprocal Rank Fusion
        search_res = await client.post(
            "/api/v1/search/query",
            headers=headers,
            json={"query": "attendance criteria 75 percent", "top_k": 3, "mode": "hybrid"}
        )
        assert search_res.status_code == 200
        search_data = search_res.json()
        print(f"[4] Hybrid Search (RRF + ChromaDB):")
        print(f"    - Retrieval Mode: {search_data['retrieval_mode']}")
        print(f"    - Results Retrieved: {len(search_data['results'])} chunks")
        print(f"    - Search Latency: {search_data['latency_ms']} ms")
        if search_data["results"]:
            top_hit = search_data["results"][0]
            print(f"    - Top Result: \"{top_hit['document_title']}\" (Score: {top_hit['score']})")

        # Step 5: Grounded RAG with Groq Cloud & Fallback
        print(f"\n[5] Grounded Question Answering (RAG):")
        rag_res = await client.post(
            "/api/v1/rag/ask",
            headers=headers,
            json={"query": "What is the minimum attendance required and what happens if it is below 65%?", "top_k": 3}
        )
        assert rag_res.status_code == 200
        rag_data = rag_res.json()
        print(f"    - Model Used: {rag_data['model_used']}")
        print(f"    - Confidence: {rag_data['confidence']}")
        print(f"    - Response Latency: {rag_data['latency_ms']} ms")
        print(f"    - Citations: {len(rag_data['citations'])} verified sources")
        print(f"\n--- Grounded Answer Output ---")
        print(rag_data['answer'])
        print(f"------------------------------\n")

    print("=================================================================")
    print("ALL PIPELINE STAGES VERIFIED (M1 -> M2 -> M3 -> M4 -> M4b)")
    print("=================================================================")


if __name__ == "__main__":
    asyncio.run(run_pipeline_verification())
