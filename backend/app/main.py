"""
SecureCI — Security Automation Framework API
Main FastAPI application entry point with WebSocket support.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import Dict, List
import logging
import json

from app.core.config import settings
from app.api.v1.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── WebSocket connection manager ───────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        self.active.setdefault(channel, []).append(websocket)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active:
            self.active[channel] = [w for w in self.active[channel] if w != websocket]

    async def broadcast(self, channel: str, data: dict):
        dead = []
        for ws in self.active.get(channel, []):
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, channel)

manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all DB tables on startup."""
    from app.db.base import engine, Base
    # Import all models so SQLAlchemy registers them
    from app.db.models import User, Project, Repository, Pipeline, Scan, Vulnerability
    from app.db.models import Notification, AuditLog, Report
    Base.metadata.create_all(bind=engine)
    logger.info(f"✅ {settings.APP_NAME} v{settings.APP_VERSION} started")
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise DevSecOps Security Automation Platform",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────
app.include_router(api_router)


# ── WebSocket — pipeline live updates ─────────────────────
@app.websocket("/ws/pipeline/{pipeline_id}")
async def pipeline_ws(websocket: WebSocket, pipeline_id: str):
    await manager.connect(websocket, f"pipeline:{pipeline_id}")
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"pipeline:{pipeline_id}")


# ── WebSocket — global dashboard updates ──────────────────
@app.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    await manager.connect(websocket, "dashboard")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "dashboard")


# ── Health ────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "version": settings.APP_VERSION}


@app.exception_handler(404)
async def not_found(request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found"})


@app.exception_handler(500)
async def server_error(request, exc):
    logger.error(f"500 error: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
