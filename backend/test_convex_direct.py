#!/usr/bin/env python3
"""
🔍 Direct Convex Function Test

This script tests different Convex functions to see what's working
and what's causing the server error.
"""

import requests
import os
import sys
import json

def test_convex_function(function_name: str, args: dict = {}):
    """Test any Convex function directly"""
    print(f"🔍 Testing function: {function_name}")
    print(f"   Args: {args}")

    convex_url = os.getenv("CONVEX_URL", "https://agile-ermine-199.convex.cloud")

    try:
        payload = {
            "args": args,
            "format": "json"
        }

        response = requests.post(
            f"{convex_url}/api/run/{function_name}",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")

        if response.status_code == 200:
            try:
                result = response.json()
                if result.get("status") == "error":
                    print(f"   ❌ Convex Error: {result.get('errorMessage')}")
                    return False, result
                else:
                    print(f"   ✅ Success: {result.get('value')}")
                    return True, result
            except json.JSONDecodeError:
                print(f"   ❌ Invalid JSON response")
                return False, None
        else:
            print(f"   ❌ HTTP Error: {response.status_code}")
            return False, None

    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
        return False, None

def main():
    print("🔍 DIRECT CONVEX FUNCTION TEST")
    print("=" * 40)

    app_secret = "as_mfybb395_dtvn1w7yk3t"  # Your app secret from the debug output

    # Test 1: Check if basic Convex connection works
    print("\n1. Testing basic Convex function (should work):")
    success, result = test_convex_function("chats/getChats")

    # Test 2: Test the problematic verifyAppSecret function
    print("\n2. Testing verifyAppSecret function:")
    success, result = test_convex_function("app_management/verifyAppSecret", {"appSecret": app_secret})

    # Test 3: Try to get developer apps (might require auth)
    print("\n3. Testing getDeveloperApps function:")
    success, result = test_convex_function("app_management/getDeveloperApps")

    # Test 4: Check if the apps table has any data at all
    print("\n4. Testing if we can query anything from apps table:")
    # We'll try a function that might exist for listing apps

    print("\n🔍 ANALYSIS:")
    print("If test 1 fails: Convex connection issue")
    print("If test 1 works but test 2 fails: verifyAppSecret function has a bug")
    print("If all tests fail: Authentication or permissions issue")

if __name__ == "__main__":
    main()
