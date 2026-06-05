from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lib.security import hash_password
from models.users_model import User
from schemas.sign_up_schema import CheckDuplicateIdResponseSchema, SignUpResponseSchema


async def sign_up(id: str, password: str, db: AsyncSession) -> SignUpResponseSchema:
    user = User(id=id, password_hash=hash_password(password))
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return SignUpResponseSchema(id=user.id)


async def check_duplicate_id(id: str, db: AsyncSession) -> CheckDuplicateIdResponseSchema:
    user = await db.execute(select(User).where(User.id == id))
    return CheckDuplicateIdResponseSchema(is_duplicate=user.scalar() is not None)
