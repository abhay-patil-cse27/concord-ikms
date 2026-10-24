"""Pagination and Limit Query Parameters Dependency."""
from fastapi import Query
from pydantic import BaseModel, Field


class PaginationParams:
    def __init__(
        self,
        limit: int = Query(50, ge=1, le=200, description="Maximum number of items to return (1-200, default 50)"),
        offset: int = Query(0, ge=0, description="Offset starting point for pagination"),
    ):
        self.limit = limit
        self.offset = offset
