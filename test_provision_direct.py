#!/usr/bin/env python3
"""
Direct test of the provisioning endpoint with detailed logging
"""

import requests
import json

def test_provision():
    url = "http://localhost:8000/v1/privacy/apps/users/provision"
    headers = {
        "Authorization": "Bearer as_mfybb395_dtvn1w7yk3t",
        "Content-Type": "application/json"
    }
    data = {
        "end_user_id": "test_user_123",
        "capabilities": ["ask"]
    }

    print(f"🔍 Testing provision endpoint:")
    print(f"   URL: {url}")
    print(f"   Headers: {headers}")
    print(f"   Data: {data}")

    response = requests.post(url, headers=headers, json=data)

    print(f"\n📥 Response:")
    print(f"   Status: {response.status_code}")
    print(f"   Text: {response.text}")

    if response.status_code == 200:
        print("✅ SUCCESS!")
        result = response.json()
        print(f"   User ID: {result.get('end_user_id')}")
        print(f"   Token: {result.get('scoped_token', '')[:20]}...")
    else:
        print("❌ FAILED")
        try:
            error = response.json()
            print(f"   Error: {error.get('detail')}")
        except:
            pass

if __name__ == "__main__":
    test_provision()
