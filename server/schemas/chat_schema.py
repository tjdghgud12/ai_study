from typing import Any

from pydantic import Field

from schemas.base_schema import BaseSchema


class ChatRequest(BaseSchema):
    message: str


class ChatResponse(BaseSchema):
    chat_reply: str
    used_tools: list[str] = Field(default_factory=list)
    tool_data: dict[str, list[dict[str, Any]]] = Field(default_factory=dict)
    search_sources: list[str] = Field(default_factory=list)
