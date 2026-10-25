"""Reusable in-memory Background Task and Job Manager for asynchronous tasks."""
import asyncio
import time
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class JobStatus(BaseModel):
    job_id: str
    status: str = Field(..., description="Status: pending, running, completed, failed")
    phase: str = Field(..., description="Active phase: queued, extracting, chunking, embedding, done, error")
    progress: int = Field(0, description="Percentage completed between 0 and 100")
    message: str = Field("", description="Human-readable progress status description")
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)


class BackgroundJobManager:
    """Thread-safe and async-safe task tracker for long-running workflows."""

    def __init__(self, ttl_seconds: int = 3600):
        self._jobs: Dict[str, JobStatus] = {}
        self._lock = asyncio.Lock()
        self.ttl_seconds = ttl_seconds

    async def create_job(self, job_id: str, phase: str = "queued", message: str = "Job submitted.") -> JobStatus:
        async with self._lock:
            # Simple cleanup of expired jobs older than TTL
            now = time.time()
            expired = [jid for jid, j in self._jobs.items() if now - j.created_at > self.ttl_seconds]
            for jid in expired:
                self._jobs.pop(jid, None)

            job = JobStatus(
                job_id=job_id,
                status="pending",
                phase=phase,
                progress=0,
                message=message,
                created_at=now,
                updated_at=now,
            )
            self._jobs[job_id] = job
            return job

    async def update_job(
        self,
        job_id: str,
        status: Optional[str] = None,
        phase: Optional[str] = None,
        progress: Optional[int] = None,
        message: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> Optional[JobStatus]:
        async with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None

            if status is not None:
                job.status = status
            if phase is not None:
                job.phase = phase
            if progress is not None:
                job.progress = max(0, min(100, progress))
            if message is not None:
                job.message = message
            if result is not None:
                job.result = result
            if error is not None:
                job.error = error

            job.updated_at = time.time()
            return job

    async def get_job(self, job_id: str) -> Optional[JobStatus]:
        async with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            return job.model_copy()


# Global Singleton Instance
job_manager = BackgroundJobManager()
