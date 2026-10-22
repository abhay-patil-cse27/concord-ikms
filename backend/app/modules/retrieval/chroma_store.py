"""ChromaDB Vector Store implementation for CONCORD."""
import os
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger


class ChromaVectorStore:
    """
    Embedded ChromaDB Vector Store managing chunk embeddings and metadata.
    Supports index-level RBAC filtering by department_id.
    """

    def __init__(self, persist_directory: Optional[str] = None, collection_name: str = "concord_knowledge"):
        self.persist_directory = persist_directory or settings.CHROMA_PERSIST_DIR
        self.collection_name = collection_name
        self._client = None
        self._collection = None

    def _get_collection(self):
        if self._collection is None:
            import chromadb
            from chromadb.config import Settings as ChromaSettings

            os.makedirs(self.persist_directory, exist_ok=True)
            self._client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            # Default L2 / Cosine collection
            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        return self._collection

    def upsert_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Upsert a list of chunks into ChromaDB.
        Each chunk dictionary must contain:
        - id: str
        - content: str
        - metadata: dict (with document_id, department_id, title, page_number, etc.)
        """
        if not chunks:
            return 0

        col = self._get_collection()

        ids = [c["id"] for c in chunks]
        documents = [c["content"] for c in chunks]
        metadatas = []

        for c in chunks:
            meta = c.get("metadata", {}).copy()
            # Ensure all values in metadata are primitive (str, int, float, bool)
            clean_meta = {}
            for k, v in meta.items():
                if isinstance(v, (str, int, float, bool)):
                    clean_meta[k] = v
                else:
                    clean_meta[k] = str(v)
            metadatas.append(clean_meta)

        col.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"Successfully upserted {len(chunks)} chunks into ChromaDB collection '{self.collection_name}'")
        return len(chunks)

    def delete_document_chunks(self, document_id: str) -> None:
        """
        Delete all chunk vectors belonging to a specific document.
        """
        col = self._get_collection()
        try:
            col.delete(where={"document_id": document_id})
            logger.info(f"Deleted ChromaDB vectors for document_id={document_id}")
        except Exception as exc:
            logger.warning(f"ChromaDB delete for doc {document_id} encountered: {exc}")

    def query_similarity(
        self,
        query: str,
        top_k: int = 5,
        department_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Query the vector index for semantically similar chunks.
        Applies index-level RBAC filtering if department_id is supplied.
        """
        col = self._get_collection()

        where_clause = None
        if department_id:
            where_clause = {"department_id": department_id}

        results = col.query(
            query_texts=[query],
            n_results=top_k,
            where=where_clause
        )

        candidates = []
        if not results or not results["ids"] or not results["ids"][0]:
            return candidates

        ids = results["ids"][0]
        distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(ids)
        documents = results["documents"][0] if "documents" in results and results["documents"] else [""] * len(ids)
        metas = results["metadatas"][0] if "metadatas" in results and results["metadatas"] else [{}] * len(ids)

        for i in range(len(ids)):
            dist = distances[i]
            # Convert cosine distance to similarity score in [0, 1]
            # Cosine distance = 1 - cosine_similarity => similarity = 1 - distance
            sim_score = max(0.0, min(1.0, 1.0 - dist))

            meta = metas[i] or {}
            candidates.append({
                "chunk_id": ids[i],
                "document_id": meta.get("document_id", ""),
                "document_title": meta.get("document_title", "Institutional Record"),
                "document_filename": meta.get("document_filename", ""),
                "department_id": meta.get("department_id", ""),
                "chunk_index": int(meta.get("chunk_index", 0)),
                "content": documents[i],
                "page_number": int(meta.get("page_number", 1)),
                "char_count": len(documents[i]),
                "score": round(sim_score, 4),
                "metadata": meta
            })

        return candidates


_vector_store_instance = None


def get_vector_store() -> ChromaVectorStore:
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = ChromaVectorStore()
    return _vector_store_instance
