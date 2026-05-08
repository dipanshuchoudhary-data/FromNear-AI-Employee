"""
Async web scraper — never raises, always returns a dict.
Handles website scraping and thin Instagram public page heuristic.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

_TIMEOUT = httpx.Timeout(15.0, connect=5.0)

_EMPTY_WEBSITE = {
    "title": "",
    "meta_description": "",
    "headings": [],
    "text_sample": "",
}

_EMPTY_INSTAGRAM = {
    "bio": "",
    "recent_captions": [],
}


async def scrape_website(url: Optional[str]) -> Dict[str, Any]:
    """
    Scrape a website URL and return structured data.
    Returns _EMPTY_WEBSITE on any error — never raises.
    """
    if not url:
        return {**_EMPTY_WEBSITE, "error": "no url provided"}

    try:
        async with httpx.AsyncClient(
            headers=_HEADERS,
            timeout=_TIMEOUT,
            follow_redirects=True,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
    except Exception as exc:  # noqa: BLE001
        logger.warning("scrape_website failed for %s: %s", url, exc)
        return {**_EMPTY_WEBSITE, "error": str(exc)}

    try:
        soup = BeautifulSoup(response.text, "lxml")

        # Title
        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else ""

        # Meta description
        meta = soup.find("meta", attrs={"name": re.compile(r"description", re.I)})
        meta_description = meta.get("content", "") if meta else ""  # type: ignore[union-attr]

        # Headings (h1–h3)
        headings: List[str] = []
        for tag in soup.find_all(["h1", "h2", "h3"]):
            text = tag.get_text(strip=True)
            if text:
                headings.append(text)

        # Body text sample (first 1500 chars of readable text)
        for elem in soup(["script", "style", "noscript", "header", "footer", "nav"]):
            elem.decompose()
        body_text = " ".join(soup.stripped_strings)
        text_sample = body_text[:1500]

        return {
            "title": title,
            "meta_description": str(meta_description),
            "headings": headings[:15],
            "text_sample": text_sample,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("scrape_website parse error for %s: %s", url, exc)
        return {**_EMPTY_WEBSITE, "error": f"parse error: {exc}"}


async def scrape_instagram(url: Optional[str]) -> Dict[str, Any]:
    """
    Thin Instagram public-page heuristic.
    Instagram heavily restricts scraping; we do a best-effort extraction.
    Returns _EMPTY_INSTAGRAM on any error — never raises.
    """
    if not url:
        return {**_EMPTY_INSTAGRAM, "error": "no url provided"}

    try:
        async with httpx.AsyncClient(
            headers={
                **_HEADERS,
                "User-Agent": (
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
                ),
            },
            timeout=_TIMEOUT,
            follow_redirects=True,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
    except Exception as exc:  # noqa: BLE001
        logger.warning("scrape_instagram failed for %s: %s", url, exc)
        return {**_EMPTY_INSTAGRAM, "error": str(exc)}

    try:
        soup = BeautifulSoup(response.text, "lxml")

        # Bio from meta description
        meta = soup.find("meta", property="og:description")
        bio = meta.get("content", "") if meta else ""  # type: ignore[union-attr]

        # Try to extract a few caption fragments from JSON blobs
        captions: List[str] = []
        scripts = soup.find_all("script", type="application/ld+json")
        for script in scripts:
            text = script.string or ""
            # rough caption extraction
            found = re.findall(r'"caption"\s*:\s*"([^"]{20,200})"', text)
            captions.extend(found[:5])

        return {
            "bio": str(bio),
            "recent_captions": captions[:5],
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("scrape_instagram parse error: %s", exc)
        return {**_EMPTY_INSTAGRAM, "error": f"parse error: {exc}"}
