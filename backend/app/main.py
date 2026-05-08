"""
FromNear AI Employee — FastAPI application entry point.
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.memory import init_db
from app.routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
)

settings = get_settings()

app = FastAPI(
    title="FromNear AI Employee",
    description=(
        "AI-powered sales & marketing assistant for Indian local businesses. "
        "4-agent LangGraph pipeline: research → sales → marketing → validator."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — origins from .env
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await init_db()


# Register all routes under /api/v1
app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "service": "FromNear AI Employee",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
