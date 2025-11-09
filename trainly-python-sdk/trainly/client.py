"""
Main Trainly client for simple API key authentication.
"""

import os
import json
from typing import Optional, Dict, Any, List, Iterator
from pathlib import Path
import requests

from .models import (
    QueryResponse,
    ChunkScore,
    Usage,
    UploadResult,
    FileListResult,
    FileDeleteResult,
    BulkUploadResult,
    BulkUploadFileResult,
    FileInfo,
    TrainlyError,
    StreamChunk,
)


class TrainlyClient:
    """
    Trainly client for simple API key authentication.

    This client is for straightforward use cases where you have a Trainly API key
    and want to query a specific chat or upload files.

    Example:
        >>> from trainly import TrainlyClient
        >>> client = TrainlyClient(
        ...     api_key="tk_your_api_key",
        ...     chat_id="chat_abc123"
        ... )
        >>> response = client.query("What are the main findings?")
        >>> print(response.answer)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        chat_id: Optional[str] = None,
        base_url: str = "https://api.trainlyai.com",
        timeout: int = 30,
        max_retries: int = 3,
    ):
        """
        Initialize the Trainly client.

        Args:
            api_key: Trainly API key (starts with 'tk_'). Can also be set via TRAINLY_API_KEY env var.
            chat_id: Chat ID to query. Can also be set via TRAINLY_CHAT_ID env var.
            base_url: Base URL for the Trainly API.
            timeout: Request timeout in seconds.
            max_retries: Maximum number of retries for failed requests.
        """
        self.api_key = api_key or os.getenv("TRAINLY_API_KEY")
        self.chat_id = chat_id or os.getenv("TRAINLY_CHAT_ID")
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

        if not self.api_key:
            raise TrainlyError("API key is required. Provide it via api_key parameter or TRAINLY_API_KEY environment variable.")

        if not self.chat_id:
            raise TrainlyError("Chat ID is required. Provide it via chat_id parameter or TRAINLY_CHAT_ID environment variable.")

        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        })

    def query(
        self,
        question: str,
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        include_context: bool = True,
        scope_filters: Optional[Dict[str, Any]] = None,
    ) -> QueryResponse:
        """
        Query the knowledge base with a question.

        Args:
            question: The question to ask.
            model: The LLM model to use (e.g., 'gpt-4o', 'gpt-4o-mini').
            temperature: Sampling temperature (0.0 to 1.0).
            max_tokens: Maximum tokens in the response.
            include_context: Whether to include context chunks in the response.
            scope_filters: Optional filters to narrow down the search scope.

        Returns:
            QueryResponse containing the answer and context.

        Example:
            >>> response = client.query(
            ...     question="What is the conclusion?",
            ...     model="gpt-4o",
            ...     temperature=0.5
            ... )
            >>> print(response.answer)
            >>> for chunk in response.context:
            ...     print(f"Score: {chunk.score}, Text: {chunk.chunk_text[:100]}")
        """
        url = f"{self.base_url}/v1/{self.chat_id}/answer_question"

        payload = {
            "question": question,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if scope_filters:
            payload["scope_filters"] = scope_filters

        try:
            response = self.session.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()

            # Parse context chunks
            context = []
            if include_context and "context" in data:
                for chunk_data in data["context"]:
                    context.append(ChunkScore(
                        chunk_text=chunk_data.get("chunk_text", ""),
                        score=chunk_data.get("score", 0.0),
                        source=chunk_data.get("source", ""),
                        page=chunk_data.get("page"),
                        metadata=chunk_data.get("metadata"),
                    ))

            # Parse usage if available
            usage = None
            if "usage" in data:
                usage_data = data["usage"]
                usage = Usage(
                    prompt_tokens=usage_data.get("prompt_tokens", 0),
                    completion_tokens=usage_data.get("completion_tokens", 0),
                    total_tokens=usage_data.get("total_tokens", 0),
                )

            return QueryResponse(
                answer=data.get("answer", ""),
                context=context,
                usage=usage,
                model=data.get("model"),
            )

        except requests.exceptions.HTTPError as e:
            self._handle_http_error(e)
        except requests.exceptions.RequestException as e:
            raise TrainlyError(f"Request failed: {str(e)}")

    def query_stream(
        self,
        question: str,
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        scope_filters: Optional[Dict[str, Any]] = None,
    ) -> Iterator[StreamChunk]:
        """
        Query the knowledge base with streaming response.

        Args:
            question: The question to ask.
            model: The LLM model to use.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens in the response.
            scope_filters: Optional filters to narrow down the search scope.

        Yields:
            StreamChunk objects containing content, context, or end markers.

        Example:
            >>> for chunk in client.query_stream("Explain the methodology"):
            ...     if chunk.is_content:
            ...         print(chunk.data, end="", flush=True)
            ...     elif chunk.is_end:
            ...         print("\\nStream complete!")
        """
        url = f"{self.base_url}/v1/{self.chat_id}/answer_question_stream"

        payload = {
            "question": question,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if scope_filters:
            payload["scope_filters"] = scope_filters

        try:
            response = self.session.post(url, json=payload, stream=True, timeout=self.timeout)
            response.raise_for_status()

            for line in response.iter_lines():
                if line:
                    line_str = line.decode("utf-8")
                    if line_str.startswith("data: "):
                        data_str = line_str[6:]
                        if data_str == "[DONE]":
                            yield StreamChunk(type="end", data=None)
                            break

                        try:
                            data = json.loads(data_str)
                            chunk_type = data.get("type", "content")

                            if chunk_type == "content":
                                yield StreamChunk(type="content", data=data.get("data", ""))
                            elif chunk_type == "context":
                                context = []
                                for chunk_data in data.get("data", []):
                                    context.append(ChunkScore(
                                        chunk_text=chunk_data.get("chunk_text", ""),
                                        score=chunk_data.get("score", 0.0),
                                        source=chunk_data.get("source", ""),
                                        page=chunk_data.get("page"),
                                    ))
                                yield StreamChunk(type="context", data=context)
                            elif chunk_type == "error":
                                yield StreamChunk(type="error", data=data.get("data", ""))
                        except json.JSONDecodeError:
                            continue

        except requests.exceptions.HTTPError as e:
            self._handle_http_error(e)
        except requests.exceptions.RequestException as e:
            raise TrainlyError(f"Streaming request failed: {str(e)}")

    def upload_file(
        self,
        file_path: str,
        scope_values: Optional[Dict[str, Any]] = None,
    ) -> UploadResult:
        """
        Upload a file to the knowledge base.

        Args:
            file_path: Path to the file to upload.
            scope_values: Optional custom scope values for filtering (e.g., {"playlist_id": "123"}).

        Returns:
            UploadResult with upload details.

        Example:
            >>> result = client.upload_file(
            ...     "./research_paper.pdf",
            ...     scope_values={"project_id": "proj_123"}
            ... )
            >>> print(f"Uploaded: {result.filename}")
        """
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            raise TrainlyError(f"File not found: {file_path}")

        url = f"{self.base_url}/v1/{self.chat_id}/upload_file"

        try:
            with open(file_path, "rb") as f:
                files = {"file": (file_path_obj.name, f)}
                data = {}

                if scope_values:
                    data["scope_values"] = json.dumps(scope_values)

                # Remove Content-Type header for multipart/form-data
                headers = {"Authorization": f"Bearer {self.api_key}"}

                response = requests.post(
                    url,
                    files=files,
                    data=data,
                    headers=headers,
                    timeout=self.timeout,
                )
                response.raise_for_status()
                result_data = response.json()

                return UploadResult(
                    success=result_data.get("success", True),
                    filename=result_data.get("filename", file_path_obj.name),
                    file_id=result_data.get("file_id"),
                    size_bytes=result_data.get("size_bytes", file_path_obj.stat().st_size),
                    message=result_data.get("message", "File uploaded successfully"),
                    processing_status=result_data.get("processing_status", "completed"),
                )

        except requests.exceptions.HTTPError as e:
            self._handle_http_error(e)
        except requests.exceptions.RequestException as e:
            raise TrainlyError(f"Upload failed: {str(e)}")
        except IOError as e:
            raise TrainlyError(f"File read error: {str(e)}")

    def list_files(self) -> FileListResult:
        """
        List all files in the knowledge base.

        Returns:
            FileListResult with list of files and metadata.

        Example:
            >>> files = client.list_files()
            >>> print(f"Total files: {files.total_files}")
            >>> for file in files.files:
            ...     print(f"{file.filename}: {file.size_bytes} bytes")
        """
        url = f"{self.base_url}/v1/{self.chat_id}/files"

        try:
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()

            files = []
            for file_data in data.get("files", []):
                files.append(FileInfo(
                    file_id=file_data["file_id"],
                    filename=file_data["filename"],
                    upload_date=file_data["upload_date"],
                    size_bytes=file_data["size_bytes"],
                    chunk_count=file_data["chunk_count"],
                ))

            return FileListResult(
                success=data.get("success", True),
                files=files,
                total_files=data.get("total_files", len(files)),
                total_size_bytes=data.get("total_size_bytes", 0),
            )

        except requests.exceptions.HTTPError as e:
            self._handle_http_error(e)
        except requests.exceptions.RequestException as e:
            raise TrainlyError(f"List files failed: {str(e)}")

    def delete_file(self, file_id: str) -> FileDeleteResult:
        """
        Delete a file from the knowledge base.

        Args:
            file_id: The ID of the file to delete.

        Returns:
            FileDeleteResult with deletion details.

        Example:
            >>> result = client.delete_file("v1_user_xyz_document.pdf_1609459200")
            >>> print(f"Deleted {result.filename}")
            >>> print(f"Freed {result.size_bytes_freed} bytes")
        """
        if not file_id:
            raise TrainlyError("File ID is required")

        url = f"{self.base_url}/v1/{self.chat_id}/files/{file_id}"

        try:
            response = self.session.delete(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()

            return FileDeleteResult(
                success=data.get("success", True),
                message=data.get("message", "File deleted successfully"),
                file_id=data.get("file_id", file_id),
                filename=data.get("filename", ""),
                chunks_deleted=data.get("chunks_deleted", 0),
                size_bytes_freed=data.get("size_bytes_freed", 0),
            )

        except requests.exceptions.HTTPError as e:
            self._handle_http_error(e)
        except requests.exceptions.RequestException as e:
            raise TrainlyError(f"Delete file failed: {str(e)}")

    def _handle_http_error(self, error: requests.exceptions.HTTPError) -> None:
        """Handle HTTP errors and raise appropriate TrainlyError."""
        status_code = error.response.status_code

        try:
            error_data = error.response.json()
            message = error_data.get("detail", str(error))
            details = error_data
        except (json.JSONDecodeError, AttributeError):
            message = str(error)
            details = {}

        raise TrainlyError(message, status_code=status_code, details=details)

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.session.close()

    def close(self):
        """Close the HTTP session."""
        self.session.close()

