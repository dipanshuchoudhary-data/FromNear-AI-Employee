"""
Marketing agent — reads vendor + summary, calls LLM, writes Campaign into State.
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from app.llm import chat
from app.prompts import MARKETING_PROMPT
from app.schemas import Campaign

logger = logging.getLogger(__name__)


async def marketing_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Reads: state["vendor_input"], state["summary"]
    Writes: state["campaign"]
    """
    vendor_input = state["vendor_input"]
    summary = state.get("summary")

    if summary is None:
        errors = state.get("errors", [])
        errors.append("marketing: missing summary from research agent")
        return {**state, "errors": errors}

    prompt = MARKETING_PROMPT.format(
        vendor_json=vendor_input.model_dump_json(indent=2),
        summary_json=summary.model_dump_json(indent=2),
    )

    try:
        campaign = await chat(prompt, Campaign)
        logger.info(
            "marketing_agent done: theme=%s posts=%d",
            campaign.theme,
            len(campaign.posts),
        )
        return {**state, "campaign": campaign}
    except Exception as exc:
        logger.error("marketing_agent error: %s", exc)
        errors = state.get("errors", [])
        errors.append(f"marketing: {exc}")
        return {**state, "errors": errors}
