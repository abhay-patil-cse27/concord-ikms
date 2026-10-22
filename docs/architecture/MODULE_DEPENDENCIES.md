# CONCORD — Module Dependency Map (Milestone 0)

## Module Dependency Graph

```mermaid
graph TD
    subgraph Core Layer
        CoreConfig[core.config]
        CoreSecurity[core.security]
        CoreDatabase[core.database]
        CoreErrors[core.errors]
        CoreLogging[core.logging]
    end

    subgraph Domain Modules
        Identity[modules.identity]
        Organizations[modules.organizations]
        Audit[modules.audit]
        Documents[modules.documents - M2]
        Ingestion[modules.ingestion - M2]
        Retrieval[modules.retrieval - M3]
        Conversations[modules.conversations - M4]
        Trust[modules.trust - M5]
    end

    subgraph API Layer
        RouterAuth[api.v1.auth]
        RouterHealth[api.v1.health]
        RouterUsers[api.v1.users]
        RouterAdmin[api.v1.admin]
        RouterAudit[api.v1.audit]
    end

    Identity --> CoreConfig
    Identity --> CoreSecurity
    Identity --> CoreDatabase
    Organizations --> CoreDatabase
    Audit --> CoreDatabase

    RouterHealth --> CoreDatabase
    RouterAuth --> Identity
    RouterAuth --> Audit
    RouterUsers --> Identity
    RouterUsers --> Organizations
    RouterAdmin --> Identity
    RouterAdmin --> Organizations
    RouterAudit --> Audit

    %% Future milestones depend on Identity & Organizations:
    Documents -.-> Identity
    Documents -.-> Organizations
    Retrieval -.-> Identity
```

## Import Direction Rules

1. **Inward Dependencies:** Web / API routes depend on modules; modules depend on `core`; `core` has no dependencies on business modules.
2. **No Circular Imports:** Identity and Organizations communicate via service contracts or ID references, never tight circular coupling.
3. **Audit Decoupling:** Audit events can be logged synchronously or via background tasks without blocking primary transaction commits.
