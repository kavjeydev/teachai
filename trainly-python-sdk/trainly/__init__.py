"""
Trainly Python SDK

Dead simple RAG integration for Python applications with V1 OAuth Authentication.
"""

from .client import TrainlyClient
from .v1_client import TrainlyV1Client
from .models import (
    QueryResponse,
    ChunkScore,
    Usage,
    UploadResult,
    FileInfo,
    FileListResult,
    FileDeleteResult,
    BulkUploadResult,
    BulkUploadFileResult,
    TrainlyError,
    StreamChunk,
)

__version__ = "0.1.0"
__all__ = [
    "TrainlyClient",
    "TrainlyV1Client",
    "QueryResponse",
    "ChunkScore",
    "Usage",
    "UploadResult",
    "FileInfo",
    "FileListResult",
    "FileDeleteResult",
    "BulkUploadResult",
    "BulkUploadFileResult",
    "TrainlyError",
    "StreamChunk",
]

