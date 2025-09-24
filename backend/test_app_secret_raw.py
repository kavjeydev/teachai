#!/usr/bin/env python3
"""
🔍 Raw App Secret Test

This script tests app secrets directly against the verifyAppSecret endpoint
to see exactly what's happening.
"""

import requests
import os
import sys
import json

def test_raw_app_secret(app_secret: str):
    """Test app secret directly with full debugging"""
    print(f"🔍 Testing app secret: '{app_secret}'")
    print(f"   Length: {len(app_secret)} characters")
    print(f"   First 10 chars: '{app_secret[:10]}'")
    print(f"   Last 10 chars: '{app_secret[-10:]}'")

    convex_url = os.getenv("CONVEX_URL", "https://agile-ermine-199.convex.cloud")
    print(f"   Convex URL: {convex_url}")

    try:
        payload = {
            "args": {"appSecret": app_secret},
            "format": "json"
        }

        print(f"\n📤 Sending request:")
        print(f"   URL: {convex_url}/api/run/app_management/verifyAppSecret")
        print(f"   Payload: {json.dumps(payload, indent=2)}")

        response = requests.post(
            f"{convex_url}/api/run/app_management/verifyAppSecret",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        print(f"\n📥 Response:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        print(f"   Raw Text: {response.text}")

        if response.status_code == 200:
            try:
                result = response.json()
                print(f"   Parsed JSON: {json.dumps(result, indent=2)}")

                app_data = result.get("value")
                if app_data:
                    print("\n✅ SUCCESS: App found!")
                    print(f"   App ID: {app_data.get('appId')}")
                    print(f"   Developer ID: {app_data.get('developerId')}")
                    print(f"   Active: {app_data.get('isActive')}")
                    print(f"   Name: {app_data.get('name')}")
                    return True
                else:
                    print("\n❌ FAILED: App secret not found")
                    print(f"   Result value is: {app_data}")
                    return False

            except json.JSONDecodeError as e:
                print(f"   JSON Parse Error: {e}")
                return False
        else:
            print(f"\n❌ FAILED: HTTP {response.status_code}")
            return False

    except Exception as e:
        print(f"\n❌ FAILED: Exception occurred")
        print(f"   Error: {str(e)}")
        return False

def main():
    print("🔍 RAW APP SECRET TEST")
    print("=" * 40)

    if len(sys.argv) > 1:
        app_secret = sys.argv[1]
    else:
        print("Usage: python test_app_secret_raw.py 'your_app_secret_here'")
        print("\nOr enter it now:")
        app_secret = input("App Secret: ").strip()

    if not app_secret:
        print("❌ No app secret provided")
        return

    # Test the app secret
    success = test_raw_app_secret(app_secret)

    if success:
        print("\n🎉 SUCCESS: Your app secret works!")
        print("   The issue is elsewhere in your code.")
    else:
        print("\n🚨 PROBLEM: Your app secret doesn't work.")
        print("\n💡 Debugging steps:")
        print("   1. Check if you copied the app secret correctly")
        print("   2. Look for extra spaces or characters")
        print("   3. Verify the app is active in Convex dashboard")
        print("   4. Try regenerating the app secret")

if __name__ == "__main__":
    main()
