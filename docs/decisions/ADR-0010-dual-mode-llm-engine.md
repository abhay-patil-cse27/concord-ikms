# ADR-0010: Dual-Mode LLM Engine (Cloud Groq vs On-Premises Local/Remote Node)

## Context & Problem Statement
CONCORD previously depended exclusively on Groq Cloud LLM (`openai/gpt-oss-120b` or `llama-3.3-70b-versatile`) for extractive synthesis. While Groq delivers sub-200ms latency, educational institutions face realistic deployment constraints:
1. **Air-Gapped & Offline Examination Networks:** Academic institutions often operate confidential or air-gapped lab servers without open internet access.
2. **Data Sovereignty & Local Governance:** Certain unpublished draft syllabi and examination papers cannot leave the campus perimeter.
3. **Hardware Resource Constraints:** Consumer laptops and modest departmental workstations freeze or thermally throttle when running heavy 7B+ parameter local LLMs.
4. **Zero-Downtime Switching:** Administrators must be able to switch between Cloud and Local inference without restarting the FastAPI backend server.

## Decision Drivers
- **Zero Redundancy:** Context formatting, prompt templates, citation mapping (`[1]`), SSE token parsing, and refusal logic must be identical across all inference backends.
- **Consumer Hardware Friendly:** The default local model must consume minimal RAM (<1.5 GB) and run at high tokens/second on plain CPU without GPU requirements.
- **Dynamic In-Memory Reconfiguration:** Hot-swapping must take effect immediately for active SSE streaming and synchronous queries via authenticated admin REST endpoints.
- **Standard Protocol Compatibility:** Any OpenAI-compatible `/v1/chat/completions` server (Ollama, vLLM, llama.cpp, LocalAI, or internet tunnels) must work out of the box.

## Considered Options
1. **Ollama-Only Python SDK Integration:** Tight coupling with `ollama-python` package. (Rejected: restricts users to Ollama; does not support vLLM or remote HTTP endpoints cleanly).
2. **Separate Independent Services:** Running a separate proxy microservice. (Rejected: excessive operational overhead for institutional single-node deployment).
3. **Decoupled Provider Strategy with OpenAI Specification:** Implement `LocalLLMProvider` targeting standard HTTP POST `/v1/chat/completions` alongside `GroqCloudLLMProvider` using shared pipeline helpers (`_build_evidence_context`, `_build_chat_payload`, `_clean_llm_response`, `_parse_sse_delta`). (Accepted).

## Decision Outcome
Adopted **Option 3**:
1. **Selected Model:** `qwen2.5:1.5b` as the institutional default local model. Footprint: ~1.2 GB RAM, 20–35 tok/s on CPU, zero thermal throttling on student/faculty laptops.
2. **Provider Strategy:** Implemented `LocalLLMProvider` adhering to `BaseLLMProvider` interface.
3. **Zero-Redundancy Shared Engine:** Both Groq and Local providers share exact same prompt templates, evidence serialization, temperature clamping (0.05), and citation cleaning.
4. **Runtime Hot-Swap:** Implemented `set_runtime_llm_config` and `get_runtime_llm_config` in-memory factory with REST endpoints:
   - `GET /api/v1/system/llm-config`
   - `PUT /api/v1/system/llm-config` (Guarded by `platform_admin`)
   - `POST /api/v1/system/llm-test` (Health and latency diagnostic beacon)
5. **Fail-Safe Offline Resiliency:** If local node or Groq becomes unreachable, queries gracefully degrade to `OfflineFallbackLLMProvider` deterministic extractive synthesis rather than crashing.

## Consequences
- **Positive:**
  - Complete sovereignty: Institution can run 100% offline using Ollama or vLLM in air-gapped labs.
  - Zero server restart needed to toggle between Cloud and Local inference.
  - Clean separation: Test suite runs 85 backend tests without requiring a running Ollama daemon.
  - Tactical Yellow Brutalist UI controls in Admin Dashboard for live configuration.
- **Negative / Trade-offs:**
  - Smaller quantized 1.5B models have lower linguistic creativity compared to 120B cloud models, requiring strict prompt engineering and anti-repetition parameter tuning.
