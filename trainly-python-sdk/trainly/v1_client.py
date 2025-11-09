"""
Trainly V1 client for OAuth authentication (Trusted Issuer mode).
"""

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


class TrainlyV1Client:
    """
    Trainly V1 client for OAuth authentication (Trusted Issuer mode).

    This client is for user-facing applications where users authenticate
    with their own OAuth provider (Clerk, Auth0, Cognito, etc.) and get
    permanent private workspaces.

    Example:
        >>> from trainly import TrainlyV1Client
        >>>
        >>> # Get user's OAuth token from your auth provider
        >>> user_token = get_user_oauth_token()  # Your OAuth implementation
        >>>
        >>> client = TrainlyV1Client(
        ...     user_token=user_token,
        ...     app_id="app_your_app_id"
        ... )
        >>>
        >>> response = client.query([
        ...     {"role": "user", "content": "What is in my documents?"}
        ... ])
        >>> print(response.answer)
    """

    def __init__(
        self,
        user_token: str,
        app_id: str,
        base_url: str = "https://api.trainlyai.com",
        timeout: int = 30,
    ):
        """
        Initialize the Trainly V1 client.

        Args:
            user_token: OAuth ID token from your auth provider.
            app_id: Your app ID from Trainly console registration.
            base_url: Base URL for the Trainly API.
            timeout: Request timeout in seconds.
        """
        if not user_token:
            raise TrainlyError("User token is required for V1 authentication")

        if not app_id:
            raise TrainlyError("App ID is required for V1 authentication")

        self.user_token = user_token
        self.app_id = app_id
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.user_token}",
            "X-App-ID": self.app_id,
        })

        # Verify token and get user profile
        self._verify_connection()

    def _verify_connection(self) -> Dict[str, Any]:
        """Verify the OAuth token and get user profile."""
        url = f"{self.base_url}/v1/me/profile"

        try:
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            profile = response.json()

            print("✅ Connected to Trainly with V1 Trusted Issuer authentication")
            print(f"📋 User ID: {profile.get('user_id')}")
            print(f"💬 Chat ID: {profile.get('chat_id')}")
            print(f"🔒 OAuth Provider: {profile.get('issuer')}")

            return profile

        except requests.exceptions.HTTPError as e:
            self._handle_http_error(e)
        except requests.exceptions.RequestException as e:
            raise TrainlyError(f"V1 authentication failed: {str(e)}")

    def query(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        scope_filters: Optional[Dict[str, Any]] = None,
    ) -> QueryResponse:
        """
        Query the user's private knowledge base.

        Args:
            messages: List of message objects with 'role' and 'content' keys.
            model: The LLM model to use.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens in the response.
            scope_filters: Optional filters to narrow down the search scope.

        Returns:
            QueryResponse containing the answer and context.

        Example:
            >>> response = client.query(
            ...     messages=[
            ...         {"role": "user", "content": "What are my documents about?"}
            ...     ],
            ...     model="gpt-4o"
            ... )
            >>> print(response.answer)
        """
        url = f"{self.base_url}/v1/me/chats/query"

        params = {
            "messages": json.dumps(messages),
            "response_tokens": str(max_tokens),
            "model": model,
            "temperature": str(temperature),
        }

        if scope_filters:
            params["scope_filters"] = json.dumps(scope_filters)

        try:
            response = self.session.post(
                url,
                data=params,
                headers={
                    "Authorization": f"Bearer {self.user_token}",
                    "X-App-ID": self.app_id,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()

            # Parse context chunks
            context = []
            if "citations" in data:
                for chunk_data in data["citations"]:
                    context.append(ChunkScore(
                        chunk_text=chunk_data.get("snippet", ""),
                        score=chunk_data.get("score", 0.0),
                        source=chunk_data.get("source", ""),
                        page=chunk_data.get("page"),
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
            raise TrainlyError(f"V1 query failed: {str(e)}")

    def upload_file(
        self,
        file_path: str,
        scope_values: Optional[Dict[str, Any]] = None,
    ) -> UploadResult:
        """
        Upload a file to the user's private knowledge base.

        Args:
            file_path: Path to the file to upload.
            scope_values: Optional custom scope values for filtering.

        Returns:
            UploadResult with upload details.

        Example:
            >>> result = client.upload_file(
            ...     "./document.pdf",
            ...     scope_values={"playlist_id": "xyz123"}
            ... )
            >>> print(f"Uploaded: {result.filename}")
        """
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            raise TrainlyError(f"File not found: {file_path}")

        url = f"{self.base_url}/v1/me/chats/files/upload"

        try:
            with open(file_path, "rb") as f:
                files = {"file": (file_path_obj.name, f)}
                data = {}

                if scope_values:
                    data["scope_values"] = json.dumps(scope_values)

                headers = {
                    "Authorization": f"Bearer {self.user_token}",
                    "X-App-ID": self.app_id,
                }

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
                    message=result_data.get("message", "File uploaded to your permanent private subchat"),
                    processing_status=result_data.get("processing_status", "completed"),
                )

        except requests.exceptions.HTTPError as e:
            self._handle_http_error(e)
        except requests.exceptions.RequestException as e:
            raise TrainlyError(f"V1 upload failed: {str(e)}")
        except IOError as e:
            raise TrainlyError(f"File read error: {str(e)}")

    def upload_text(
        self,
        text: str,
        content_name: str,
        scope_values: Optional[Dict[str, Any]] = None,
    ) -> UploadResult:
        """
        Upload text content to the user's private knowledge base.

        Args:
            text: The text content to upload.
            content_name: A name for this content (e.g., "My Notes").
            scope_values: Optional custom scope values for filtering.

        Returns:
            UploadResult with upload details.

        Example:
            >>> result = client.upload_text(
            ...     text="Important notes about the project...",
            ...     content_name="Project Notes",
            ...     scope_values={"project_id": "proj_123"}
            ... )
        """
        url = f"{self.base_url}/v1/me/chats/files/upload"

        try:
            data = {
                "text_content": text,
                "content_name": content_name,
            }

            if scope_values:
                data["scope_values"] = json.dumps(scope_values)

            headers = {
                "Authorization": f"Bearer {self.user_token}",
                "X-App-ID": self.app_id,
            }

            response = requests.post(
                url,
                data=data,
                headers=headers,
                timeout=self.timeout,
            )
            response.raise_for_status()
            result_data = response.json()

            return UploadResult(
                success=result_data.get("success", True),
                filename=result_data.get("filename", content_name),
                file_id=result_data.get("file_id"),
                size_bytes=result_data.get("size_bytes", len(text)),
                message=result_data.get("message", "Text content uploaded to your permanent private subchat"),
                processing_status=result_data.get("processing_status", "completed"),
            )

        except requests.exceptions.HTTPError as e:
            self._handle_http_error(e)
        except requests.exceptions.RequestException as e:
            raise TrainlyError(f"V1 text upload failed: {str(e)}")

    def list_files(self) -> FileListResult:
        """
        List all files in the user's private knowledge base.

        Returns:
            FileListResult with list of files and metadata.

        Example:
            >>> files = client.list_files()
            >>> print(f"Total files: {files.total_files}")
            >>> for file in files.files:
            ...     print(f"{file.filename}: {file.size_bytes} bytes")
        """
        url = f"{self.base_url}/v1/me/chats/files"

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
            raise TrainlyError(f"V1 list files failed: {str(e)}")

    def delete_file(self, file_id: str) -> FileDeleteResult:
        """
        Delete a file from the user's private knowledge base.

        Args:
            file_id: The ID of the file to delete.

        Returns:
            FileDeleteResult with deletion details.

        Example:
            >>> result = client.delete_file("file_xyz_123")
            >>> print(f"Deleted {result.filename}, freed {result.size_bytes_freed} bytes")
        """
        if not file_id:
            raise TrainlyError("File ID is required")

        url = f"{self.base_url}/v1/me/chats/files/{file_id}"

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
            raise TrainlyError(f"V1 delete file failed: {str(e)}")

    def bulk_upload_files(
        self,
        file_paths: List[str],
        scope_values: Optional[Dict[str, Any]] = None,
    ) -> BulkUploadResult:
        """
        Upload multiple files at once (up to 10 files).

        Args:
            file_paths: List of file paths to upload.
            scope_values: Optional custom scope values for all files.

        Returns:
            BulkUploadResult with individual file results.

        Example:
            >>> result = client.bulk_upload_files([
            ...     "./doc1.pdf",
            ...     "./doc2.txt",
            ...     "./doc3.docx"
            ... ])
            >>> print(f"Uploaded {result.successful_uploads}/{result.total_files} files")
        """
        if not file_paths or len(file_paths) == 0:
            raise TrainlyError("No files provided for bulk upload")

        if len(file_paths) > 10:
            raise TrainlyError("Too many files. Maximum 10 files per bulk upload.")

        url = f"{self.base_url}/v1/me/chats/files/upload-bulk"

        try:
            files = []
            for file_path in file_paths:
                file_path_obj = Path(file_path)
                if not file_path_obj.exists():
                    raise TrainlyError(f"File not found: {file_path}")
                files.append(("files", (file_path_obj.name, open(file_path, "rb"))))

            data = {}
            if scope_values:
                data["scope_values"] = json.dumps(scope_values)

            headers = {
                "Authorization": f"Bearer {self.user_token}",
                "X-App-ID": self.app_id,
            }

            response = requests.post(
                url,
                files=files,
                data=data,
                headers=headers,
                timeout=self.timeout,
            )
            response.raise_for_status()
            result_data = response.json()

            # Parse individual file results
            results = []
            for file_result in result_data.get("results", []):
                results.append(BulkUploadFileResult(
                    filename=file_result["filename"],
                    success=file_result["success"],
                    error=file_result.get("error"),
                    file_id=file_result.get("file_id"),
                    size_bytes=file_result["size_bytes"],
                    processing_status=file_result["processing_status"],
                    message=file_result.get("message"),
                ))

            return BulkUploadResult(
                success=result_data.get("success", True),
                total_files=result_data["total_files"],
                successful_uploads=result_data["successful_uploads"],
                failed_uploads=result_data["failed_uploads"],
                total_size_bytes=result_data["total_size_bytes"],
                chat_id=result_data["chat_id"],
                user_id=result_data["user_id"],
                results=results,
                message=result_data["message"],
            )

        except requests.exceptions.HTTPError as e:
            self._handle_http_error(e)
        except requests.exceptions.RequestException as e:
            raise TrainlyError(f"V1 bulk upload failed: {str(e)}")
        finally:
            # Close all opened files
            for _, file_tuple in files:
                if hasattr(file_tuple[1], 'close'):
                    file_tuple[1].close()

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

