#!/usr/bin/env python3
"""
Test script for Custom Scoping System

This script demonstrates how to use the custom scoping features:
1. Configure scopes for a chat
2. Upload files with scope values
3. Query with scope filters
"""

import requests
import json
import os
from typing import Dict, Any

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
CHAT_ID = os.getenv("TEST_CHAT_ID", "test_chat_123")
API_KEY = os.getenv("TEST_API_KEY", "test_api_key")

# Headers for API requests
def get_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")

def print_response(response: requests.Response, action: str):
    """Print formatted response"""
    print(f"📡 {action}")
    print(f"   Status: {response.status_code}")
    if response.ok:
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"   Error: {response.text}")
    print()

# Test 1: Configure Scopes
def test_configure_scopes():
    print_section("Test 1: Configure Custom Scopes")

    scope_config = {
        "scopes": [
            {
                "name": "playlist_id",
                "type": "string",
                "required": True,
                "description": "ID of the playlist this document belongs to"
            },
            {
                "name": "user_id",
                "type": "string",
                "required": True,
                "description": "Owner of the playlist"
            },
            {
                "name": "is_public",
                "type": "boolean",
                "required": False,
                "description": "Whether this playlist is publicly accessible"
            }
        ]
    }

    response = requests.post(
        f"{API_BASE_URL}/v1/{CHAT_ID}/scopes/configure",
        headers=get_headers(),
        json=scope_config
    )

    print_response(response, "Configure Scopes")
    return response.ok

# Test 2: Get Scope Configuration
def test_get_scopes():
    print_section("Test 2: Get Scope Configuration")

    response = requests.get(
        f"{API_BASE_URL}/v1/{CHAT_ID}/scopes",
        headers=get_headers()
    )

    print_response(response, "Get Scopes")
    return response.ok

# Test 3: Upload File with Scopes (Simulated)
def test_upload_with_scopes():
    print_section("Test 3: Upload File with Scopes")

    # Create a test text file
    test_content = """
    This is a test document for Playlist 1.
    It contains information about rock music.
    Best practices for rock playlists:
    1. Start with classic rock
    2. Mix in some indie rock
    3. End with hard rock
    """

    with open("/tmp/test_playlist1.txt", "w") as f:
        f.write(test_content)

    scope_values = {
        "playlist_id": "playlist_001",
        "user_id": "user_123",
        "is_public": False
    }

    files = {"file": open("/tmp/test_playlist1.txt", "rb")}
    data = {"scope_values": json.dumps(scope_values)}

    try:
        response = requests.post(
            f"{API_BASE_URL}/v1/{CHAT_ID}/upload_with_scopes",
            headers={"Authorization": f"Bearer {API_KEY}"},
            files=files,
            data=data
        )

        print_response(response, "Upload File with Scopes (Playlist 1)")
        return response.ok
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return False
    finally:
        files["file"].close()

def test_upload_second_playlist():
    """Upload a file for a different playlist"""
    print_section("Test 4: Upload File for Different Playlist")

    # Create a test text file for playlist 2
    test_content = """
    This is a test document for Playlist 2.
    It contains information about jazz music.
    Best practices for jazz playlists:
    1. Start with smooth jazz
    2. Add some bebop
    3. Include modern jazz
    """

    with open("/tmp/test_playlist2.txt", "w") as f:
        f.write(test_content)

    scope_values = {
        "playlist_id": "playlist_002",
        "user_id": "user_123",
        "is_public": True
    }

    files = {"file": open("/tmp/test_playlist2.txt", "rb")}
    data = {"scope_values": json.dumps(scope_values)}

    try:
        response = requests.post(
            f"{API_BASE_URL}/v1/{CHAT_ID}/upload_with_scopes",
            headers={"Authorization": f"Bearer {API_KEY}"},
            files=files,
            data=data
        )

        print_response(response, "Upload File with Scopes (Playlist 2)")
        return response.ok
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return False
    finally:
        files["file"].close()

# Test 5: Query with Scope Filters
def test_query_with_scopes():
    print_section("Test 5: Query with Scope Filters")

    # Query only Playlist 1
    query_payload = {
        "question": "What are the best practices for playlists?",
        "scope_filters": {
            "playlist_id": "playlist_001"
        },
        "selected_model": "gpt-4o-mini",
        "temperature": 0.7,
        "max_tokens": 500
    }

    try:
        response = requests.post(
            f"{API_BASE_URL}/v1/{CHAT_ID}/answer_question",
            headers=get_headers(),
            json=query_payload
        )

        print_response(response, "Query with Scope Filter (Playlist 1)")
        print("💡 This should only return information about rock music from Playlist 1")
        return response.ok
    except Exception as e:
        print(f"❌ Query failed: {e}")
        return False

def test_query_different_scope():
    print_section("Test 6: Query Different Scope")

    # Query only Playlist 2
    query_payload = {
        "question": "What are the best practices for playlists?",
        "scope_filters": {
            "playlist_id": "playlist_002"
        },
        "selected_model": "gpt-4o-mini",
        "temperature": 0.7,
        "max_tokens": 500
    }

    try:
        response = requests.post(
            f"{API_BASE_URL}/v1/{CHAT_ID}/answer_question",
            headers=get_headers(),
            json=query_payload
        )

        print_response(response, "Query with Scope Filter (Playlist 2)")
        print("💡 This should only return information about jazz music from Playlist 2")
        return response.ok
    except Exception as e:
        print(f"❌ Query failed: {e}")
        return False

def test_query_without_scopes():
    print_section("Test 7: Query Without Scope Filters")

    # Query without scope filters (should return all data)
    query_payload = {
        "question": "What are the best practices for playlists?",
        "selected_model": "gpt-4o-mini",
        "temperature": 0.7,
        "max_tokens": 500
    }

    try:
        response = requests.post(
            f"{API_BASE_URL}/v1/{CHAT_ID}/answer_question",
            headers=get_headers(),
            json=query_payload
        )

        print_response(response, "Query without Scope Filters")
        print("💡 This should return information from BOTH playlists")
        return response.ok
    except Exception as e:
        print(f"❌ Query failed: {e}")
        return False

def test_multi_scope_filter():
    print_section("Test 8: Query with Multiple Scope Filters")

    # Query with multiple scope filters
    query_payload = {
        "question": "What are the best practices?",
        "scope_filters": {
            "playlist_id": "playlist_001",
            "user_id": "user_123",
            "is_public": False
        },
        "selected_model": "gpt-4o-mini",
        "temperature": 0.7,
        "max_tokens": 500
    }

    try:
        response = requests.post(
            f"{API_BASE_URL}/v1/{CHAT_ID}/answer_question",
            headers=get_headers(),
            json=query_payload
        )

        print_response(response, "Query with Multiple Scope Filters")
        print("💡 This should only return private content from Playlist 1")
        return response.ok
    except Exception as e:
        print(f"❌ Query failed: {e}")
        return False

# Main test runner
def main():
    print("\n" + "🚀"*40)
    print("  Custom Scoping System Test Suite")
    print("🚀"*40 + "\n")

    print(f"Configuration:")
    print(f"  API Base URL: {API_BASE_URL}")
    print(f"  Chat ID: {CHAT_ID}")
    print(f"  API Key: {API_KEY[:10]}...")
    print()

    results = {
        "Configure Scopes": False,
        "Get Scopes": False,
        "Upload Playlist 1": False,
        "Upload Playlist 2": False,
        "Query Playlist 1": False,
        "Query Playlist 2": False,
        "Query Without Filters": False,
        "Query Multiple Filters": False
    }

    # Run tests
    try:
        results["Configure Scopes"] = test_configure_scopes()
        results["Get Scopes"] = test_get_scopes()
        results["Upload Playlist 1"] = test_upload_with_scopes()
        results["Upload Playlist 2"] = test_upload_second_playlist()

        # Wait a bit for processing
        import time
        print("\n⏳ Waiting 5 seconds for document processing...")
        time.sleep(5)

        results["Query Playlist 1"] = test_query_with_scopes()
        results["Query Playlist 2"] = test_query_different_scope()
        results["Query Without Filters"] = test_query_without_scopes()
        results["Query Multiple Filters"] = test_multi_scope_filter()

    except KeyboardInterrupt:
        print("\n\n⚠️  Test suite interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test suite failed: {e}")

    # Print summary
    print_section("Test Results Summary")
    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, passed_status in results.items():
        status = "✅ PASSED" if passed_status else "❌ FAILED"
        print(f"  {status}: {test_name}")

    print(f"\n📊 Overall: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Custom Scoping System is working correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check the output above for details.")

if __name__ == "__main__":
    main()

