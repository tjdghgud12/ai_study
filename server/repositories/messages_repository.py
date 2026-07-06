import json

from redis.asyncio import Redis
from sqlalchemy import inspect, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.messages_model import Messages


def messages_to_json_string(messages: Messages) -> str:
    return json.dumps(
        {
            column.key: getattr(messages, column.key)
            for column in inspect(messages).mapper.column_attrs
        },
        default=str,
    )


# async def create_messages(
#     db: AsyncSession, redis: Redis, user_id: str, session_id: str, title: str
# ) -> Sessions:
#     session = (
#         (
#             await db.execute(
#                 insert(Sessions)
#                 .values(
#                     user_id=user_id,
#                     id=session_id,
#                     title=title,
#                     next_sequence=2,
#                 )
#                 .returning(Sessions)
#             )
#         )
#         .scalars()
#         .one()
#     )
#     await db.commit()

#     await redis.hset(f"sessions:{user_id}", session.id, session_to_json_string(session))

#     return session


# async def update_session(
#     db: AsyncSession, redis: Redis, user_id: str, session_id: str
# ) -> Sessions | None:
#     session = (
#         (
#             await db.execute(
#                 update(Sessions)
#                 .where(
#                     Sessions.id == session_id,
#                     Sessions.user_id == user_id,
#                 )
#                 .values(
#                     next_sequence=func.coalesce(Sessions.next_sequence, 0) + 2,
#                     updated_at=func.now(),
#                 )
#                 .returning(Sessions)
#             )
#         )
#         .scalars()
#         .one_or_none()
#     )
#     await db.commit()

#     if session is None:
#         return None

#     await redis.hset(f"sessions:{user_id}", session.id, session_to_json_string(session))

#     return session


async def get_messages_data(
    db: AsyncSession, redis: Redis, user_id: str, session_id: str
) -> list[Messages]:
    messages_data = await redis.hgetall(f"messages:{user_id}-{session_id}")
    if not messages_data:
        messages = (
            (
                await db.execute(
                    select(Messages)
                    .where(Messages.user_id == user_id, Messages.session_id == session_id)
                    .order_by(Messages.sequence.asc())
                )
            )
            .scalars()
            .all()
        )

        mapping = {f"{m.turn_id}-{str(m.role)}": messages_to_json_string(m) for m in messages}
        if mapping:
            await redis.hset(f"messages:{user_id}-{session_id}", mapping=mapping)

        return messages
    else:
        messages = [Messages(**json.loads(raw)) for raw in messages_data.values()]
        messages.sort(key=lambda message: message.sequence)

        return messages
