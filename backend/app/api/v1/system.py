"""System configuration, health diagnostics, and dynamic LLM engine management."""
import time
import httpx
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_role, get_current_user
from app.core.logging import logger
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
    """Hot-swaps LLM provider mode, target node URL, or model tag with persistence and audit logging."""
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
