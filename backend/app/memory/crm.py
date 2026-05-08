"""
CRM helpers — async CRUD on the SQLite database via SQLAlchemy.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.memory.db import Interaction, Vendor, _get_session_factory, _dumps, _loads
from app.schemas import VendorInput


async def _session():
    return _get_session_factory()()


# ─────────────────────────── Vendor ──────────────────────────────────────────

async def upsert_vendor(vendor_input: VendorInput) -> Vendor:
    """
    Find vendor by name+location or create a new one.
    Returns the ORM object.
    """
    async with _get_session_factory()() as session:
        stmt = select(Vendor).where(
            Vendor.name == vendor_input.name,
            Vendor.location == vendor_input.location,
        )
        result = await session.execute(stmt)
        vendor = result.scalars().first()

        if vendor is None:
            vendor = Vendor(
                name=vendor_input.name,
                category=vendor_input.category.value,
                location=vendor_input.location,
                website=vendor_input.website,
                instagram=vendor_input.instagram,
                products=_dumps(vendor_input.products),
            )
            session.add(vendor)
        else:
            vendor.category = vendor_input.category.value
            vendor.website = vendor_input.website
            vendor.instagram = vendor_input.instagram
            vendor.products = _dumps(vendor_input.products)

        await session.commit()
        await session.refresh(vendor)
        return vendor


async def save_run(
    vendor_id: int,
    summary: Dict[str, Any],
    qualification: Dict[str, Any],
    pitch: Dict[str, Any],
    campaign: Dict[str, Any],
) -> None:
    """Persist latest run artifacts to the vendor record."""
    async with _get_session_factory()() as session:
        vendor = await session.get(Vendor, vendor_id)
        if vendor is None:
            return

        vendor.latest_summary = _dumps(summary)
        vendor.latest_qualification = _dumps(qualification)

        # Append to pitches list
        pitches = _loads(vendor.pitches) or []
        pitches.append(pitch)
        vendor.pitches = _dumps(pitches)

        # Append to campaigns list
        campaigns = _loads(vendor.campaigns) or []
        campaigns.append(campaign)
        vendor.campaigns = _dumps(campaigns)

        await session.commit()


async def append_interaction(
    vendor_id: int, type_: str, content: Dict[str, Any]
) -> None:
    """Add an interaction log entry for a vendor."""
    async with _get_session_factory()() as session:
        interaction = Interaction(
            vendor_id=vendor_id,
            type=type_,
            content=_dumps(content),
        )
        session.add(interaction)
        await session.commit()


async def get_vendor(vendor_id: int) -> Optional[Vendor]:
    async with _get_session_factory()() as session:
        return await session.get(Vendor, vendor_id)


async def list_vendors() -> List[Vendor]:
    async with _get_session_factory()() as session:
        result = await session.execute(select(Vendor).order_by(Vendor.created_at.desc()))
        return list(result.scalars().all())


async def get_history(vendor_id: int) -> List[Interaction]:
    async with _get_session_factory()() as session:
        stmt = (
            select(Interaction)
            .where(Interaction.vendor_id == vendor_id)
            .order_by(Interaction.timestamp.desc())
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())
