import hashlib
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings


class LocalDocumentStorage:
    def __init__(self) -> None:
        self.base_path = Path(settings.local_storage_path)

    async def save(
        self,
        *,
        upload: UploadFile,
        organization_id: str,
        project_id: str,
        knowledge_base_id: str,
        extension: str,
    ) -> tuple[str, str, int, str]:
        directory = (
            self.base_path
            / organization_id
            / project_id
            / knowledge_base_id
        )

        directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        stored_filename = f"{uuid4()}{extension}"
        file_path = directory / stored_filename

        sha256 = hashlib.sha256()
        file_size = 0

        with file_path.open("wb") as destination:
            while chunk := await upload.read(1024 * 1024):
                destination.write(chunk)
                sha256.update(chunk)
                file_size += len(chunk)

        await upload.seek(0)

        return (
            stored_filename,
            str(file_path),
            file_size,
            sha256.hexdigest(),
        )

    def delete(self, storage_path: str) -> None:
        file_path = Path(storage_path)

        if file_path.exists():
            file_path.unlink()