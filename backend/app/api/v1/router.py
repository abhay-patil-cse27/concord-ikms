from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.organizations import router as orgs_router
from app.api.v1.audit import router as audit_router
from app.api.v1.documents import router as documents_router
from app.api.v1.search import router as search_router
from app.api.v1.rag import router as rag_router
from app.api.v1.governance import router as governance_router
from app.api.v1.evaluation import router as evaluation_router
from app.api.v1.conversations import router as conversations_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(orgs_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(documents_router)
api_v1_router.include_router(search_router)
api_v1_router.include_router(rag_router)
api_v1_router.include_router(governance_router)
api_v1_router.include_router(evaluation_router)
api_v1_router.include_router(conversations_router)



