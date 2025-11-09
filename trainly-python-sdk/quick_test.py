#!/usr/bin/env python3
"""
Quick test script to verify Trainly installation.
Run this after installing the package.
"""

def test_imports():
    """Test that all main imports work."""
    print("Testing imports...")

    try:
        from trainly import TrainlyClient, TrainlyV1Client
        print("✅ Main clients imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import clients: {e}")
        return False

    try:
        from trainly.models import (
            QueryResponse,
            ChunkScore,
            Usage,
            UploadResult,
            FileInfo,
            FileListResult,
            FileDeleteResult,
            TrainlyError,
        )
        print("✅ All models imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import models: {e}")
        return False

    return True


def test_client_creation():
    """Test that we can create client instances."""
    print("\nTesting client creation...")

    try:
        from trainly import TrainlyClient

        # This should work even without valid credentials
        client = TrainlyClient(
            api_key="test_key",
            chat_id="test_chat"
        )
        print("✅ TrainlyClient created successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to create client: {e}")
        return False


def test_type_hints():
    """Test that type hints are working."""
    print("\nTesting type hints...")

    try:
        from trainly.models import QueryResponse, ChunkScore
        from typing import List

        # Test that we can create instances
        chunk = ChunkScore(
            chunk_text="Test",
            score=0.95,
            source="test.pdf"
        )

        response = QueryResponse(
            answer="Test answer",
            context=[chunk]
        )

        print(f"✅ Type hints working - created QueryResponse with {len(response.context)} chunk(s)")
        return True
    except Exception as e:
        print(f"❌ Type hints test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("Trainly Python SDK - Installation Test")
    print("=" * 60)

    tests = [
        test_imports,
        test_client_creation,
        test_type_hints,
    ]

    results = []
    for test in tests:
        try:
            results.append(test())
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append(False)

    print("\n" + "=" * 60)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("=" * 60)

    if all(results):
        print("\n🎉 All tests passed! Trainly is installed correctly.")
        print("\nNext steps:")
        print("1. Check out the examples: cd examples && python basic_usage.py")
        print("2. Read the docs: cat README.md")
        print("3. Start building with Trainly!")
        return 0
    else:
        print("\n⚠️ Some tests failed. Please check the errors above.")
        print("\nTry:")
        print("1. pip install --upgrade setuptools wheel")
        print("2. pip install -e . --force-reinstall")
        return 1


if __name__ == "__main__":
    exit(main())

