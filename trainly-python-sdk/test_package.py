#!/usr/bin/env python3
"""
Practical test script for Trainly Python SDK package.
Run this script to verify the package works correctly.

Usage:
    python test_package.py

Make sure to set TRAINLY_API_KEY and TRAINLY_CHAT_ID environment variables,
or modify the script to include your credentials.
"""

import os
import sys
import tempfile
from pathlib import Path

# Add the package to path if needed
sys.path.insert(0, str(Path(__file__).parent))

from trainly import TrainlyClient, TrainlyError
from trainly.models import (
    QueryResponse,
    UploadResult,
    FileListResult,
    FileDeleteResult,
    StreamChunk,
)


class Colors:
    """ANSI color codes for terminal output."""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_test(name: str):
    """Print test header."""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}Test: {name}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")


def print_success(message: str):
    """Print success message."""
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")


def print_error(message: str):
    """Print error message."""
    print(f"{Colors.RED}✗ {message}{Colors.RESET}")


def print_info(message: str):
    """Print info message."""
    print(f"{Colors.YELLOW}ℹ {message}{Colors.RESET}")


def test_initialization():
    """Test 1: Client Initialization"""
    print_test("Client Initialization")

    try:
        api_key = os.getenv("TRAINLY_API_KEY")
        chat_id = os.getenv("TRAINLY_CHAT_ID")

        if not api_key or not chat_id:
            print_error("TRAINLY_API_KEY and TRAINLY_CHAT_ID must be set")
            return False

        client = TrainlyClient(api_key=api_key, chat_id=chat_id)
        print_success(f"Client initialized with chat_id: {client.chat_id}")
        print_success(f"Base URL: {client.base_url}")
        print_success(f"Timeout: {client.timeout}s")
        return True, client
    except Exception as e:
        print_error(f"Initialization failed: {e}")
        return False, None


def test_basic_query(client: TrainlyClient):
    """Test 2: Basic Query"""
    print_test("Basic Query")

    try:
        response = client.query("What is the main topic?")

        assert isinstance(response, QueryResponse), "Response should be QueryResponse"
        assert hasattr(response, 'answer'), "Response should have answer"
        assert isinstance(response.answer, str), "Answer should be a string"
        assert len(response.answer) > 0, "Answer should not be empty"

        print_success(f"Query successful")
        print_info(f"Answer length: {len(response.answer)} characters")
        print_info(f"Context chunks: {len(response.context)}")

        if response.usage:
            print_info(f"Token usage: {response.usage.total_tokens} total tokens")

        return True
    except Exception as e:
        print_error(f"Query failed: {e}")
        return False


def test_query_with_parameters(client: TrainlyClient):
    """Test 3: Query with Custom Parameters"""
    print_test("Query with Custom Parameters")

    try:
        response = client.query(
            question="Explain the key concepts",
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=500,
            include_context=True
        )

        assert isinstance(response, QueryResponse), "Response should be QueryResponse"
        print_success("Query with parameters successful")
        print_info(f"Model: {response.model or 'default'}")
        print_info(f"Answer preview: {response.answer[:100]}...")

        return True
    except Exception as e:
        print_error(f"Query with parameters failed: {e}")
        return False


def test_query_without_context(client: TrainlyClient):
    """Test 4: Query without Context"""
    print_test("Query without Context")

    try:
        response = client.query(
            question="What are the findings?",
            include_context=False
        )

        assert isinstance(response, QueryResponse), "Response should be QueryResponse"
        print_success("Query without context successful")
        print_info(f"Context chunks returned: {len(response.context)}")

        return True
    except Exception as e:
        print_error(f"Query without context failed: {e}")
        return False


def test_streaming_query(client: TrainlyClient):
    """Test 5: Streaming Query"""
    print_test("Streaming Query")

    try:
        chunks = []
        content_parts = []

        for chunk in client.query_stream("Explain the methodology"):
            chunks.append(chunk)
            if chunk.is_content:
                content_parts.append(chunk.data)
            elif chunk.is_end:
                print_info("Received end marker")

        assert len(chunks) > 0, "Should receive at least one chunk"
        assert any(chunk.is_end for chunk in chunks), "Should receive end marker"

        full_content = "".join(content_parts)
        assert len(full_content) > 0, "Should receive content"

        print_success(f"Streaming query successful")
        print_info(f"Total chunks received: {len(chunks)}")
        print_info(f"Content length: {len(full_content)} characters")

        return True
    except Exception as e:
        print_error(f"Streaming query failed: {e}")
        return False


def test_file_upload(client: TrainlyClient):
    """Test 6: File Upload"""
    print_test("File Upload")

    try:
        # Create a temporary test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("This is a test document for Trainly SDK testing.\n")
            f.write("It contains multiple lines of text.\n")
            f.write("The content should be searchable after upload.")
            temp_path = f.name

        try:
            result = client.upload_file(temp_path)

            assert isinstance(result, UploadResult), "Result should be UploadResult"
            assert result.success is True, "Upload should be successful"
            assert result.file_id is not None, "File ID should be returned"
            assert result.size_bytes > 0, "File size should be greater than 0"

            print_success(f"File uploaded successfully")
            print_info(f"Filename: {result.filename}")
            print_info(f"File ID: {result.file_id}")
            print_info(f"Size: {result.size_bytes} bytes")
            print_info(f"Status: {result.processing_status}")

            return True, result.file_id
        finally:
            # Clean up temp file
            os.unlink(temp_path)
    except Exception as e:
        print_error(f"File upload failed: {e}")
        return False, None


def test_file_upload_with_scope(client: TrainlyClient):
    """Test 7: File Upload with Scope Values"""
    print_test("File Upload with Scope Values")

    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("Test document with scope values")
            temp_path = f.name

        try:
            result = client.upload_file(
                temp_path,
                scope_values={
                    "test_category": "sdk_testing",
                    "test_id": "test_123"
                }
            )

            assert result.success is True, "Upload should be successful"
            print_success("File uploaded with scope values")
            return True, result.file_id
        finally:
            os.unlink(temp_path)
    except Exception as e:
        print_error(f"File upload with scope failed: {e}")
        return False, None


def test_list_files(client: TrainlyClient):
    """Test 8: List Files"""
    print_test("List Files")

    try:
        result = client.list_files()

        assert isinstance(result, FileListResult), "Result should be FileListResult"
        assert result.success is True, "List should be successful"
        assert isinstance(result.files, list), "Files should be a list"

        print_success(f"List files successful")
        print_info(f"Total files: {result.total_files}")
        print_info(f"Total size: {result.total_size_bytes} bytes")

        if result.files:
            print_info(f"Sample file: {result.files[0].filename}")
            print_info(f"  - File ID: {result.files[0].file_id}")
            print_info(f"  - Size: {result.files[0].size_bytes} bytes")
            print_info(f"  - Chunks: {result.files[0].chunk_count}")

        return True, result.files[0].file_id if result.files else None
    except Exception as e:
        print_error(f"List files failed: {e}")
        return False, None


def test_delete_file(client: TrainlyClient, file_id: str):
    """Test 9: Delete File"""
    print_test("Delete File")

    if not file_id:
        print_info("Skipping delete test - no file ID available")
        return True

    try:
        result = client.delete_file(file_id)

        assert isinstance(result, FileDeleteResult), "Result should be FileDeleteResult"
        assert result.success is True, "Delete should be successful"

        print_success(f"File deleted successfully")
        print_info(f"Deleted file: {result.filename}")
        print_info(f"Chunks deleted: {result.chunks_deleted}")
        print_info(f"Size freed: {result.size_bytes_freed} bytes")

        return True
    except Exception as e:
        print_error(f"Delete file failed: {e}")
        return False


def test_error_handling(client: TrainlyClient):
    """Test 10: Error Handling"""
    print_test("Error Handling")

    # Test 1: Empty file ID for delete
    try:
        client.delete_file("")
        print_error("Should have raised error for empty file ID")
        return False
    except TrainlyError as e:
        print_success(f"Correctly raised error for empty file ID: {e}")

    # Test 2: Non-existent file upload
    try:
        client.upload_file("/nonexistent/file.pdf")
        print_error("Should have raised error for non-existent file")
        return False
    except TrainlyError as e:
        print_success(f"Correctly raised error for non-existent file: {e}")

    return True


def test_context_manager():
    """Test 11: Context Manager"""
    print_test("Context Manager")

    try:
        api_key = os.getenv("TRAINLY_API_KEY")
        chat_id = os.getenv("TRAINLY_CHAT_ID")

        with TrainlyClient(api_key=api_key, chat_id=chat_id) as client:
            response = client.query("Test question")
            assert isinstance(response, QueryResponse)

        print_success("Context manager works correctly")
        return True
    except Exception as e:
        print_error(f"Context manager test failed: {e}")
        return False


def test_file_lifecycle(client: TrainlyClient):
    """Test 12: Complete File Lifecycle"""
    print_test("Complete File Lifecycle")

    try:
        # Upload
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("Lifecycle test document content")
            temp_path = f.name

        try:
            upload_result = client.upload_file(temp_path)
            file_id = upload_result.file_id
            print_success(f"Uploaded file: {upload_result.filename}")

            # List and verify
            list_result = client.list_files()
            file_ids = [f.file_id for f in list_result.files]
            assert file_id in file_ids, "File should appear in list"
            print_success("File appears in file list")

            # Query about the file
            response = client.query("What is in the test document?")
            print_success("Query successful after upload")

            # Delete
            delete_result = client.delete_file(file_id)
            assert delete_result.success is True
            print_success("File deleted successfully")

            return True
        finally:
            os.unlink(temp_path)
    except Exception as e:
        print_error(f"File lifecycle test failed: {e}")
        return False


def main():
    """Run all tests."""
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("="*60)
    print("Trainly Python SDK - Package Test Suite")
    print("="*60)
    print(f"{Colors.RESET}")

    # Check environment variables
    api_key = os.getenv("TRAINLY_API_KEY")
    chat_id = os.getenv("TRAINLY_CHAT_ID")

    if not api_key or not chat_id:
        print_error("Please set TRAINLY_API_KEY and TRAINLY_CHAT_ID environment variables")
        print_info("Example:")
        print_info("  export TRAINLY_API_KEY='tk_your_key'")
        print_info("  export TRAINLY_CHAT_ID='chat_your_id'")
        return

    results = []

    # Test 1: Initialization
    success, client = test_initialization()
    results.append(("Initialization", success))
    if not success or not client:
        print_error("Cannot continue without client initialization")
        return

    # Test 2-4: Query tests
    results.append(("Basic Query", test_basic_query(client)))
    results.append(("Query with Parameters", test_query_with_parameters(client)))
    results.append(("Query without Context", test_query_without_context(client)))

    # Test 5: Streaming
    results.append(("Streaming Query", test_streaming_query(client)))

    # Test 6-7: File upload
    upload_success, file_id_1 = test_file_upload(client)
    results.append(("File Upload", upload_success))

    upload_scope_success, file_id_2 = test_file_upload_with_scope(client)
    results.append(("File Upload with Scope", upload_scope_success))

    # Test 8: List files
    list_success, list_file_id = test_list_files(client)
    results.append(("List Files", list_success))

    # Test 9: Delete file (use one of the uploaded files)
    delete_file_id = file_id_1 or file_id_2 or list_file_id
    results.append(("Delete File", test_delete_file(client, delete_file_id)))

    # Test 10: Error handling
    results.append(("Error Handling", test_error_handling(client)))

    # Test 11: Context manager
    results.append(("Context Manager", test_context_manager()))

    # Test 12: File lifecycle
    results.append(("File Lifecycle", test_file_lifecycle(client)))

    # Summary
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("="*60)
    print("Test Summary")
    print("="*60)
    print(f"{Colors.RESET}")

    passed = sum(1 for _, success in results if success)
    total = len(results)

    for test_name, success in results:
        status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if success else f"{Colors.RED}✗ FAIL{Colors.RESET}"
        print(f"{status} - {test_name}")

    print(f"\n{Colors.BOLD}Total: {passed}/{total} tests passed{Colors.RESET}")

    if passed == total:
        print(f"{Colors.GREEN}All tests passed! 🎉{Colors.RESET}")
        return 0
    else:
        print(f"{Colors.RED}Some tests failed. Please review the output above.{Colors.RESET}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

