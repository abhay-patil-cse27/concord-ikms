"""Conversations domain service managing multi-turn sessions and context continuity."""
import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.conversations.models import Conversation, ConversationMessage
from app.modules.identity.models import User
from app.modules.retrieval.schemas import RAGAskRequest, RAGAskResponse
from app.modules.retrieval.rag_service import RAGService
from app.core.errors import NotFoundError, ForbiddenError


class ConversationService:
    """
    Manages conversational memory sessions, query rewriting across preceding turns,
    and message history persistence.
    """

    def __init__(self, rag_service: Optional[RAGService] = None):
        self.rag_service = rag_service or RAGService()

    async def list_user_conversations(self, db: AsyncSession, user_id: str, limit: int = 30) -> List[Conversation]:
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .options(selectinload(Conversation.messages))
            .order_by(desc(Conversation.updated_at))
            .limit(limit)
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def get_conversation(self, db: AsyncSession, conversation_id: str, current_user: User) -> Conversation:
        stmt = (
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .options(selectinload(Conversation.messages))
        )
        res = await db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            raise NotFoundError(f"Conversation {conversation_id} not found.")

        # Authorize via ConversationPolicy: returns 404 (NotFoundError) on denial
        from app.core.access.policy import conversation_policy
        conversation_policy.authorize_read(current_user, conv, resource_name="Conversation")

        return conv

    async def create_conversation(
        self,
        db: AsyncSession,
        user_id: str,
        title: Optional[str] = None,
        department_id: Optional[str] = None,
        visibility: str = "private"
    ) -> Conversation:
        conv = Conversation(
            id=str(uuid.uuid4()),
            title=title or "New Institutional Inquiry",
            user_id=user_id,
            owner_id=user_id,
            visibility=visibility or "private",
            department_id=department_id
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        return conv

    async def delete_conversation(self, db: AsyncSession, conversation_id: str, current_user: User) -> None:
        conv = await self.get_conversation(db, conversation_id, current_user)
        from app.core.access.policy import conversation_policy
        conversation_policy.authorize_delete(current_user, conv, resource_name="Conversation")
        await db.delete(conv)
        await db.commit()

    @staticmethod
    def contextualize_query(query: str, previous_messages: List[ConversationMessage]) -> str:
        """
        Rewrites follow-up queries that contain explicit ambiguous pronouns (it, that, these, those, same, above)
        using the subject of the immediately preceding user query.
        Does NOT attach previous query context to greetings, pleasantries, or standalone questions.
        """
        clean_q = query.strip()
        lower_q = clean_q.lower()

        # Conversational greetings and small-talk: never rewrite with previous query
        greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "howdy", "greetings", "thanks", "thank you"]
        if lower_q in greetings or lower_q.rstrip("!.,") in greetings:
            return clean_q

        # Explicit reference triggers that require antecedent resolution
        explicit_pronoun_phrases = [
            " it", " it?", " it.", " that", " that?", " that.",
            " these", " those", " the same", " as above", " for it", " about it",
            "explain more", "elaborate", "tell me more", "what about it", "why is that"
        ]
        
        has_explicit_reference = any(p in f" {lower_q} " for p in explicit_pronoun_phrases)
        if not has_explicit_reference or not previous_messages:
            return clean_q

        # Find the latest user query from the preceding history
        last_user_turn = None
        for msg in reversed(previous_messages):
            if msg.role == "user" and msg.content.lower().strip() not in greetings:
                last_user_turn = msg.content.strip()
                break

        if last_user_turn and last_user_turn.lower() != lower_q:
            return f"{clean_q} (Regarding previous topic: {last_user_turn})"

        return clean_q

    async def ask_in_conversation(
        self,
        db: AsyncSession,
        query: str,
        current_user: User,
        conversation_id: Optional[str] = None,
        department_id: Optional[str] = None,
        top_k: int = 5,
        include_superseded: bool = False
    ) -> Dict[str, Any]:
        """
        Executes a dialogue turn within an active or newly initialized conversation session.
        """
        from app.core.guardrails import PromptGuard
        clean_query = PromptGuard.sanitize_input(query)

        # 1. Resolve or create conversation
        if conversation_id:
            conv = await self.get_conversation(db, conversation_id, current_user)
        else:
            # Generate concise session title from first 6 words
            title_words = clean_query.strip().split()[:6]
            session_title = " ".join(title_words)
            conv = await self.create_conversation(
                db=db,
                user_id=current_user.id,
                title=session_title,
                department_id=department_id or getattr(current_user, "department_id", None)
            )

        # 2. Fetch existing messages asynchronously for query contextualization
        msg_stmt = (
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conv.id)
            .order_by(ConversationMessage.created_at)
        )
        msg_res = await db.execute(msg_stmt)
        existing_messages = list(msg_res.scalars().all())

        # 3. Contextual query rewriting & Academic typo normalizer
        effective_query = self.contextualize_query(clean_query, existing_messages)
        from app.modules.retrieval.normalizer import AcademicQueryNormalizer
        norm_query, _, _ = AcademicQueryNormalizer.normalize_with_metadata(effective_query)
        effective_query = norm_query or effective_query

        # 4. Save User turn
        user_msg = ConversationMessage(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            owner_id=current_user.id,
            role="user",
            content=clean_query
        )
        db.add(user_msg)
        await db.flush()

        # 4. Execute Grounded RAG with effective query
        rag_req = RAGAskRequest(
            query=effective_query,
            department_id=department_id or conv.department_id,
            top_k=top_k,
            include_superseded=include_superseded
        )
        rag_res: RAGAskResponse = await self.rag_service.ask(
            db=db,
            request=rag_req,
            current_user=current_user
        )

        # 5. Save Assistant turn
        citations_data = [c.model_dump() for c in rag_res.citations]
        asst_msg = ConversationMessage(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            owner_id=current_user.id,
            role="assistant",
            content=rag_res.answer,
            citations=citations_data,
            confidence=rag_res.confidence,
            model_used=rag_res.model_used,
            latency_ms=rag_res.latency_ms
        )
        db.add(asst_msg)
        
        # Touch conversation timestamp
        conv.title = conv.title or query[:50]
        await db.commit()
        await db.refresh(conv)

        return {
            "conversation_id": conv.id,
            "conversation_title": conv.title,
            "query": query,
            "effective_query": effective_query,
            "answer": rag_res.answer,
            "citations": citations_data,
            "confidence": rag_res.confidence,
            "model_used": rag_res.model_used,
            "latency_ms": rag_res.latency_ms
        }

    async def stream_ask_in_conversation(
        self,
        db: AsyncSession,
        query: str,
        current_user: User,
        conversation_id: Optional[str] = None,
        department_id: Optional[str] = None,
        top_k: int = 5,
        include_superseded: bool = False
    ):
        """
        Executes a dialogue turn with real-time SSE streaming.
        Reuses PromptGuard, query contextualization, retrieval, and conversation persistence.
        """
        import time
        from app.core.guardrails import PromptGuard
        from app.core.sse import format_sse_event

        start_time = time.perf_counter()
        clean_query = PromptGuard.sanitize_input(query)

        # Step 0: Input Guardrail Check
        is_safe, refusal_reason = PromptGuard.check_prompt_safety(clean_query)
        if not is_safe:
            yield format_sse_event("error", {"message": PromptGuard.STANDARD_REFUSAL_MESSAGE})
            yield format_sse_event("done", {"status": "blocked_guardrail"})
            return

        # 1. Resolve or create conversation
        if conversation_id:
            conv = await self.get_conversation(db, conversation_id, current_user)
        else:
            title_words = clean_query.strip().split()[:6]
            session_title = " ".join(title_words)
            conv = await self.create_conversation(
                db=db,
                user_id=current_user.id,
                title=session_title,
                department_id=department_id or getattr(current_user, "department_id", None)
            )

        # Notify client of conversation context
        yield format_sse_event("session", {
            "conversation_id": conv.id,
            "conversation_title": conv.title
        })

        # 2. Fetch existing messages for query rewriting
        msg_stmt = (
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conv.id)
            .order_by(ConversationMessage.created_at)
        )
        msg_res = await db.execute(msg_stmt)
        existing_messages = list(msg_res.scalars().all())

        effective_query = self.contextualize_query(clean_query, existing_messages)
        # Academic Fuzzy Spell-Check and Query Normalization
        from app.modules.retrieval.normalizer import AcademicQueryNormalizer
        norm_query, expanded_query, query_corrections = AcademicQueryNormalizer.normalize_with_metadata(effective_query)
        effective_query = norm_query or effective_query

        # 3. Save User turn
        user_msg = ConversationMessage(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            owner_id=current_user.id,
            role="user",
            content=clean_query
        )
        db.add(user_msg)
        await db.flush()

        # Step 3.5: Conversational / Small-talk Interceptor (Zero Hallucination / Zero Citations)
        if self.rag_service.is_conversational_query(clean_query):
            yield format_sse_event("status", {"state": "conversational", "effective_query": clean_query})
            yield format_sse_event("citations", [])

            accumulated_text = ""
            llm = self.rag_service.llm_provider
            conv_history = [{"role": m.role, "content": m.content} for m in existing_messages[-4:]]

            async for token in llm.stream_conversational_tokens(clean_query, conversation_history=conv_history):
                accumulated_text += token
                yield format_sse_event("token", {"chunk": token})

            safe_answer = PromptGuard.sanitize_output(accumulated_text.strip())
            latency_ms = (time.perf_counter() - start_time) * 1000.0

            is_local = "local" in llm.__class__.__name__.lower()
            model_name = getattr(llm, 'model', 'default')
            actual_model_used = f"local:{model_name}" if is_local else f"groq:{model_name}"

            asst_msg = ConversationMessage(
                id=str(uuid.uuid4()),
                conversation_id=conv.id,
                owner_id=current_user.id,
                role="assistant",
                content=safe_answer,
                citations=[],
                confidence="high",
                model_used=actual_model_used,
                latency_ms=round(latency_ms, 2)
            )
            db.add(asst_msg)
            await db.commit()
            await db.refresh(conv)

            yield format_sse_event("done", {
                "conversation_id": conv.id,
                "message_id": asst_msg.id,
                "latency_ms": round(latency_ms, 2),
                "citations_count": 0,
                "model_used": actual_model_used,
                "status": "success"
            })
            return

        # Step 4: Hybrid Search Retrieval
        yield format_sse_event("status", {
            "state": "retrieving",
            "effective_query": effective_query,
            "corrections": query_corrections
        })

        lifecycle_filter = "all" if include_superseded else "active"
        search_res = await self.rag_service.retrieval_service.search(
            db=db,
            query=effective_query,
            current_user=current_user,
            top_k=top_k,
            target_department_id=department_id or conv.department_id,
            mode="hybrid",
            lifecycle_status=lifecycle_filter
        )

        evidence_chunks = [item.model_dump() for item in search_res.results]

        # Filter out chunks that have zero or negligible relevance to prevent hallucinations & loops
        relevant_chunks = [c for c in evidence_chunks if self.rag_service.is_chunk_relevant(c, effective_query)]

        # Zero-Hallucination Guard: Intercept ungrounded or unmatched queries
        if not relevant_chunks:
            import asyncio
            yield format_sse_event("citations", [])
            yield format_sse_event("status", {
                "state": "generating",
                "corrections": query_corrections
            })

            clarification = (
                f"I couldn't find any institutional records, syllabus documents, or academic regulations matching "
                f"**\"{clean_query}\"** in the Kolhapur Institute of Technology repository.\n\n"
                f"**Suggested Institutional Inquiries:**\n"
                f"- **Big Data Analytics (UCSPC0701):** *\"Summarize Big Data Analytics course and course outcomes\"*\n"
                f"- **Financial Analytics (UCSMM0741):** *\"What are the prerequisites and syllabus of Financial Analytics?\"*\n"
                f"- **Examination Rules:** *\"What is the minimum attendance requirement and ATKT / passing criteria?\"*\n"
                f"- **DevOps & Cloud:** *\"What experiments are included in DevOps laboratory?\"*\n\n"
                f"*Tip: If you typed a typo or course code, please check the spelling or specify your department.*"
            )
            for word in clarification.split(" "):
                yield format_sse_event("token", {"chunk": word + " "})
                await asyncio.sleep(0.01)

            latency_ms = (time.perf_counter() - start_time) * 1000.0
            asst_msg = ConversationMessage(
                id=str(uuid.uuid4()),
                conversation_id=conv.id,
                owner_id=current_user.id,
                role="assistant",
                content=clarification,
                citations=[],
                confidence="low",
                model_used="concord:relevance_gate",
                latency_ms=round(latency_ms, 2)
            )
            db.add(asst_msg)
            await db.commit()
            await db.refresh(conv)

            yield format_sse_event("done", {
                "conversation_id": conv.id,
                "message_id": asst_msg.id,
                "latency_ms": round(latency_ms, 2),
                "citations_count": 0,
                "model_used": "concord:relevance_gate",
                "corrections": query_corrections,
                "status": "unmatched_records"
            })
            return

        # Assemble citations metadata strictly from genuinely relevant evidence
        citations_data = []
        for idx, chunk in enumerate(relevant_chunks, start=1):
            citations_data.append({
                "citation_index": idx,
                "chunk_id": chunk.get("chunk_id"),
                "document_id": chunk.get("document_id"),
                "document_title": chunk.get("document_title", "Institutional Record"),
                "document_filename": chunk.get("document_filename"),
                "page_number": chunk.get("page_number", 1),
                "snippet": chunk.get("content", "")[:180] + "...",
                "score": chunk.get("score"),
                "lifecycle_status": chunk.get("lifecycle_status", "active"),
                "version": chunk.get("version", "v1.0"),
            })

        # Emit citations before generating tokens
        yield format_sse_event("citations", citations_data)
        yield format_sse_event("status", {
            "state": "generating",
            "corrections": query_corrections
        })

        # Step 5: Stream Tokens from LLM
        accumulated_text = ""
        llm = self.rag_service.llm_provider
        async for token in llm.stream_grounded_tokens(effective_query, relevant_chunks):
            accumulated_text += token
            yield format_sse_event("token", {"chunk": token})

        # Sanitize final response
        safe_answer = PromptGuard.sanitize_output(accumulated_text.strip())
        latency_ms = (time.perf_counter() - start_time) * 1000.0

        # Determine model tag dynamically based on active provider
        is_local = "local" in llm.__class__.__name__.lower()
        model_name = getattr(llm, 'model', 'default')
        actual_model_used = f"local:{model_name}" if is_local else f"groq:{model_name}"

        # Step 6: Persist Assistant turn to DB
        asst_msg = ConversationMessage(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            owner_id=current_user.id,
            role="assistant",
            content=safe_answer,
            citations=citations_data,
            confidence="high" if citations_data else "medium",
            model_used=actual_model_used,
            latency_ms=round(latency_ms, 2)
        )
        db.add(asst_msg)
        await db.commit()
        await db.refresh(conv)

        # Emit final completion
        yield format_sse_event("done", {
            "conversation_id": conv.id,
            "message_id": asst_msg.id,
            "latency_ms": round(latency_ms, 2),
            "citations_count": len(citations_data),
            "model_used": actual_model_used,
            "corrections": query_corrections,
            "status": "success"
        })

