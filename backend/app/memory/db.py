"""
SQLAlchemy async engine, session factory, ORM models, and init_db().
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship

from app.config import get_settings


class Base(DeclarativeBase):
    pass


# ─────────────────────────── ORM Models ──────────────────────────────────────

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    website = Column(String(512), nullable=True)
    instagram = Column(String(512), nullable=True)
    products = Column(Text, nullable=True)  # JSON list
    latest_summary = Column(Text, nullable=True)  # JSON
    latest_qualification = Column(Text, nullable=True)  # JSON
    pitches = Column(Text, nullable=True)  # JSON list
    campaigns = Column(Text, nullable=True)  # JSON list
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=datetime.utcnow)

    interactions = relationship(
        "Interaction", back_populates="vendor", cascade="all, delete-orphan"
    )


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    type = Column(String(100), nullable=False)  # e.g. "run", "followup", "note"
    content = Column(Text, nullable=True)  # JSON
    timestamp = Column(DateTime, server_default=func.now())

    vendor = relationship("Vendor", back_populates="interactions")


# ─────────────────────────── Engine & Session ────────────────────────────────

_engine = None
_session_factory = None


def _get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.database_url,
            echo=False,
            future=True,
        )
    return _engine


def _get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            _get_engine(),
            expire_on_commit=False,
            class_=AsyncSession,
        )
    return _session_factory


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with _get_session_factory()() as session:
        yield session


async def init_db() -> None:
    """Create all tables if they don't exist."""
    async with _get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ─────────────────────────── JSON helpers ────────────────────────────────────

def _dumps(obj) -> str:
    return json.dumps(obj, default=str)


def _loads(s: str | None):
    if not s:
        return None
    return json.loads(s)
