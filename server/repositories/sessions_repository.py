import json
from datetime import datetime

from redis.asyncio import Redis
from sqlalchemy import func, insert, inspect, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.sessions_model import Sessions


def session_to_json_string(session: Sessions) -> str:
    return json.dumps(
        {
            column.key: getattr(session, column.key)
            for column in inspect(session).mapper.column_attrs
        },
        default=str,
    )


def _sortable_datetime(value: datetime | str | None) -> datetime:
    if value is None:
        return datetime.min
    if isinstance(value, str):
        return datetime.fromisoformat(value)
    return value


def _session_from_redis(raw: str) -> Sessions:
    data = json.loads(raw)
    for key in ("created_at", "updated_at"):
        if data.get(key) is not None:
            data[key] = _sortable_datetime(data[key])
    return Sessions(**data)


async def create_session(
    db: AsyncSession, redis: Redis, user_id: str, session_id: str, title: str
) -> Sessions:
    session = (
        (
            await db.execute(
                insert(Sessions)
                .values(
                    user_id=user_id,
                    id=session_id,
                    title=title,
                    next_sequence=2,
                )
                .returning(Sessions)
            )
        )
        .scalars()
        .one()
    )
    await db.commit()

    await redis.hset(f"sessions:{user_id}", session.id, session_to_json_string(session))

    return session


async def update_session(
    db: AsyncSession, redis: Redis, user_id: str, session_id: str
) -> Sessions | None:
    session = (
        (
            await db.execute(
                update(Sessions)
                .where(
                    Sessions.id == session_id,
                    Sessions.user_id == user_id,
                )
                .values(
                    next_sequence=func.coalesce(Sessions.next_sequence, 0) + 2,
                    updated_at=func.now(),
                )
                .returning(Sessions)
            )
        )
        .scalars()
        .one_or_none()
    )
    await db.commit()

    if session is None:
        return None

    await redis.hset(f"sessions:{user_id}", session.id, session_to_json_string(session))

    return session


async def get_sessions_data(db: AsyncSession, redis: Redis, user_id: str) -> list[Sessions]:
    session_data = await redis.hgetall(f"sessions:{user_id}")
    if not session_data:
        sessions = (
            (
                await db.execute(
                    select(Sessions)
                    .where(Sessions.user_id == user_id)
                    .order_by(Sessions.created_at.desc())
                )
            )
            .scalars()
            .all()
        )
        mapping = {s.id: session_to_json_string(s) for s in sessions}
        if mapping:
            await redis.hset(f"sessions:{user_id}", mapping=mapping)

        return sessions
    sessions = [_session_from_redis(raw) for raw in session_data.values()]
    sessions.sort(key=lambda session: session.created_at, reverse=True)

    return sessions
