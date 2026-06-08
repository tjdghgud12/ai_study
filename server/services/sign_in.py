from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lib.security import create_access_token, decode_access_token, verify_password
from models.users_model import User
from schemas.sign_in_schema import SignInResponseSchema, SignInWithTokenResponseSchema


async def sign_in(id: str, password: str, db: AsyncSession) -> SignInResponseSchema:
    user = await db.execute(select(User).where(User.id == id))
    user = user.scalar()

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid password")

    access_token = create_access_token(user.id)

    return SignInResponseSchema(id=user.id, access_token=access_token)


async def sign_in_with_token(token: str, db: AsyncSession) -> SignInWithTokenResponseSchema:
    user_id = decode_access_token(token)
    user = await db.execute(select(User).where(User.id == user_id))
    user = user.scalar()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return SignInWithTokenResponseSchema(id=user.id)
