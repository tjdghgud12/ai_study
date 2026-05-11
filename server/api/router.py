from fastapi import APIRouter

from schemas.chat_schema import ChatRequest, ChatResponse
from services.chat_service import cat_agent

router = APIRouter()


@router.get("/")
def read_root():
    return {"Hello": "World"}


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    return await cat_agent.ask_question(request.message, request.session_id)
