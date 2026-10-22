# ADR-0001: Adoption of Modular Monolith Architecture with FastAPI

## Status
Accepted

## Context
CONCORD requires clean domain isolation between Identity, Ingestion, Retrieval, Conversations, and Trust to support academic development and future scale. Full microservices would introduce excessive operational overhead (network serialization, multi-service deployment, distributed transactions) at this stage.

## Decision
We adopt a **Modular Monolith** structure implemented in Python 3.12 using FastAPI. 
- All business modules (`identity`, `organizations`, `documents`, `audit`, etc.) reside in isolated directories under `backend/app/modules/`.
- Domain boundaries are enforced via internal service interfaces and Pydantic contracts.
- Background jobs are executed via dedicated worker processes sharing the common domain layer.

## Consequences
- **Positive:** Single deployment artifact, fast shared testing, zero network overhead between modules, clean migration path to independent services if ever justified.
- **Negative:** Requires team discipline to avoid direct cross-module coupling without interface boundaries.
