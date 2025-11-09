"""
Basic tests for TrainlyClient
"""

import pytest
from trainly import TrainlyClient, TrainlyError
from trainly.models import QueryResponse, ChunkScore


def test_client_initialization():
    """Test client initialization with API key and chat ID."""
    client = TrainlyClient(
        api_key="tk_test_key",
        chat_id="chat_test_123"
    )

    assert client.api_key == "tk_test_key"
    assert client.chat_id == "chat_test_123"
    assert client.base_url == "https://api.trainly.com"


def test_client_initialization_missing_api_key():
    """Test that initialization fails without API key."""
    with pytest.raises(TrainlyError) as exc_info:
        TrainlyClient(chat_id="chat_test_123")

    assert "API key is required" in str(exc_info.value)


def test_client_initialization_missing_chat_id():
    """Test that initialization fails without chat ID."""
    with pytest.raises(TrainlyError) as exc_info:
        TrainlyClient(api_key="tk_test_key")

    assert "Chat ID is required" in str(exc_info.value)


def test_client_context_manager():
    """Test that client works as context manager."""
    with TrainlyClient(
        api_key="tk_test_key",
        chat_id="chat_test_123"
    ) as client:
        assert client is not None
        assert hasattr(client, 'session')


def test_chunk_score_model():
    """Test ChunkScore model."""
    chunk = ChunkScore(
        chunk_text="This is a test chunk",
        score=0.95,
        source="test.pdf",
        page=1
    )

    assert chunk.chunk_text == "This is a test chunk"
    assert chunk.score == 0.95
    assert chunk.source == "test.pdf"
    assert chunk.page == 1


def test_query_response_model():
    """Test QueryResponse model."""
    chunks = [
        ChunkScore(
            chunk_text="Chunk 1",
            score=0.95,
            source="doc1.pdf"
        ),
        ChunkScore(
            chunk_text="Chunk 2",
            score=0.85,
            source="doc2.pdf"
        )
    ]

    response = QueryResponse(
        answer="This is the answer",
        context=chunks
    )

    assert response.answer == "This is the answer"
    assert len(response.context) == 2
    assert response.context[0].score == 0.95


def test_trainly_error():
    """Test TrainlyError exception."""
    error = TrainlyError(
        "Test error",
        status_code=400,
        details={"key": "value"}
    )

    assert "Test error" in str(error)
    assert error.status_code == 400
    assert error.details["key"] == "value"


def test_trainly_error_with_status_code():
    """Test TrainlyError with status code formatting."""
    error = TrainlyError("Test error", status_code=404)
    error_str = str(error)

    assert "404" in error_str
    assert "Test error" in error_str


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

