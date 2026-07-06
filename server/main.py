import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import router
from core.config import settings
from db.redis import close_redis, init_redis
from services.chat_service import cat_agent

logging.getLogger("langchain_google_genai").setLevel(logging.ERROR)

app = FastAPI()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        await init_redis()
        await cat_agent.create_cat_agent()
        print(f"✅ Successfully Created {settings.project_name}")
        yield
        await close_redis()
    except Exception as e:
        print(f"❌ Error creating {settings.project_name}: {e}")


app = FastAPI(lifespan=lifespan)

origins = [
    url
    for url in [
        settings.dev_frontend_url,
        # os.getenv("FRONTEND_URL"),
    ]
    if url is not None
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
