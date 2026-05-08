"""
Async LLM client — talks to any OpenAI-compatible endpoint (e.g. Ollama).
No model names, prompts, or provider strings live here.
All config comes from app.config.settings.
"""
from __future__ import annotations

import json
import logging
import re
from typing import List, Type, TypeVar

import httpx
from openai import AsyncOpenAI, APIError, APITimeoutError
from pydantic import BaseModel
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.config import get_settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

_client: AsyncOpenAI | None = None


def _get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncOpenAI(
            base_url=settings.llm_base_url,
            api_key="ollama",  # Ollama ignores the key; required by SDK
            timeout=httpx.Timeout(120.0),
        )
    return _client


@retry(
    retry=retry_if_exception_type((APIError, APITimeoutError)),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    stop=stop_after_attempt(3),
    reraise=True,
)
async def chat(prompt: str, schema: Type[T]) -> T:
    """
    Send *prompt* to the chat model and return a validated *schema* instance.
    Forces JSON output via system instruction; retries on transient errors.
    """
    settings = get_settings()
    client = _get_openai_client()

    messages = [
        {
            "role": "system",
            "content": (
                "You are a precise JSON-only assistant. "
                "Always respond with valid JSON that conforms exactly to the requested schema. "
                "No markdown fences, no commentary, no extra text — raw JSON only."
            ),
        },
        {"role": "user", "content": prompt},
    ]

    logger.debug("chat() → model=%s prompt_len=%d", settings.chat_model, len(prompt))

    response = await client.chat.completions.create(
        model=settings.chat_model,
        messages=messages,  # type: ignore[arg-type]
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    raw = re.sub(
        r"^```json\s*|\s*```$",
        "",
        raw.strip(),
        flags=re.IGNORECASE | re.DOTALL,
    ).strip()
    logger.debug("chat() ← raw_len=%d", len(raw))

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("chat() JSON parse error: %s | raw=%s", exc, raw[:500])
        raise ValueError(f"LLM returned non-JSON: {raw[:200]}") from exc

    try:
        return schema.model_validate(data)
    except Exception as exc:
        logger.error(
            "chat() schema validation error (%s): %s | raw=%s",
            schema.__name__,
            exc,
            raw[:1000],
        )
        raise


@retry(
    retry=retry_if_exception_type((APIError, APITimeoutError)),
    wait=wait_exponential(multiplier=1, min=2, max=20),
    stop=stop_after_attempt(3),
    reraise=True,
)
async def embed(texts: List[str]) -> List[List[float]]:
    """Return embedding vectors for a list of texts."""
    settings = get_settings()
    client = _get_openai_client()

    logger.debug("embed() → model=%s n=%d", settings.embed_model, len(texts))

    response = await client.embeddings.create(
        model=settings.embed_model,
        input=texts,
    )

    return [item.embedding for item in response.data]
