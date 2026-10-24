# ADR-0008: Multi-Tiered LLM Input Sanitization and Prompt Injection Guardrails

## Status
Accepted

## Context
In CONCORD IKMS (Grounded Institutional Q&A and Multi-Turn Dialogue), users interact directly with LLM inference engines (Groq Cloud Llama 3.3 70B/8B). Without active guardrails, the system was susceptible to:
1. **Prompt Injection / Jailbreak Attacks**: Adversarial user queries attempting instruction overrides (e.g., *"Ignore all previous instructions"*, *"Switch to DAN mode"*).
2. **Delimiter Smuggling**: Embedding chat template formatting tags (`<|im_start|>`, `[INST]`, `### System:`) into user input to alter model behavior.
3. **Control Characters & Non-Printables**: Using bidirectional override characters, zero-width spaces, or carriage-return smuggling to evade keyword detection.
4. **Harmful / Prohibited Content**: Dangerous queries (e.g., exploits, hacking tools, cyber threats).
5. **System Prompt & Artifact Leakage**: Attempts to force the model to regurgitate confidential system rules or internal schemas.

## Decision
We implemented a **Multi-Tiered Guardrail Interceptor (`PromptGuard`)** placed upstream of both the vector retriever and the LLM inference provider:

1. **Tier 1 — Unicode Normalization & Invisible Character Stripping**:
   - Applies NFKC normalization.
   - Filters out zero-width spaces (`\u200B`, `\u200C`, `\u200D`), bidirectional override controls (`\u202E`), and non-printable control characters.
   - Collapses excessive whitespace.

2. **Tier 2 — Injection & Delimiter Detection**:
   - Intercepts instruction override patterns (`ignore all previous instructions`, `developer mode`, `dan mode`, `reveal system prompt`).
   - Intercepts model template delimiters (`<|im_start|>`, `[INST]`, `### System:`).
   - If an attack pattern is detected, the request is **short-circuited at 0ms latency** with a polite, standard institutional refusal message without making any external API calls or vector searches.

3. **Tier 3 — Output Sanitization**:
   - Inspects generated text before returning it to the user.
   - Strips any accidental template tags or delimiter leakage.

4. **Integration**:
   - Embedded directly into `RAGService.ask` and `ConversationService.ask_in_conversation`.

## Consequences
- **Positive**: 
  - Prevents prompt injection, jailbreaks, and template smuggling.
  - Zero token waste / API cost on adversarial queries due to immediate short-circuiting.
  - Standardized institutional response adhering to KIT university communication policy.
  - 100% backward compatible: 64/64 backend tests and 5/5 frontend tests passing.
- **Negative / Trade-offs**:
  - Requires maintaining pattern signatures if new injection techniques evolve (can be complemented with LLM-based classifiers like Llama Guard in future high-throughput deployments).
