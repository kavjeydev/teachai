#!/usr/bin/env python3
"""
🔍 App Secret Debug Tool

This script helps debug app secret authorization issues by:
1. Testing app secret format validation
2. Checking if the app exists in Convex
3. Verifying the app is active
4. Testing the complete authorization flow
"""

import requests
import re
import os
import sys
import json
from typing import Optional

def sanitize_api_key(api_key: str) -> str:
    """Test the same sanitization logic used by the backend"""
    if not api_key or not isinstance(api_key, str):
        return ""

    api_key = api_key.strip()

    # Basic validation for API key format
    if re.match(r'^[a-zA-Z0-9_-]+$', api_key) and 10 <= len(api_key) <= 100:
        return api_key

    return ""

def test_app_secret_format(app_secret: str) -> bool:
    """Test if app secret passes format validation"""
    print(f"🔍 Testing app secret format: '{app_secret[:20]}...'")

    sanitized = sanitize_api_key(app_secret)

    if not sanitized:
        print("❌ FAILED: App secret format is invalid")
        print("   Requirements:")
        print("   • Only letters, numbers, underscores, hyphens")
        print("   • Between 10-100 characters")
        print("   • No spaces or special characters")
        return False

    print("✅ PASSED: App secret format is valid")
    return True

def test_convex_connection(app_secret: str) -> Optional[dict]:
    """Test direct connection to Convex to verify app"""
    print(f"\n🔍 Testing Convex app verification...")

    convex_url = os.getenv("CONVEX_URL", "https://agile-ermine-199.convex.cloud")

    try:
        response = requests.post(
            f"{convex_url}/api/run/app_management/verifyAppSecret",
            json={
                "args": {"appSecret": app_secret},
                "format": "json"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        print(f"   Response status: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ FAILED: Convex returned {response.status_code}")
            print(f"   Response: {response.text}")
            return None

        result = response.json()
        app_data = result.get("value")

        if not app_data:
            print("❌ FAILED: App not found in database")
            print("   • Check if you created the app in the frontend")
            print("   • Verify the app secret is correct")
            return None

        if not app_data.get("isActive"):
            print("❌ FAILED: App exists but is inactive")
            print("   • Check app status in your developer dashboard")
            return None

        print("✅ PASSED: App found and active in Convex")
        print(f"   App ID: {app_data.get('appId')}")
        print(f"   Developer ID: {app_data.get('developerId')}")
        print(f"   Active: {app_data.get('isActive')}")

        return app_data

    except requests.RequestException as e:
        print(f"❌ FAILED: Network error connecting to Convex")
        print(f"   Error: {str(e)}")
        return None

def test_provision_endpoint(app_secret: str) -> bool:
    """Test the actual user provisioning endpoint"""
    print(f"\n🔍 Testing user provisioning endpoint...")

    base_url = "http://localhost:8000"

    try:
        response = requests.post(
            f"{base_url}/v1/privacy/apps/users/provision",
            headers={
                "Authorization": f"Bearer {app_secret}",
                "Content-Type": "application/json"
            },
            json={
                "end_user_id": "debug_test_user",
                "capabilities": ["ask"]
            },
            timeout=10
        )

        print(f"   Response status: {response.status_code}")

        if response.status_code == 401:
            print("❌ FAILED: 401 Unauthorized")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Raw response: {response.text}")
            return False

        if response.status_code == 200:
            print("✅ PASSED: User provisioning successful")
            result = response.json()
            print(f"   User ID: {result.get('end_user_id')}")
            print(f"   Token: {result.get('scoped_token', '')[:20]}...")
            return True

        print(f"❌ FAILED: Unexpected status code {response.status_code}")
        print(f"   Response: {response.text}")
        return False

    except requests.RequestException as e:
        print(f"❌ FAILED: Cannot connect to backend server")
        print(f"   Error: {str(e)}")
        print(f"   Make sure the backend is running on {base_url}")
        return False

def main():
    print("🔍 APP SECRET DEBUG TOOL")
    print("=" * 50)

    # Get app secret from command line or prompt
    if len(sys.argv) > 1:
        app_secret = sys.argv[1]
    else:
        app_secret = input("\nEnter your app secret: ").strip()

    if not app_secret:
        print("❌ No app secret provided")
        sys.exit(1)

    print(f"\nDebugging app secret: {app_secret[:20]}...")

    # Step 1: Test format
    if not test_app_secret_format(app_secret):
        print("\n🚨 RECOMMENDATION:")
        print("   Generate a new app secret with only alphanumeric characters,")
        print("   underscores, and hyphens. Example: 'as_myapp_secret_123'")
        return

    # Step 2: Test Convex connection
    app_data = test_convex_connection(app_secret)
    if not app_data:
        print("\n🚨 RECOMMENDATION:")
        print("   1. Go to your frontend developer dashboard")
        print("   2. Check if your app exists and is active")
        print("   3. Copy the correct app secret")
        print("   4. Ensure CONVEX_URL environment variable is set")
        return

    # Step 3: Test provisioning endpoint
    if not test_provision_endpoint(app_secret):
        print("\n🚨 RECOMMENDATION:")
        print("   1. Check that your backend server is running")
        print("   2. Verify CONVEX_URL in your backend environment")
        print("   3. Check backend logs for detailed error messages")
        return

    print("\n🎉 SUCCESS: App secret is working correctly!")
    print("   Your app authorization should work now.")

if __name__ == "__main__":
    main()
