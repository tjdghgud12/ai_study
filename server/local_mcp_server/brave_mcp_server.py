from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import httpx
from mcp.server.fastmcp import FastMCP

LOG_PATH = Path(__file__).resolve().parents[1] / "mcp_debug.log"


def _setup_logger() -> logging.Logger:
    log = logging.getLogger("brave_mcp")
    log.setLevel(logging.DEBUG)
    log.propagate = False
    if not any(isinstance(h, logging.FileHandler) for h in log.handlers):
        handler = logging.FileHandler(LOG_PATH, encoding="utf-8")
        handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
        log.addHandler(handler)
    return log


logger = _setup_logger()
mcp = FastMCP(name="brave-search")

BRAVE_API_URL = "https://api.search.brave.com/res/v1/llm/context"
BRAVE_SEARCH_API_KEY = os.getenv("BRAVE_SEARCH_API_KEY")
MAX_RETRIES = 3
REQUEST_TIMEOUT = 30.0


def _format_llm_context(data: dict) -> dict:
    grounding = data.get("grounding") or {}
    generic = grounding.get("generic") or []

    results = []
    for item in generic:
        snippets = item.get("snippets") or []
        results.append(
            {
                "url": item.get("url"),
                "title": item.get("title"),
                "snippets": snippets,
                "snippet_preview": snippets[0][:500] if snippets else None,
            }
        )

    poi = grounding.get("poi")
    if poi:
        results.append(
            {
                "url": poi.get("url"),
                "title": poi.get("title"),
                "snippets": poi.get("snippets") or [],
                "type": "poi",
            }
        )

    for place in grounding.get("map") or []:
        results.append(
            {
                "url": place.get("url"),
                "title": place.get("title"),
                "snippets": place.get("snippets") or [],
                "type": "map",
            }
        )

    return {
        "grounding_count": len(results),
        "sources": data.get("sources") or {},
        "results": results,
    }


@mcp.tool()
async def brave_search(query: str, count: int = 10) -> str:
    if not BRAVE_SEARCH_API_KEY:
        return "Error: BRAVE_SEARCH_API_KEY is not set."

    logger.info("요청: query=%s, count=%s", query, count)
    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_SEARCH_API_KEY,
    }
    body = {"q": query, "count": count}

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            for attempt in range(MAX_RETRIES):
                logger.info("요청 시도: query=%s, count=%s, retry=%s", query, count, attempt)
                data = None
                response = await client.post(BRAVE_API_URL, headers=headers, json=body)
                logger.info("응답: %s", response.status_code)
                if response.status_code == 503:
                    if attempt >= MAX_RETRIES - 1:
                        msg = (
                            f"Error({response.status_code}): "
                            "Exceeded the number of retries for Brave Search."
                        )
                        return msg
                    continue
                if response.status_code == 401:
                    return f"Error({response.status_code}): Brave Search API Key is invalid."
                if response.status_code == 429:
                    return (
                        f"Error({response.status_code}): Brave Search API request limit exceeded."
                    )
                if response.status_code == 200:
                    data = response.json()
                    break
                return f"Error({response.status_code}): Brave Search API error occurred."

            if not data:
                return "Error: Empty response from Brave LLM Context API."

            error = data.get("error")
            if error:
                status = error.get("status")
                if status == "429":
                    return f"Error({status}): Brave Search API request limit exceeded."
                return f"Error({status}): {error.get('detail', 'Brave Search API error occurred.')}"

            payload = _format_llm_context(data)
            if payload["grounding_count"] == 0:
                logger.warning("grounding.generic 비어 있음: query=%s", query)
            return json.dumps(payload, ensure_ascii=False)

    except httpx.TimeoutException:
        logger.exception("Brave API timeout")
        return f"검색 중 타임아웃이 발생했습니다 ({REQUEST_TIMEOUT}s)."
    except Exception as e:
        logger.exception("Brave API error")
        return f"검색 중 오류가 발생했습니다: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
