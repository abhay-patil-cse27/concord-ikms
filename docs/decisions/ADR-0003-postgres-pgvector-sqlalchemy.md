# ADR-0003: Persistence Strategy with PostgreSQL, pgvector, and SQLAlchemy 2.0 Async

## Status
Accepted

## Context
CONCORD manages relational entities (users, roles, departments, document versions, audit logs) while requiring vector similarity search for semantic RAG in subsequent milestones. Maintaining separate relational and vector databases increases synchronization risks and operational overhead.

## Decision
- Standardize on **PostgreSQL 16** with the **pgvector** extension.
- Use **SQLAlchemy 2.0** with asynchronous engine (`asyncpg` for PostgreSQL, `aiosqlite` for lightweight offline testing) and **Alembic** for schema migrations.
- Allow configurable database URLs so automated unit tests can run independently on an in-memory or file-based SQLite database without requiring a live external container.

## Consequences
- **Positive:** ACID transactions across document metadata and vector chunks; unified backup/restore; robust full-text search integrated with relational constraints.
- **Negative:** Vector indexing at extreme multi-million scale may require tuning HNSW/IVFFlat indexes, which is well within capacity for institutional documents.
