# ADR-0011: Conversational Zero-Citation Routing, Relevance Gating, and Stream Loop Breakers

## Context & Problem Statement
During testing of conversational queries and out-of-domain expressions on both cloud models and small quantized local models (`qwen2.5:1.5b`), two critical vulnerabilities emerged:
1. **Hallucinated Citation Attachments on Casual Inquiries:** When users entered casual greetings ("hi", "hello"), identity questions ("who are you"), or confused colloquialisms ("whyyyyy", "help me"), vector search returned syllabus chunks with low/near-zero relevance scores ($\le 0.0001$). Passing these candidate chunks to the LLM forced it to append random, nonsensical institutional citations (e.g. citing *Co-Curricular Activities-IV* when answering "help me").
2. **Infinite Generation Repetition Loops on Quantized Models:** Small consumer models running on CPU/local nodes experienced token degeneration loops when generating answers for underspecified queries with temperature 0.05 and default 0 penalties, repeating phrases indefinitely without emitting the stop sequence.
3. **Dual Card UI Disconnect & Unstoppable Streams:** The frontend rendered a detached external thinking card alongside an empty assistant bubble, and users lacked an interactive control to abort long-running stream responses.

## Decision Drivers
- **Zero Hallucination Integrity:** Pure conversational inquiries must NEVER be decorated with academic syllabus citations.
- **Strict Relevance Threshold:** Retrieved chunks with near-zero relevance scores must be discarded before prompt construction.
- **Loop Prevention:** Penalties and runtime detectors must stop runaway repetitive streams.
- **Claude-Style UX & Interactive Stop:** Thinking steps must render directly inside the assistant message block, and users must have a Red Brutalist `[STOP ⏹]` button and `Escape` shortcut to abort streams instantly.

## Considered Options
1. **LLM Self-Classification Prompting:** Ask the LLM in an initial LLM call if the query is conversational or document-based. (Rejected: adds 200–800ms latency penalty to every query).
2. **Post-Generation Regex Citation Stripping:** Strip citations from the answer string if relevance scores were low. (Rejected: the LLM text itself already referenced the irrelevant chunk content in its synthesis).
3. **Multi-Layered Deterministic Defense:**
   - Layer A: Fast regex conversational intent routing (0ms) short-circuiting to conversational synthesizer with `citations: []`.
   - Layer B: Zero-score relevance filter (`score > 0.0001`) discarding irrelevant vector chunks.
   - Layer C: Anti-repetition penalties (`presence_penalty: 0.3`, `frequency_penalty: 0.4`) and stream substring loop detection (`_has_repetition_loop`).
   - Layer D: Client-side `AbortController` cancellation wired to Stop button, `Escape` key, and unified assistant message card. (Accepted).

## Decision Outcome
Adopted **Option 3**:
1. **Conversational Zero-Citation Router:** Queries matching greetings, identity, capabilities, or confusion patterns are routed directly to conversational generators. Citations list is strictly empty (`[]`).
2. **Zero-Score Relevance Gate:** In `RetrievalService`, any retrieved candidate chunk with relevance score $\le 0.0001$ is discarded. If no chunks pass this threshold, the query is treated as having no institutional evidence, preventing hallucinated citations.
3. **Generation Loop Breaker:**
   - Configured `presence_penalty: 0.3` and `frequency_penalty: 0.4` across both Groq and Local payload builders.
   - Implemented `_has_repetition_loop` detector in streaming generators to catch any 12+ character repeated substrings within a sliding window.
4. **Claude-Style Unified Assistant Card:** `MessageBlock.jsx` embeds progressive thinking steps directly inside the assistant message with rotating academic verbs, collapsible `[⚡ Thought Process (X steps) ▾]` tray, and Red Brutalist Stop button.
5. **Interactive Stream Cancellation:** `useRAG` custom hook stores an `AbortController` reference. Invoking `abort()` terminates the SSE stream cleanly without corrupting the chat history.

## Consequences
- **Positive:**
  - Zero hallucinated citations on conversational or confused user prompts.
  - Immediate responsive conversational answers without waiting for ChromaDB vector scoring.
  - Local quantized models (`qwen2.5:1.5b`) generate crisp, bounded answers without runaway loops.
  - Seamless user experience with interactive stream cancellation and progressive thinking visibility.
- **Negative / Trade-offs:**
  - Queries that blend colloquial phrasing with actual course codes (e.g. "hey bro what is ucspc0701?") must still be properly recognized as institutional retrieval queries through query normalization.
