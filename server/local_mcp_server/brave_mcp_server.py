from __future__ import annotations

import json
import logging
import os

import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(name="brave-search")
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("mcp_debug.log")],  # 파일로 남기기
)
logger = logging.getLogger(__name__)

BRAVE_API_URL = "https://api.search.brave.com/res/v1/web/search"
BRAVE_SEARCH_API_KEY = os.getenv("BRAVE_SEARCH_API_KEY")
MAX_RETRIES = 3


@mcp.tool()
async def brave_search(query: str, count: int = 5) -> str:
    logger.debug(f"요청: query={query}, count={count}")
    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_SEARCH_API_KEY,
    }
    body = {"q": query, "count": count}

    try:
        async with httpx.AsyncClient() as client:
            for attempt in range(MAX_RETRIES):
                logger.debug(f"요청 시도: query={query}, count={count}, retry={attempt}")
                data = None
                response = await client.post(BRAVE_API_URL, headers=headers, json=body)
                logger.debug(f"응답: {response.status_code}")
                if response.status_code == 503:
                    if attempt >= MAX_RETRIES - 1:
                        return f"Error({response.status_code}): Exceeded the number of retries for Brave Search."
                    continue
                elif response.status_code == 401:
                    return f"Error({response.status_code}): Brave Search API Key is invalid."
                elif response.status_code == 429:
                    return (
                        f"Error({response.status_code}): Brave Search API request limit exceeded."
                    )
                elif response.status_code == 200:
                    data = response.json()
                    break
                else:
                    return f"Error({response.status_code}): Brave Search API error occurred."

            if data.get("error"):
                status = data.get("error", {}).get("status")
                if status == "429":
                    return f"Error({status}): Brave Search API request limit exceeded."
                else:
                    return f"""Error({status}): Brave Search API error occurred.
                    detail: {data.get("error", {}).get("detail")}
                    """

            _fields = ("title", "url", "description", "extra_snippets")

            brave_results = data.get("web", {}).get("results", [])

            return json.dumps(
                {
                    "type": data.get("type"),
                    "original_query": data.get("query", {}).get("original"),
                    "results": [{k: item.get(k) for k in _fields} for item in brave_results],
                }
            )

    except Exception as e:
        return f"검색 중 오류가 발생했습니다: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
