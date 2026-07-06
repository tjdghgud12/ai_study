from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from db.redis import get_redis
from db.session import get_db
from lib.security import decode_access_token
from schemas.chat_schema import ChatRequest, ChatResponse
from schemas.sign_in_schema import SignInRequestSchema
from schemas.sign_up_schema import CheckDuplicateIdRequestSchema, SignUpRequestSchema
from services.chat_service import cat_agent, get_chat_messages, get_sessions
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
async def chat_stream(
    request: ChatRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
    cookie_token: Annotated[str | None, Cookie(alias="access_token")] = None,
):
    token = credentials.credentials if credentials else cookie_token
    user_id = decode_access_token(token)
    return StreamingResponse(
        cat_agent.ask_question_stream(
            user_input=request.message,
            db=db,
            redis=redis,
            user_id=request.user_id or user_id,
            session_id=request.session_id,
        ),
        media_type="application/x-ndjson",
    )


@router.get("/chat/sessions")
async def get_sessions_api(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
    cookie_token: Annotated[str | None, Cookie(alias="access_token")] = None,
):
    token = credentials.credentials if credentials else cookie_token
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return await get_sessions(db=db, redis=redis, token=token)


@router.get("/chat/messages")
async def get_chat_messages_api(
    session_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
    cookie_token: Annotated[str | None, Cookie(alias="access_token")] = None,
):
    token = credentials.credentials if credentials else cookie_token
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return await get_chat_messages(session_id=session_id, db=db, redis=redis, token=token)


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
    response.delete_cookie(key="access_token", httponly=True)
    return {"ok": True}
