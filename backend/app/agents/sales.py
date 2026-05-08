"""
Sales agent — reads vendor + summary + qualification, recalls prior
interactions from vector store, calls LLM, writes SalesPitch into State.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

from app.llm import chat
from app.memory import recall
from app.prompts import SALES_PROMPT
from app.schemas import SalesPitch

logger = logging.getLogger(__name__)


async def sales_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Reads: state["vendor_input"], state["summary"], state["qualification"],
           state.get("errors"), state.get("vendor_id")
    Writes: state["pitch"]
    """
    vendor_input = state["vendor_input"]
    summary = state.get("summary")
    qualification = state.get("qualification")

    if summary is None or qualification is None:
        errors = state.get("errors", [])
        errors.append("sales: missing summary or qualification from research agent")
        return {**state, "errors": errors}

    # Recall prior interaction snippets from vector store
    vendor_id = state.get("vendor_id")
    snippets = await recall(f"sales pitch for {vendor_input.name}", vendor_id)
    prior_text = "\n---\n".join(snippets) if snippets else "No prior interactions."

    # Validator error feedback for retry loop
    errors_in = state.get("errors", [])
    errors_text = "\n".join(f"- {e}" for e in errors_in) if errors_in else "None"

    prompt = SALES_PROMPT.format(
        vendor_json=vendor_input.model_dump_json(indent=2),
        summary_json=summary.model_dump_json(indent=2),
        qualification_json=qualification.model_dump_json(indent=2),
        prior_interactions=prior_text,
        errors=errors_text,
    )

    try:
        pitch = await chat(prompt, SalesPitch)
        logger.info("sales_agent done: subject=%s", pitch.subject)
        return {**state, "pitch": pitch, "errors": []}
    except Exception as exc:
        logger.error("sales_agent error: %s", exc)
        errors = state.get("errors", [])
        errors.append(f"sales: {exc}")
        return {**state, "errors": errors}
