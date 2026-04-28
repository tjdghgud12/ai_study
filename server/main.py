from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import router
from core.config import settings

app = FastAPI()


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
