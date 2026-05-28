from typing import Literal

from pydantic import Field
from typing_extensions import Any

from schemas.base_schema import BaseSchema


class ChatRequest(BaseSchema):
    message: str
    session_id: str | None = None


class ChatResponse(BaseSchema):
    session_id: str
    chat_reply: str
    used_tools: list[str] = Field(default_factory=list)
    tool_data: dict[str, Any] = Field(default_factory=dict)


class ChatStreamDelta(BaseSchema):
    type: Literal["delta"] = "delta"
    chat_reply: str


class ChatStreamDone(ChatResponse):
    type: Literal["done"] = "done"


class ChatStreamError(BaseSchema):
    type: Literal["error"] = "error"
    detail: str
