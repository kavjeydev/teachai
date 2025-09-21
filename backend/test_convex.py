#!/usr/bin/env python3

import httpx
import asyncio
import json

async def test_convex_chat(chat_id: str):
    """Test the Convex connection and see what chat data looks like"""

    convex_url = "https://colorless-finch-681.convex.cloud/api/run/chats/getChatByIdExposed"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                convex_url,
                json={
                    "args": {"id": chat_id},
                    "format": "json"
                }
            )

            print(f"🔍 Convex Response Status: {response.status_code}")

            if response.status_code == 200:
                chat_data = response.json()
                chat = chat_data.get("value")

                print(f"📊 Chat Data Found: {chat is not None}")

                if chat:
                    print(f"   Title: {chat.get('title', 'No title')}")
                    print(f"   API Key: {chat.get('apiKey', 'No key')}")
                    print(f"   API Key Disabled: {chat.get('apiKeyDisabled', 'Not set')}")
                    print(f"   Has API Access: {chat.get('hasApiAccess', 'Not set')}")
                    print(f"   Is Archived: {chat.get('isArchived', 'Not set')}")
                    print(f"   Visibility: {chat.get('visibility', 'Not set')}")
                    print(f"   User ID: {chat.get('userId', 'No user')}")

                    # Show all fields for debugging
                    print(f"\n📋 All fields:")
                    for key, value in chat.items():
                        if key not in ['content', 'context']:  # Skip large fields
                            print(f"   {key}: {value}")
                else:
                    print("❌ No chat data found")
                    print(f"Raw response: {chat_data}")
            else:
                print(f"❌ Convex call failed: {response.status_code}")
                print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Test with both chat IDs you tried
    chat_ids = [
        "jd77nhc21qh69gn6zdmq6yjxeh7qwk3s",
        "jd73cnrkqwm5d2rqbe5r2xzbad7r0jta"
    ]

    for chat_id in chat_ids:
        print(f"\n🧪 Testing Convex connection for chat: {chat_id}")
        asyncio.run(test_convex_chat(chat_id))
        print("-" * 50)
