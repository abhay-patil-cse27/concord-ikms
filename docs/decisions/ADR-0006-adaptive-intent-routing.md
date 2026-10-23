# ADR-0006: Adaptive Intent Routing for Conversational RAG & Direct LLM Generation

## Status
Accepted

## Context
In previous revisions, every incoming user query in CONCORD's conversational assistant was unconditionally routed into the RAG pipeline (`RetrievalService.search` via ChromaDB vector index and BM25 lexical search).

This caused severe UX and grounding issues:
1. When a user sent casual conversation or polite greetings (*"Hi"*, *"Hello"*, *"Who are you?"*, *"How can you help me?"*), vector search would match random institutional document extracts (e.g. DevOps laboratory syllabi or examination regulations) and attempt to synthesize an answer out of them with false citations (`[1]`).
2. High latency overhead (query embedding + vector index scan + reciprocal rank fusion + cross-encoder re-ranking) for simple greetings.
3. Awkward, unhelpful responses to natural greetings that degraded user confidence in the conversational assistant.

## Decision
We implemented a multi-stage **Adaptive Intent Router** at the entry point of `RAGService.ask()` and `ConversationService.ask_in_conversation()`:

1. **Direct Conversational Route (`direct_conversational`)**:
   - `is_conversational_query(query)` checks for greetings, pleasantries, identity inquiries, and capability queries.
   - Bypasses ChromaDB and BM25 retrieval completely.
   - Invokes `GroqCloudLLMProvider.generate_conversational_answer()` (or `OfflineFallbackLLMProvider.generate_conversational_answer()`), which introduces the assistant as **CONCORD**, outlines institutional capabilities, and presents helpful example queries.
   - Returns clean response with empty citations (`[]`), high confidence, and fast latency (~300-500ms).

2. **Comparative Multi-Step Route (`multi_step_comparative`)**:
   - Detected via `ComparativeResearchAgent.is_comparative_query()`.
   - Decomposes comparison requests into sub-queries, queries both historical/superseded and active records, and synthesizes structured comparison matrices.

3. **Institutional Grounded RAG Route (`hybrid_rrf`)**:
   - Handles specific institutional, academic, curriculum, fee, and administrative queries.
   - Executes dense ChromaDB + sparse BM25 search with Reciprocal Rank Fusion (RRF) and FlashRank cross-encoder re-ranking.
   - Enforces strict zero-hallucination prompt boundaries with mandatory bracket citations `[1]`, `[2]`.

## Consequences
- **Positive:**
  - Conversational queries receive immediate, warm, natural answers without hallucinating or citing unrelated course documents.
  - Institutional queries retain absolute grounding integrity with zero hallucination.
  - Greatly improved latency and reduced token consumption on vector search and LLM prompts.
- **Negative:**
  - Requires maintaining the intent classification keyword/regex set to ensure institutional questions containing casual words are not misclassified.
