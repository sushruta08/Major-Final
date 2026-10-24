"""
API v1 router — aggregates all endpoint routers.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, scans, dashboard, projects, repositories,
    pipelines, vulnerabilities, users, notifications,
    analytics, reports
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(repositories.router)
api_router.include_router(pipelines.router)
api_router.include_router(scans.router)
api_router.include_router(vulnerabilities.router)
api_router.include_router(users.router)
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(reports.router)
api_router.include_router(dashboard.router)
