"""
Tests for data models
"""

import pytest
from datetime import datetime
from trainly.models import (
    ChunkScore,
    Usage,
    QueryResponse,
    UploadResult,
    FileInfo,
    FileListResult,
    FileDeleteResult,
    StreamChunk,
)


def test_chunk_score():
    """Test ChunkScore dataclass."""
    chunk = ChunkScore(
        chunk_text="Sample text",
        score=0.92,
        source="document.pdf",
        page=5,
        metadata={"category": "research"}
    )

    assert chunk.chunk_text == "Sample text"
    assert chunk.score == 0.92
    assert chunk.source == "document.pdf"
    assert chunk.page == 5
    assert chunk.metadata["category"] == "research"


def test_usage():
    """Test Usage dataclass."""
    usage = Usage(
        prompt_tokens=100,
        completion_tokens=50,
        total_tokens=150
    )

    assert usage.prompt_tokens == 100
    assert usage.completion_tokens == 50
    assert usage.total_tokens == 150


def test_query_response():
    """Test QueryResponse dataclass."""
    context = [
        ChunkScore(chunk_text="Text 1", score=0.9, source="doc1.pdf"),
        ChunkScore(chunk_text="Text 2", score=0.8, source="doc2.pdf"),
    ]

    usage = Usage(prompt_tokens=50, completion_tokens=25, total_tokens=75)

    response = QueryResponse(
        answer="This is the answer",
        context=context,
        usage=usage,
        model="gpt-4o"
    )

    assert response.answer == "This is the answer"
    assert len(response.context) == 2
    assert response.usage.total_tokens == 75
    assert response.model == "gpt-4o"
    assert "QueryResponse" in str(response)


def test_upload_result():
    """Test UploadResult dataclass."""
    result = UploadResult(
        success=True,
        filename="test.pdf",
        file_id="file_123",
        size_bytes=1024,
        message="Upload successful",
        processing_status="completed"
    )

    assert result.success is True
    assert result.filename == "test.pdf"
    assert result.file_id == "file_123"
    assert result.size_bytes == 1024
    assert result.processing_status == "completed"


def test_file_info():
    """Test FileInfo dataclass."""
    timestamp = str(int(datetime.now().timestamp() * 1000))

    file_info = FileInfo(
        file_id="file_abc",
        filename="document.pdf",
        upload_date=timestamp,
        size_bytes=2048,
        chunk_count=5
    )

    assert file_info.file_id == "file_abc"
    assert file_info.filename == "document.pdf"
    assert file_info.size_bytes == 2048
    assert file_info.chunk_count == 5
    assert isinstance(file_info.upload_datetime, datetime)


def test_file_list_result():
    """Test FileListResult dataclass."""
    files = [
        FileInfo(
            file_id="file_1",
            filename="doc1.pdf",
            upload_date="1609459200000",
            size_bytes=1024,
            chunk_count=3
        ),
        FileInfo(
            file_id="file_2",
            filename="doc2.pdf",
            upload_date="1609459200000",
            size_bytes=2048,
            chunk_count=5
        ),
    ]

    result = FileListResult(
        success=True,
        files=files,
        total_files=2,
        total_size_bytes=3072
    )

    assert result.success is True
    assert len(result.files) == 2
    assert result.total_files == 2
    assert result.total_size_bytes == 3072


def test_file_delete_result():
    """Test FileDeleteResult dataclass."""
    result = FileDeleteResult(
        success=True,
        message="File deleted successfully",
        file_id="file_xyz",
        filename="old_doc.pdf",
        chunks_deleted=10,
        size_bytes_freed=5120
    )

    assert result.success is True
    assert result.file_id == "file_xyz"
    assert result.filename == "old_doc.pdf"
    assert result.chunks_deleted == 10
    assert result.size_bytes_freed == 5120


def test_stream_chunk():
    """Test StreamChunk dataclass."""
    # Test content chunk
    content_chunk = StreamChunk(type="content", data="Hello world")
    assert content_chunk.is_content is True
    assert content_chunk.is_context is False
    assert content_chunk.is_end is False
    assert content_chunk.is_error is False
    assert content_chunk.data == "Hello world"

    # Test context chunk
    context_data = [ChunkScore(chunk_text="Text", score=0.9, source="doc.pdf")]
    context_chunk = StreamChunk(type="context", data=context_data)
    assert context_chunk.is_content is False
    assert context_chunk.is_context is True

    # Test end chunk
    end_chunk = StreamChunk(type="end", data=None)
    assert end_chunk.is_end is True

    # Test error chunk
    error_chunk = StreamChunk(type="error", data="Error message")
    assert error_chunk.is_error is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

