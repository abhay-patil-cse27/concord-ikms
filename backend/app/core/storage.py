"""Storage Provider Interface & Implementations."""
import os
import shutil
from abc import ABC, abstractmethod
from typing import BinaryIO


class BaseStorageProvider(ABC):
    """Abstract base class defining the contract for object/file storage."""

    @abstractmethod
    async def save_file(self, file_obj: BinaryIO, destination_path: str) -> str:
        """Saves a binary file stream and returns the stored relative path."""
        pass

    @abstractmethod
    async def read_file(self, file_path: str) -> bytes:
        """Reads file bytes from storage."""
        pass

    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """Deletes a file from storage."""
        pass

    @abstractmethod
    async def file_exists(self, file_path: str) -> bool:
        """Checks if a file exists in storage."""
        pass


class LocalStorageProvider(BaseStorageProvider):
    """Local filesystem storage provider for development and standalone deployments."""

    def __init__(self, base_directory: str = "storage/documents"):
        self.base_directory = base_directory
        os.makedirs(self.base_directory, exist_ok=True)

    def _resolve_path(self, relative_path: str) -> str:
        # Prevent directory traversal attacks
        clean_rel = os.path.normpath(relative_path).lstrip(os.sep).lstrip("/")
        return os.path.join(self.base_directory, clean_rel)

    async def save_file(self, file_obj: BinaryIO, destination_path: str) -> str:
        full_path = self._resolve_path(destination_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        file_obj.seek(0)
        with open(full_path, "wb") as f_out:
            shutil.copyfileobj(file_obj, f_out)
            
        return destination_path

    async def read_file(self, file_path: str) -> bytes:
        full_path = self._resolve_path(file_path)
        if not os.path.isfile(full_path):
            raise FileNotFoundError(f"Stored file not found: {file_path}")
        with open(full_path, "rb") as f_in:
            return f_in.read()

    async def delete_file(self, file_path: str) -> bool:
        full_path = self._resolve_path(file_path)
        if os.path.isfile(full_path):
            os.remove(full_path)
            return True
        return False

    async def file_exists(self, file_path: str) -> bool:
        full_path = self._resolve_path(file_path)
        return os.path.isfile(full_path)


# Default singleton instance
storage_provider = LocalStorageProvider()
