"""
Type definitions and response models for Trainly SDK
"""

from typing import List, Optional, Dict, Any, Union
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ChunkScore:
    """Represents a chunk of text from the knowledge base with relevance score."""

    chunk_text: str
    score: float
    source: str
    page: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class Usage:
    """Token usage information for the query."""

    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


@dataclass
class QueryResponse:
    """Response from a query to the knowledge base."""

    answer: str
    context: List[ChunkScore]
    usage: Optional[Usage] = None
    model: Optional[str] = None

    def __str__(self) -> str:
        return f"QueryResponse(answer='{self.answer[:100]}...', context={len(self.context)} chunks)"


@dataclass
class UploadResult:
    """Result of uploading a file to the knowledge base."""

    success: bool
    filename: str
    file_id: Optional[str] = None
    size_bytes: int = 0
    message: Optional[str] = None
    processing_status: Optional[str] = None


@dataclass
class FileInfo:
    """Information about a file in the knowledge base."""

    file_id: str
    filename: str
    upload_date: str  # Unix timestamp as string
    size_bytes: int
    chunk_count: int

    @property
    def upload_datetime(self) -> datetime:
        """Convert upload_date timestamp to datetime object."""
        return datetime.fromtimestamp(int(self.upload_date) / 1000)


@dataclass
class FileListResult:
    """Result of listing files in the knowledge base."""

    success: bool
    files: List[FileInfo]
    total_files: int
    total_size_bytes: int


@dataclass
class FileDeleteResult:
    """Result of deleting a file from the knowledge base."""

    success: bool
    message: str
    file_id: str
    filename: str
    chunks_deleted: int
    size_bytes_freed: int


@dataclass
class BulkUploadFileResult:
    """Result of a single file in a bulk upload operation."""

    filename: str
    success: bool
    error: Optional[str]
    file_id: Optional[str]
    size_bytes: int
    processing_status: str
    message: Optional[str] = None


@dataclass
class BulkUploadResult:
    """Result of a bulk upload operation."""

    success: bool
    total_files: int
    successful_uploads: int
    failed_uploads: int
    total_size_bytes: int
    chat_id: str
    user_id: str
    results: List[BulkUploadFileResult]
    message: str


@dataclass
class StreamChunk:
    """A chunk of data from a streaming response."""

    type: str  # 'content', 'context', 'end', 'error'
    data: Union[str, List[ChunkScore], None]

    @property
    def is_content(self) -> bool:
        """Check if this is a content chunk."""
        return self.type == "content"

    @property
    def is_context(self) -> bool:
        """Check if this is a context chunk."""
        return self.type == "context"

    @property
    def is_end(self) -> bool:
        """Check if this is the end of the stream."""
        return self.type == "end"

    @property
    def is_error(self) -> bool:
        """Check if this is an error chunk."""
        return self.type == "error"


class TrainlyError(Exception):
    """Base exception for Trainly SDK errors."""

    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details or {}

    def __str__(self) -> str:
        if self.status_code:
            return f"TrainlyError ({self.status_code}): {super().__str__()}"
        return f"TrainlyError: {super().__str__()}"

