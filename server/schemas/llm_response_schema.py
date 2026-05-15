from schemas.base_schema import BaseSchema


class LlmResponse(BaseSchema):
    chat_reply: str


class RouterResponse(BaseSchema):
    use_search_tool: bool
