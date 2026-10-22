# CONCORD — Risk Register & Mitigation Strategy (Milestone 0)

| ID | Risk Description | Severity | Likelihood | Impact Area | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **R-01** | Docker engine may be stopped on host developer environment. | Med | High | Local Setup | Provide unified configuration with SQLite fallback for fast local development and pytest, alongside full Docker Compose PostgreSQL configuration. |
| **R-02** | RBAC bypass via client-side state manipulation. | High | Low | Security | Enforce authorization checks strictly on backend FastAPI dependency injection guards (`require_permission`, `require_role`). |
| **R-03** | Insecure default secrets in deployment. | High | Med | Security | Prevent app startup in production mode (`ENVIRONMENT=production`) if default `SECRET_KEY` is detected. Provide `.env.example` with clear guidance. |
| **R-04** | Cross-department data leakage in search / citations. | High | Med | Privacy / Security | Scope all queries through explicit tenant/department authorization filters in the service layer, not frontend filters. |
| **R-05** | LLM hallucination and fabricated citations (Future M4). | High | High | Trust / Compliance | Architect strict validation: citations must match retrieved evidence UUIDs before returning responses; reject ungrounded assertions. |
| **R-06** | Database migration drift between dev and prod. | Med | Med | Operations | Use Alembic versioned migration scripts stored in source control; test upgrade paths automatically. |
