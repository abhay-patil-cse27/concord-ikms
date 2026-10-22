# CONCORD — Initial Data Model Specification (Milestone 0)

## 1. Overview

CONCORD uses a normalized relational data model managed via SQLAlchemy 2.0 and Alembic migrations. Vector columns (`pgvector`) will be attached in Milestone 2–3 on chunk tables.

## 2. Milestone 1 Core Entities

```mermaid
erDiagram
    DEPARTMENT ||--o{ USER : contains
    DEPARTMENT ||--o{ MEMBERSHIP : has
    USER ||--o{ MEMBERSHIP : belongs_to
    USER ||--o{ USER_ROLE : assigned
    ROLE ||--o{ USER_ROLE : grants
    ROLE ||--o{ ROLE_PERMISSION : includes
    PERMISSION ||--o{ ROLE_PERMISSION : defines
    USER ||--o{ AUDIT_EVENT : performs

    DEPARTMENT {
        uuid id PK
        string code UK
        string name
        string description
        boolean is_active
        datetime created_at
    }

    USER {
        uuid id PK
        string email UK
        string full_name
        string hashed_password
        uuid primary_department_id FK
        boolean is_active
        boolean is_verified
        datetime created_at
        datetime updated_at
    }

    ROLE {
        uuid id PK
        string code UK
        string name
        string description
        boolean is_system
    }

    PERMISSION {
        uuid id PK
        string code UK
        string description
        string module
    }

    USER_ROLE {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        datetime granted_at
    }

    ROLE_PERMISSION {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
    }

    MEMBERSHIP {
        uuid id PK
        uuid user_id FK
        uuid department_id FK
        string role_in_department
        datetime joined_at
    }

    AUDIT_EVENT {
        uuid id PK
        uuid user_id FK
        string action
        string resource_type
        string resource_id
        string status
        json metadata
        string ip_address
        string request_id
        datetime created_at
    }
```

## 3. Seed Roles & Default Permissions

1. **`platform_admin`**: Full access across all institutional departments, audit inspection, document management, system configuration.
2. **`dept_admin`**: Administrative control scoped to their specific department (uploading policies, viewing department users and audit logs).
3. **`faculty`**: Ingestion of course materials, search across authorized institutional resources, conversation access.
4. **`student`**: Read-only search, retrieval, and Q&A over student-accessible documents.
