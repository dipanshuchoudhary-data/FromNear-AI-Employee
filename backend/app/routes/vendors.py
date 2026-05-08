"""
All API route handlers — async, mounted under /api/v1.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.memory import (
    append_interaction,
    get_history,
    get_vendor,
    list_vendors,
    remember,
    save_run,
    upsert_vendor,
)
from app.memory.db import _loads
from app.orchestrator import run_pipeline
from app.schemas import RunResult, VendorInput

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────── Health ──────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok"}


# ─────────────────────────── Vendor Run ──────────────────────────────────────

@router.post("/vendors/run", response_model=RunResult)
async def run_vendor(vendor_input: VendorInput):
    """
    Run the full 4-agent pipeline for a vendor.
    Persists results to SQLite + ChromaDB. Returns run artifacts.
    """
    # Persist / find vendor
    vendor = await upsert_vendor(vendor_input)

    # Run pipeline
    state = await run_pipeline(vendor_input, vendor_id=vendor.id)

    summary = state.get("summary")
    qualification = state.get("qualification")
    pitch = state.get("pitch")
    campaign = state.get("campaign")

    if summary is None or qualification is None or pitch is None or campaign is None:
        errors = state.get("errors", [])
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline did not produce complete output. Errors: {errors}",
        )

    # Persist run artifacts
    await save_run(
        vendor.id,
        summary=summary.model_dump(),
        qualification=qualification.model_dump(),
        pitch=pitch.model_dump(),
        campaign=campaign.model_dump(),
    )

    # Store in vector memory for future recall
    await remember(
        text=f"Pitch for {vendor_input.name}: {pitch.email_body}",
        vendor_id=vendor.id,
        metadata={"type": "pitch"},
    )
    await remember(
        text=f"Summary for {vendor_input.name}: {summary.overview}",
        vendor_id=vendor.id,
        metadata={"type": "summary"},
    )

    # Log interaction
    await append_interaction(
        vendor_id=vendor.id,
        type_="run",
        content={
            "summary": summary.model_dump(),
            "qualification": qualification.model_dump(),
            "pitch": pitch.model_dump(),
            "campaign": campaign.model_dump(),
        },
    )

    return RunResult(
        vendor_id=vendor.id,
        summary=summary,
        qualification=qualification,
        pitch=pitch,
        campaign=campaign,
    )


# ─────────────────────────── Vendor List ─────────────────────────────────────

@router.get("/vendors")
async def get_vendors():
    """List all vendors with summary stats."""
    vendors = await list_vendors()
    result = []
    for v in vendors:
        qual = _loads(v.latest_qualification)
        result.append(
            {
                "id": v.id,
                "name": v.name,
                "category": v.category,
                "location": v.location,
                "score": qual.get("score") if qual else None,
                "tier": qual.get("tier") if qual else None,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
        )
    return result


# ─────────────────────────── Vendor Detail ───────────────────────────────────

@router.get("/vendors/{vendor_id}")
async def get_vendor_detail(vendor_id: int):
    """Full vendor record with all fields."""
    vendor = await get_vendor(vendor_id)
    if vendor is None:
        raise HTTPException(status_code=404, detail="Vendor not found")

    return {
        "id": vendor.id,
        "name": vendor.name,
        "category": vendor.category,
        "location": vendor.location,
        "website": vendor.website,
        "instagram": vendor.instagram,
        "products": _loads(vendor.products),
        "latest_summary": _loads(vendor.latest_summary),
        "latest_qualification": _loads(vendor.latest_qualification),
        "pitches": _loads(vendor.pitches) or [],
        "campaigns": _loads(vendor.campaigns) or [],
        "created_at": vendor.created_at.isoformat() if vendor.created_at else None,
    }


# ─────────────────────────── Last Run Artifacts ──────────────────────────────

@router.get("/vendors/{vendor_id}/run")
async def get_last_run(vendor_id: int):
    """Raw last run artifacts for a vendor."""
    vendor = await get_vendor(vendor_id)
    if vendor is None:
        raise HTTPException(status_code=404, detail="Vendor not found")

    pitches = _loads(vendor.pitches) or []
    campaigns = _loads(vendor.campaigns) or []

    return {
        "vendor_id": vendor_id,
        "summary": _loads(vendor.latest_summary),
        "qualification": _loads(vendor.latest_qualification),
        "pitch": pitches[-1] if pitches else None,
        "campaign": campaigns[-1] if campaigns else None,
    }


# ─────────────────────────── Follow-up ───────────────────────────────────────

class FollowUpRequest(BaseModel):
    additional_context: Optional[str] = None


@router.post("/vendors/{vendor_id}/followup")
async def followup(vendor_id: int, body: FollowUpRequest):
    """
    Re-run the sales agent with memory context for follow-up outreach.
    """
    vendor = await get_vendor(vendor_id)
    if vendor is None:
        raise HTTPException(status_code=404, detail="Vendor not found")

    from app.schemas import VendorCategory, VendorInput as VI

    vendor_input = VI(
        name=vendor.name,
        website=vendor.website,
        instagram=vendor.instagram,
        category=VendorCategory(vendor.category),
        location=vendor.location,
        products=_loads(vendor.products) or [],
    )

    summary_dict = _loads(vendor.latest_summary)
    qual_dict = _loads(vendor.latest_qualification)

    if summary_dict is None or qual_dict is None:
        raise HTTPException(
            status_code=400,
            detail="Run the pipeline first before requesting a follow-up",
        )

    from app.schemas import BusinessSummary, QualificationScore

    state = {
        "vendor_input": vendor_input,
        "vendor_id": vendor_id,
        "summary": BusinessSummary(**summary_dict),
        "qualification": QualificationScore(**qual_dict),
        "errors": [],
    }

    # Add extra context to memory before recall
    if body.additional_context:
        await remember(
            text=body.additional_context,
            vendor_id=vendor_id,
            metadata={"type": "followup_context"},
        )

    from app.agents import sales_agent

    state = await sales_agent(state)
    pitch = state.get("pitch")

    if pitch is None:
        raise HTTPException(status_code=500, detail="Sales agent failed to produce pitch")

    await append_interaction(
        vendor_id=vendor_id,
        type_="followup",
        content=pitch.model_dump(),
    )

    return {"vendor_id": vendor_id, "pitch": pitch.model_dump()}


# ─────────────────────────── History ─────────────────────────────────────────

@router.get("/vendors/{vendor_id}/history")
async def get_vendor_history(vendor_id: int):
    """Interaction history for a vendor, newest first."""
    vendor = await get_vendor(vendor_id)
    if vendor is None:
        raise HTTPException(status_code=404, detail="Vendor not found")

    interactions = await get_history(vendor_id)
    return [
        {
            "id": i.id,
            "type": i.type,
            "content": _loads(i.content),
            "timestamp": i.timestamp.isoformat() if i.timestamp else None,
        }
        for i in interactions
    ]
