"""
Validator agent — deterministic, no LLM.
Checks pitch and campaign quality. Triggers retry loop on failure.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.config import get_settings

logger = logging.getLogger(__name__)


def _check_pitch(pitch, vendor_name: str) -> List[str]:
    """Return list of failed checks (empty = all pass)."""
    failed: List[str] = []

    if pitch is None:
        return ["pitch is None"]

    # 1. Must mention the business name
    combined = (pitch.email_body + pitch.hook + " ".join(pitch.value_props)).lower()
    if vendor_name.lower() not in combined:
        failed.append(f"pitch does not mention business name: {vendor_name!r}")

    # 2. Non-trivial CTA (not just "click here" / "visit our website")
    trivial_ctas = {"click here", "visit our website", "visit website", "learn more"}
    if pitch.cta.strip().lower() in trivial_ctas:
        failed.append(f"CTA is trivial: {pitch.cta!r}")

    # 3. Exactly 3 follow-ups
    if len(pitch.follow_ups) != 3:
        failed.append(f"expected exactly 3 follow_ups, got {len(pitch.follow_ups)}")

    # 4. No generic openers
    generic_openers = [
        "i hope this email finds you",
        "i hope this finds you",
        "my name is",
        "to whom it may concern",
        "dear sir",
        "dear madam",
    ]
    email_lower = pitch.email_body.lower()
    for opener in generic_openers:
        if email_lower.startswith(opener) or email_lower[:80].find(opener) != -1:
            failed.append(f"generic opener detected: {opener!r}")
            break

    # 5. Follow-ups must be distinct (simple check: no two identical)
    if len(set(pitch.follow_ups)) < len(pitch.follow_ups):
        failed.append("follow_ups contain duplicate messages")

    return failed


def _check_campaign(campaign, min_posts: int) -> List[str]:
    failed: List[str] = []

    if campaign is None:
        return ["campaign is None"]

    if len(campaign.posts) < min_posts:
        failed.append(
            f"campaign has {len(campaign.posts)} posts, minimum is {min_posts}"
        )

    return failed


async def validator_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic validation — no LLM calls.
    Sets state["valid"] = True/False.
    Increments state["retries"] and appends to state["errors"] on failure.
    """
    settings = get_settings()
    vendor_input = state["vendor_input"]
    pitch = state.get("pitch")
    campaign = state.get("campaign")
    retries = state.get("retries", 0)

    failed: List[str] = []
    failed.extend(_check_pitch(pitch, vendor_input.name))
    failed.extend(_check_campaign(campaign, settings.min_campaign_posts))

    if failed:
        retries += 1
        logger.warning(
            "validator_agent: FAIL (retry %d) checks=%s", retries, failed
        )
        return {
            **state,
            "valid": False,
            "retries": retries,
            "errors": failed,
        }

    logger.info("validator_agent: PASS")
    return {**state, "valid": True, "retries": retries, "errors": []}
