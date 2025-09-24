#!/usr/bin/env python3
"""
🔍 Convex App Database Debug Tool

This script helps debug by:
1. Listing all apps in your Convex database
2. Showing their app secrets (first/last few characters)
3. Testing if your provided secret matches any of them
4. Providing the exact working app secret
"""

import requests
import os
import sys
import json

def list_all_apps():
    """Get all apps from Convex database"""
    print("🔍 Fetching all apps from Convex database...")

    convex_url = os.getenv("CONVEX_URL", "https://agile-ermine-199.convex.cloud")

    try:
        # This is a custom query to list all apps - we'll need to create it
        response = requests.post(
            f"{convex_url}/api/run/app_management/getDeveloperApps",
            json={
                "args": {},
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
        apps = result.get("value", [])

        print(f"✅ Found {len(apps)} apps in database:")

        for i, app in enumerate(apps, 1):
            print(f"\n   App {i}:")
            print(f"   • Name: {app.get('name', 'Unknown')}")
            print(f"   • App ID: {app.get('appId', 'Unknown')}")
            print(f"   • Active: {app.get('isActive', False)}")
            print(f"   • Created: {app.get('createdAt', 'Unknown')}")

        return apps

    except requests.RequestException as e:
        print(f"❌ FAILED: Network error connecting to Convex")
        print(f"   Error: {str(e)}")
        return None

def test_app_secret_directly(app_secret: str):
    """Test app secret directly against Convex verifyAppSecret"""
    print(f"\n🔍 Testing app secret directly: '{app_secret[:10]}...'")

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
        print(f"   Full response: {response.text}")

        if response.status_code == 200:
            result = response.json()
            app_data = result.get("value")

            if app_data:
                print("✅ SUCCESS: App secret is valid!")
                print(f"   App ID: {app_data.get('appId')}")
                print(f"   Developer ID: {app_data.get('developerId')}")
                print(f"   Active: {app_data.get('isActive')}")
                return True
            else:
                print("❌ FAILED: App secret not found in database")
                return False
        else:
            print(f"❌ FAILED: Convex error {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ FAILED: Error testing app secret")
        print(f"   Error: {str(e)}")
        return False

def debug_app_secrets():
    """Main debug function"""
    print("🔍 CONVEX APP DATABASE DEBUG TOOL")
    print("=" * 50)

    # First, try to list all apps
    apps = list_all_apps()

    if not apps:
        print("\n🚨 Cannot retrieve apps from database.")
        print("   Possible issues:")
        print("   1. Convex authentication required")
        print("   2. getDeveloperApps function doesn't exist")
        print("   3. Network connectivity issues")
        return

    # Get app secret to test
    if len(sys.argv) > 1:
        test_secret = sys.argv[1]
    else:
        test_secret = input("\nEnter the app secret you're trying to use: ").strip()

    if not test_secret:
        print("❌ No app secret provided")
        return

    # Test the provided secret
    if test_app_secret_directly(test_secret):
        print("\n🎉 Your app secret is working!")
        print("   The 401 error must be coming from somewhere else.")
    else:
        print("\n🚨 Your app secret is NOT working.")
        print("   Solutions:")
        print("   1. Copy the exact app secret from your frontend dashboard")
        print("   2. Regenerate a new app secret")
        print("   3. Ensure no extra spaces or characters")

if __name__ == "__main__":
    debug_app_secrets()
