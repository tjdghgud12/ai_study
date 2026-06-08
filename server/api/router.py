from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Response
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from db.session import get_db
from schemas.chat_schema import ChatRequest, ChatResponse
from schemas.sign_in_schema import SignInRequestSchema
from schemas.sign_up_schema import CheckDuplicateIdRequestSchema, SignUpRequestSchema
from services.chat_service import cat_agent
from services.sign_in import sign_in, sign_in_with_token
from services.sign_up import check_duplicate_id, sign_up

router = APIRouter()
security = HTTPBearer(auto_error=False)


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


@router.post("/sign-in")
async def sign_in_api(
    request: SignInRequestSchema, response: Response, db: Annotated[AsyncSession, Depends(get_db)]
):
    response_data = await sign_in(request.id, request.password, db)
    response.set_cookie(
        key="access_token",
        value=response_data.access_token,
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
    )
    return response_data


@router.get("/sign-in/with-token")
async def sign_in_with_token_api(
    db: Annotated[AsyncSession, Depends(get_db)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
    cookie_token: Annotated[str | None, Cookie(alias="access_token")] = None,
):
    token = credentials.credentials if credentials else cookie_token
    return await sign_in_with_token(token, db)


@router.get("/sign-out")
async def sign_out_api(response: Response):
    response.delete_cookie(key="access_token")
    return Response(status_code=200)
