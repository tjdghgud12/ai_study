from __future__ import annotations

import sys
from pathlib import Path

from langchain_mcp_adapters.client import MultiServerMCPClient

from core.config import mcp_settings

SERVER_ROOT = Path(__file__).resolve().parents[1]


class McpTools:
    def __init__(self):
        self._tavily_client = MultiServerMCPClient(
            {
                "weather": {
                    "transport": "http",  # HTTP-based remote server
                    "url": f"https://mcp.tavily.com/mcp/?tavilyApiKey={mcp_settings.tavily_api_key}",
                }
            }
        )

        self._brave_client = MultiServerMCPClient(
            {
                "brave": {
                    "transport": "stdio",
                    "command": sys.executable,
                    "args": [str(SERVER_ROOT / "local_mcp_server" / "brave_mcp_server.py")],
                    "env": {
                        "BRAVE_SEARCH_API_KEY": mcp_settings.brave_search_api_key,
                    },
                }
            }
        )

    async def get_tavily_tools(self):
        return await self._tavily_client.get_tools()

    async def get_brave_tools(self):
        return await self._brave_client.get_tools()
