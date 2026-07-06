import redis.asyncio as redis

from core.config import settings

redis_client: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    return redis_client


async def init_redis():
    global redis_client
    redis_client = redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)


async def close_redis():
    if redis_client:
        await redis_client.aclose()
