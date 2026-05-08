"""
LangGraph orchestrator — compiles and exposes the 4-agent pipeline.

Graph:
  research → sales → marketing → validator
                                      ↓
                          valid or retries≥max → END
                          else → sales (retry with errors in state)
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import StateGraph, END

from app.agents import (
    marketing_agent,
    research_agent,
    sales_agent,
    validator_agent,
)
from app.config import get_settings
from app.schemas import (
    BusinessSummary,
    Campaign,
    QualificationScore,
    SalesPitch,
    VendorInput,
)

logger = logging.getLogger(__name__)


# ─────────────────────────── Shared State ────────────────────────────────────

class State(TypedDict, total=False):
    vendor_input: VendorInput
    vendor_id: Optional[int]
    raw_research: Optional[Dict[str, Any]]
    summary: Optional[BusinessSummary]
    qualification: Optional[QualificationScore]
    pitch: Optional[SalesPitch]
    campaign: Optional[Campaign]
    valid: bool
    retries: int
    errors: List[str]


# ─────────────────────────── Router ──────────────────────────────────────────

def _after_validator(state: State) -> str:
    settings = get_settings()
    if state.get("valid", False):
        return END
    if state.get("retries", 0) >= settings.max_retries:
        logger.warning("orchestrator: max retries reached, accepting as-is")
        return END
    logger.info("orchestrator: retry → sales (attempt %d)", state.get("retries", 0))
    return "sales"


# ─────────────────────────── Graph ───────────────────────────────────────────

def _build_graph() -> StateGraph:
    graph = StateGraph(State)

    graph.add_node("research", research_agent)
    graph.add_node("sales", sales_agent)
    graph.add_node("marketing", marketing_agent)
    graph.add_node("validator", validator_agent)

    graph.set_entry_point("research")
    graph.add_edge("research", "sales")
    graph.add_edge("sales", "marketing")
    graph.add_edge("marketing", "validator")

    graph.add_conditional_edges(
        "validator",
        _after_validator,
        {END: END, "sales": "sales"},
    )

    return graph


# Compile once at import time
_compiled = _build_graph().compile()


async def run_pipeline(vendor_input: VendorInput, vendor_id: Optional[int] = None) -> State:
    """
    Execute the full 4-agent pipeline and return final state.
    """
    initial: State = {
        "vendor_input": vendor_input,
        "vendor_id": vendor_id,
        "raw_research": None,
        "summary": None,
        "qualification": None,
        "pitch": None,
        "campaign": None,
        "valid": False,
        "retries": 0,
        "errors": [],
    }

    logger.info("orchestrator: starting pipeline for %s", vendor_input.name)
    final_state: State = await _compiled.ainvoke(initial)
    logger.info(
        "orchestrator: done valid=%s retries=%d",
        final_state.get("valid"),
        final_state.get("retries", 0),
    )
    return final_state
