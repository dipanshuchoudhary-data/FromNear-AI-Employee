"""
Research agent — scrapes website + Instagram, calls LLM, writes
BusinessSummary + QualificationScore into shared State.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

from pydantic import BaseModel

from app.llm import chat
from app.prompts import RESEARCH_PROMPT
from app.schemas import BusinessSummary, QualificationScore
from app.tools import scrape_website, scrape_instagram

logger = logging.getLogger(__name__)


class _ResearchOutput(BaseModel):
    summary: BusinessSummary
    qualification: QualificationScore


async def research_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Reads: state["vendor_input"]
    Writes: state["summary"], state["qualification"], state["raw_research"]
    """
    vendor_input = state["vendor_input"]

    # Scrape in parallel
    import asyncio
    website_data, instagram_data = await asyncio.gather(
        scrape_website(vendor_input.website),
        scrape_instagram(vendor_input.instagram),
    )

    raw_research = {
        "website": website_data,
        "instagram": instagram_data,
    }

    prompt = RESEARCH_PROMPT.format(
        vendor_json=vendor_input.model_dump_json(indent=2),
        website_data=json.dumps(website_data, indent=2),
        instagram_data=json.dumps(instagram_data, indent=2),
    )

    try:
        output = await chat(prompt, _ResearchOutput)
        logger.info(
            "research_agent done: score=%d tier=%s",
            output.qualification.score,
            output.qualification.tier,
        )
        return {
            **state,
            "raw_research": raw_research,
            "summary": output.summary,
            "qualification": output.qualification,
        }
    except Exception as exc:
        logger.error("research_agent error: %s", exc)
        errors = state.get("errors", [])
        errors.append(f"research: {exc}")
        return {**state, "raw_research": raw_research, "errors": errors}
