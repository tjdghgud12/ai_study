import uuid
from pathlib import Path
from typing import TypedDict

from fastapi import UploadFile

STORAGE_ROOT = Path(__file__).resolve().parent.parent / "storage" / "uploads"

_MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


class SavedImage(TypedDict):
    path: str
    mime_type: str
    original_filename: str | None


class AttachmentInfo(TypedDict):
    url: str
    mime_type: str
    original_filename: str | None


def _guess_mime(file: UploadFile) -> str:
    if file.content_type and file.content_type.startswith("image/"):
        return file.content_type

    name = (file.filename or "").lower()
    if name.endswith(".png"):
        return "image/png"
    if name.endswith(".webp"):
        return "image/webp"
    if name.endswith(".gif"):
        return "image/gif"
    return "image/jpeg"


def _extension_for(mime_type: str, filename: str | None) -> str:
    if mime_type in _MIME_TO_EXT:
        return _MIME_TO_EXT[mime_type]

    if filename and "." in filename:
        return "." + filename.rsplit(".", 1)[-1].lower()

    return ".jpg"


async def save_chat_images(
    files: list[UploadFile] | None,
    *,
    user_id: str,
    session_id: str,
) -> list[SavedImage]:
    """Save uploaded chat images under storage/uploads and return relative paths."""
    if not files:
        return []

    saved: list[SavedImage] = []
    dest_dir = STORAGE_ROOT / user_id / session_id
    dest_dir.mkdir(parents=True, exist_ok=True)

    for file in files:
        mime_type = _guess_mime(file)
        ext = _extension_for(mime_type, file.filename)
        filename = f"{uuid.uuid4().hex}{ext}"
        absolute_path = dest_dir / filename

        data = await file.read()
        if not data:
            continue

        absolute_path.write_bytes(data)
        await file.seek(0)

        relative_path = absolute_path.relative_to(STORAGE_ROOT).as_posix()
        saved.append(
            {
                "path": relative_path,
                "mime_type": mime_type,
                "original_filename": file.filename,
            }
        )

    return saved


def resolve_image_path(relative_path: str) -> Path:
    """Resolve a DB-stored relative path to an absolute file path."""
    return STORAGE_ROOT / relative_path


def resolve_image_url(relative_path: str) -> str:
    return f"/attachments/{relative_path}"


def to_attachment_info(saved: SavedImage | dict) -> AttachmentInfo:
    return {
        "url": resolve_image_url(saved["path"]),
        "mime_type": saved["mime_type"],
        "original_filename": saved.get("original_filename"),
    }
