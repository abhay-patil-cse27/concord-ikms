"""System configuration, health diagnostics, dynamic LLM engine management, and real-time broadcasts."""
import time
import asyncio
import httpx
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role, get_current_user, oauth2_scheme, decode_access_token
from app.core.errors import UnauthorizedError, ForbiddenError
from app.core.logging import logger
from app.core.broadcast import broadcast_hub
from app.core.sse import format_sse_event
from app.modules.identity.models import User
from app.modules.audit.service import AuditService
from app.modules.audit.schemas import AuditEventCreate
from app.modules.retrieval.llm_providers import (
    get_runtime_llm_config,
    set_runtime_llm_config,
    get_llm_status_summary
)

router = APIRouter(prefix="/system", tags=["System & Engine Configuration"])


class LLMConfigUpdateRequest(BaseModel):
    provider_mode: Optional[str] = Field(None, description="'cloud' or 'local'")
    local_url: Optional[str] = Field(None, description="Inference node base URL e.g. http://127.0.0.1:11434")
    local_model: Optional[str] = Field(None, description="Model identifier e.g. qwen2.5:1.5b")


class LLMNodeTestRequest(BaseModel):
    node_url: str = Field(..., description="Target node URL to probe")
    timeout_seconds: float = Field(5.0, description="Ping probe timeout")


class SystemBroadcastRequest(BaseModel):
    event_type: str = Field("system_alert", description="Event type identifier")
    title: str = Field(..., description="Alert or Bulletin Title")
    message: str = Field(..., description="Alert or Bulletin Body")
    severity: str = Field("info", description="Severity level: info, success, warning, error")


async def get_stream_user(
    token_query: Optional[str] = Query(None, alias="token"),
    token_header: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Authenticates SSE stream listeners via Bearer header or query token parameter."""
    raw_token = token_header or token_query
    if not raw_token:
        raise UnauthorizedError(message="Authentication credentials required for broadcast stream")
    try:
        payload = decode_access_token(raw_token)
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError(message="Invalid token claims")
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise ForbiddenError(message="Active institutional user account required")
        return user
    except Exception as exc:
        raise UnauthorizedError(message=f"Stream authentication failed: {str(exc)}")


@router.get("/llm-status", summary="Get Active LLM Engine Status for Users")
async def get_active_llm_status(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns public/read-only status of the active LLM engine for all authenticated users.
    Enables UI badges across all roles (Student, Faculty, HOD, Admin) without exposing secrets.
    """
    return {
        "success": True,
        "status": get_llm_status_summary()
    }


@router.get("/llm-config", summary="Get Effective LLM Configuration")
async def get_llm_configuration(
    current_user = Depends(require_role("platform_admin"))
) -> Dict[str, Any]:
    """Returns the active LLM provider configuration and available models (Admin only)."""
    return {
        "success": True,
        "config": get_runtime_llm_config()
    }


@router.put("/llm-config", summary="Update Runtime LLM Configuration")
async def update_llm_configuration(
    req: LLMConfigUpdateRequest,
    current_user = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Hot-swaps LLM provider mode, target node URL, or model tag with persistence, audit logging, and live SSE broadcast."""
    try:
        updated_config = set_runtime_llm_config(
            provider_mode=req.provider_mode,
            local_url=req.local_url,
            local_model=req.local_model
        )
        logger.info(
            f"Admin '{current_user.email}' updated LLM configuration: "
            f"mode={updated_config['provider_mode']}, url={updated_config['local_url']}, model={updated_config['local_model']}"
        )

        # Audit ledger logging for AI engine routing modification (NIST AI RMF / OWASP compliance)
        try:
            await AuditService.log_event(
                db=db,
                data=AuditEventCreate(
                    user_id=current_user.id,
                    action="SYSTEM_LLM_CONFIG_UPDATE",
                    resource_type="system",
                    resource_id="llm_engine",
                    status="success",
                    details={
                        "provider_mode": updated_config["provider_mode"],
                        "active_model": updated_config["local_model"] if updated_config["provider_mode"] == "local" else updated_config["groq_model"],
                        "local_url": updated_config["local_url"]
                    }
                )
            )
        except Exception as audit_err:
            logger.warning(f"Could not record audit log for LLM config change: {audit_err}")

        # Real-time multi-client broadcast (Option C)
        try:
            display_name = "Local Campus Node (Ollama)" if updated_config["provider_mode"] == "local" else "Groq Cloud API"
            active_model = updated_config["local_model"] if updated_config["provider_mode"] == "local" else updated_config["groq_model"]
            await broadcast_hub.publish(
                "llm_engine_switched",
                {
                    "provider_mode": updated_config["provider_mode"],
                    "display_name": display_name,
                    "active_model": active_model,
                    "local_url": updated_config["local_url"],
                    "admin_email": current_user.email,
                    "message": f"Institutional inference engine switched to {display_name} ({active_model}).",
                    "timestamp": time.time(),
                }
            )
        except Exception as b_err:
            logger.warning(f"Broadcast publish warning: {b_err}")

        return {
            "success": True,
            "message": "LLM Engine configuration updated successfully.",
            "config": updated_config
        }
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/llm-test", summary="Probe Remote/Local Inference Node Health")
async def test_llm_node(
    req: LLMNodeTestRequest,
    current_user = Depends(require_role("platform_admin"))
) -> Dict[str, Any]:
    """
    Pings the specified inference node URL (Ollama, vLLM, or any OpenAI-compatible server)
    to verify reachability, latency, and retrieve available model tags.
    """
    base_url = req.node_url.rstrip("/")
    start_time = time.time()
    discovered_models: List[str] = []

    # 1. Try OpenAI-compatible /v1/models endpoint
    openai_models_url = f"{base_url}/v1/models" if not base_url.endswith("/v1") else f"{base_url}/models"
    reachable = False
    status_msg = ""

    try:
        async with httpx.AsyncClient(timeout=req.timeout_seconds) as client:
            res = await client.get(openai_models_url)
            latency_ms = round((time.time() - start_time) * 1000, 2)
            if res.status_code == 200:
                reachable = True
                status_msg = "Inference node online & ready"
                try:
                    data = res.json()
                    for item in data.get("data", []):
                        if "id" in item:
                            discovered_models.append(item["id"])
                except Exception:
                    pass
            elif res.status_code == 404:
                # If /v1/models is 404, probe native Ollama /api/tags
                ollama_tags_url = f"{base_url}/api/tags"
                res_ollama = await client.get(ollama_tags_url)
                latency_ms = round((time.time() - start_time) * 1000, 2)
                if res_ollama.status_code == 200:
                    reachable = True
                    status_msg = "Ollama node online & ready"
                    try:
                        data = res_ollama.json()
                        for model_item in data.get("models", []):
                            if "name" in model_item:
                                discovered_models.append(model_item["name"])
                    except Exception:
                        pass
                else:
                    reachable = False
                    status_msg = f"HTTP {res_ollama.status_code} from node"
            else:
                reachable = False
                status_msg = f"HTTP {res.status_code} from node"
    except httpx.ConnectError:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        reachable = False
        status_msg = "Connection refused: No service listening at target URL"
    except httpx.TimeoutException:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        reachable = False
        status_msg = f"Request timed out after {req.timeout_seconds}s"
    except Exception as exc:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        reachable = False
        status_msg = f"Connection error: {str(exc)}"

    return {
        "reachable": reachable,
        "latency_ms": latency_ms,
        "status_message": status_msg,
        "target_url": req.node_url,
        "models": discovered_models
    }


# -------------------------------------------------------------
# Option C: Real-Time Institutional Broadcast Hub & Event Stream
# -------------------------------------------------------------

@router.get("/events", summary="Real-time Institutional System & LLM Broadcast Stream")
async def system_events_stream(
    request: Request,
    current_user: User = Depends(get_stream_user)
):
    """
    Server-Sent Events (SSE) stream for real-time institutional broadcasts:
    - LLM engine hot-swap notifications across tabs and users
    - System bulletins, emergency alerts, and administrative updates
    """
    async def event_generator() -> AsyncGenerator[str, None]:
        queue = broadcast_hub.subscribe()
        try:
            # Yield initial connection confirmation with current engine snapshot
            yield format_sse_event("connected", {
                "user_id": str(current_user.id),
                "timestamp": time.time(),
                "active_engine": get_llm_status_summary(),
                "message": "Connected to CONCORD IKMS real-time broadcast stream."
            })
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event_data = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield event_data
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat to prevent client timeout
                    yield format_sse_event("ping", {"timestamp": int(time.time())})
        except asyncio.CancelledError:
            pass
        finally:
            broadcast_hub.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/broadcast", summary="Publish System Broadcast Alert (Platform Admin Only)")
async def publish_system_broadcast(
    req: SystemBroadcastRequest,
    current_user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Allows administrators to send a dynamic broadcast notice to all connected clients."""
    payload = {
        "title": req.title,
        "message": req.message,
        "severity": req.severity,
        "sender": current_user.full_name or current_user.email,
        "timestamp": time.time(),
    }
    deliveries = await broadcast_hub.publish(req.event_type, payload)

    try:
        await AuditService.log_event(
            db=db,
            data=AuditEventCreate(
                user_id=current_user.id,
                action="SYSTEM_BROADCAST_PUBLISHED",
                resource_type="system",
                resource_id=req.event_type,
                status="success",
                details=payload
            )
        )
    except Exception as exc:
        logger.warning(f"Failed to audit broadcast event: {exc}")

    return {
        "success": True,
        "event_type": req.event_type,
        "deliveries": deliveries,
        "payload": payload
    }
