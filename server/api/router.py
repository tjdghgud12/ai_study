from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from schemas.chat_schema import ChatRequest, ChatResponse
from schemas.sign_up_schema import CheckDuplicateIdRequestSchema, SignUpRequestSchema
from services.chat_service import cat_agent
from services.sign_up import check_duplicate_id, sign_up

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


@router.post("/sign-up")
async def sign_up_api(request: SignUpRequestSchema, db: Annotated[AsyncSession, Depends(get_db)]):
    return await sign_up(request.id, request.password, db)


@router.post("/sign-up/check-duplicate-id")
async def check_duplicate_id_api(
    request: CheckDuplicateIdRequestSchema, db: Annotated[AsyncSession, Depends(get_db)]
):
    return await check_duplicate_id(request.id, db)
