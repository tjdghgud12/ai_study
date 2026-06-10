from datetime import datetime
from typing import Literal

from pydantic import Field
from typing_extensions import Any

from schemas.base_schema import BaseSchema


class ChatRequest(BaseSchema):
    message: str
    user_id: str | None = None
    session_id: str | None = None


class ChatResponse(BaseSchema):
    session_id: str
    chat_reply: str
    used_tools: list[str] = Field(default_factory=list)
    tool_data: dict[str, Any] = Field(default_factory=dict)


class ChatStreamDelta(BaseSchema):
    type: Literal["delta"] = "delta"
    message_id: str
    chat_reply: str


class ChatStreamDone(ChatResponse):
    type: Literal["done"] = "done"
    message_id: str


class ChatStreamError(BaseSchema):
    type: Literal["error"] = "error"
    message_id: str
    detail: str


class SessionResponse(BaseSchema):
    session_id: str
    title: str | None = None
    created_at: datetime
    updated_at: datetime
