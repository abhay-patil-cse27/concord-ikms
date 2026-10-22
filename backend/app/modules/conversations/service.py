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

        # Platform admin or owner can access
        user_roles = [r.code for r in current_user.roles] if hasattr(current_user, "roles") else []
        if conv.user_id != current_user.id and "platform_admin" not in user_roles:
            raise ForbiddenError("You do not have permission to access this conversation.")

        return conv

    async def create_conversation(
        self,
        db: AsyncSession,
        user_id: str,
        title: Optional[str] = None,
        department_id: Optional[str] = None
    ) -> Conversation:
        conv = Conversation(
            id=str(uuid.uuid4()),
            title=title or "New Institutional Inquiry",
            user_id=user_id,
            department_id=department_id
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        return conv

    async def delete_conversation(self, db: AsyncSession, conversation_id: str, current_user: User) -> None:
        conv = await self.get_conversation(db, conversation_id, current_user)
        await db.delete(conv)
        await db.commit()

    @staticmethod
    def contextualize_query(query: str, previous_messages: List[ConversationMessage]) -> str:
        """
        Rewrites or augments follow-up queries that contain ambiguous pronouns (it, that, these, the rules)
        using the subject of the immediately preceding user query.
        """
        clean_q = query.strip()
        lower_q = clean_q.lower()
        pronouns = [" it", " that", " these", " those", " same", " above", " for it", " about it"]
        
        has_pronoun = any(p in lower_q for p in pronouns) or len(lower_q.split()) <= 4
        if not has_pronoun or not previous_messages:
            return clean_q

        # Find the latest user query from the preceding history
        last_user_turn = None
        for msg in reversed(previous_messages):
            if msg.role == "user":
                last_user_turn = msg.content
                break

        if last_user_turn:
            # Contextualized synthetic query providing antecedent context
            return f"{clean_q} (Regarding: {last_user_turn})"

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
        # 1. Resolve or create conversation
        if conversation_id:
            conv = await self.get_conversation(db, conversation_id, current_user)
        else:
            # Generate concise session title from first 6 words
            title_words = query.strip().split()[:6]
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

        # 3. Contextual query rewriting
        effective_query = self.contextualize_query(query, existing_messages)

        # 3. Save User turn
        user_msg = ConversationMessage(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            role="user",
            content=query
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
