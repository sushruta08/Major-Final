"""
Pagination utilities for list API endpoints.
"""
from typing import TypeVar, Generic, List, Optional
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response envelope."""
    items: List[T]
    total: int
    skip: int
    limit: int
    has_more: bool

    @classmethod
    def create(cls, items: List[T], total: int, skip: int, limit: int) -> "PaginatedResponse[T]":
        return cls(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + limit) < total,
        )


def paginate(query, skip: int = 0, limit: int = 20):
    """Apply pagination to a SQLAlchemy query."""
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return items, total
