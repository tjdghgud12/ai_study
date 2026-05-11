from typing import Any

from pydantic import Field

from schemas.base_schema import BaseSchema


class ChatRequest(BaseSchema):
    message: str
    session_id: str | None = None


class ChatResponse(BaseSchema):
    session_id: str
    chat_reply: str
    used_tools: list[str] = Field(default_factory=list)
    tool_data: dict[str, list[dict[str, Any]]] = Field(default_factory=dict)
    search_sources: list[str] = Field(default_factory=list)
