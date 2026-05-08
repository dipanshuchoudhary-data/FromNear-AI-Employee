"""
All Pydantic schemas for the FromNear AI Employee pipeline.
Every field includes a description. Re-exported from this module.
"""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, ValidationInfo, field_validator


# ─────────────────────────── Vendor Input ────────────────────────────────────

class VendorCategory(str, Enum):
    food_beverage = "food_beverage"
    retail = "retail"
    services = "services"
    healthcare = "healthcare"
    education = "education"
    fashion = "fashion"
    beauty_wellness = "beauty_wellness"
    home_decor = "home_decor"
    electronics = "electronics"
    other = "other"


class VendorInput(BaseModel):
    name: str = Field(..., description="Business / vendor name")
    website: Optional[str] = Field(None, description="Public website URL if available")
    instagram: Optional[str] = Field(None, description="Instagram profile URL if available")
    category: VendorCategory = Field(..., description="Business category (constrained enum)")
    location: str = Field(..., description="City and state of the business")
    products: List[str] = Field(..., description="List of key products or services offered")


# ─────────────────────────── Business Summary ─────────────────────────────────

class BusinessSummary(BaseModel):
    overview: str = Field(..., description="2-3 sentence narrative overview of the business")
    target_audience: str = Field(..., description="Primary customer segments targeted by this business")
    usps: List[str] = Field(..., description="Unique selling propositions identified from research")
    pain_points: List[str] = Field(..., description="Key pain points or challenges the business faces")
    digital_presence_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Score from 0–100 reflecting strength of digital/online presence",
    )


# ─────────────────────────── Qualification Score ─────────────────────────────

class LeadTier(str, Enum):
    hot = "hot"
    warm = "warm"
    cold = "cold"


class QualificationScore(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Lead quality score from 0 to 100")
    tier: LeadTier = Field(..., description="Lead tier: hot (≥70), warm (40–69), cold (<40)")
    reasoning: str = Field(..., description="Explanation of the score and tier assignment")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Model confidence in this assessment (0–1)"
    )

    @field_validator("tier", mode="before")
    @classmethod
    def normalize_tier(cls, value, info: ValidationInfo):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"hot", "warm", "cold"}:
                return normalized

        score = info.data.get("score") if info.data else None
        if isinstance(score, int):
            if score >= 70:
                return "hot"
            if score >= 40:
                return "warm"
            return "cold"

        if value in (None, ""):
            return "warm"

        return value


# ─────────────────────────── Sales Pitch ─────────────────────────────────────

class SalesPitch(BaseModel):
    subject: str = Field(..., description="Email subject line")
    hook: str = Field(..., description="Opening hook / attention-grabbing first sentence")
    value_props: List[str] = Field(..., description="Key value propositions tailored to the business")
    cta: str = Field(..., description="Clear, low-friction call to action")
    email_body: str = Field(..., description="Full email body (warm tone for Indian local businesses)")
    whatsapp_version: str = Field(
        ..., description="Condensed WhatsApp-friendly version (≤300 chars)"
    )
    follow_ups: List[str] = Field(
        ...,
        min_length=3,
        max_length=3,
        description="Exactly 3 differentiated follow-up messages",
    )


# ─────────────────────────── Marketing Campaign ──────────────────────────────

class InstagramPost(BaseModel):
    day: int = Field(..., description="Day number in the campaign schedule (1-indexed)")
    type: str = Field(
        ..., description="Post type: reel, carousel, static, story, poll, etc."
    )
    hook: str = Field(..., description="Attention-grabbing opening line or visual concept")
    caption: str = Field(..., description="Full post caption with emojis and storytelling")
    hashtags: List[str] = Field(..., description="Relevant hashtags (without #)")
    cta: str = Field(..., description="Call to action for this specific post")


class Campaign(BaseModel):
    theme: str = Field(..., description="Overall campaign theme tying all content together")
    duration_days: int = Field(..., description="Total campaign duration in days")
    posts: List[InstagramPost] = Field(
        ..., description="Ordered list of posts across campaign duration"
    )
    ad_ideas: List[str] = Field(
        ..., description="A few paid ad creative ideas to complement organic content"
    )
    expected_outcomes: List[str] = Field(
        ..., description="Realistic expected outcomes from running this campaign"
    )


# ─────────────────────────── Run Result ──────────────────────────────────────

class RunResult(BaseModel):
    vendor_id: int = Field(..., description="Persisted vendor database ID")
    summary: BusinessSummary
    qualification: QualificationScore
    pitch: SalesPitch
    campaign: Campaign
