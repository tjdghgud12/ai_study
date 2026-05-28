from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from schemas.chat_schema import ChatRequest, ChatResponse
from services.chat_service import cat_agent

router = APIRouter()


@router.get("/")
def read_root():
    return {"Hello": "World"}


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    return await cat_agent.ask_question(request.message, request.session_id)


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        cat_agent.ask_question_stream(request.message, request.session_id),
        media_type="application/x-ndjson",
    )
