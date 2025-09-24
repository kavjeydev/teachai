#!/usr/bin/env python3
"""
Script to create an app in the database with the existing app secret.
This fixes the issue where the token contains app_user_created_123 because
the app doesn't exist in the database.
"""

import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def create_app_with_secret():
    """Create an app in the database with the existing secret"""

    # The app secret that's being used but doesn't exist in the database
    existing_app_secret = "as_mfybb395_dtvn1w7yk3t"

    # The developer ID that should own this app (from the error logs)
    developer_id = "user_2nFpK6wR2KR7xH2tJ3Nq4wU6YsX"

    # You'll need to get a real chat ID from your frontend
    # For now, we'll create an app without a parent chat
    print("🔧 Creating app with existing secret...")

    convex_url = os.getenv("CONVEX_URL", "https://agile-ermine-199.convex.cloud")

    async with httpx.AsyncClient() as client:
        # First, check if the app already exists
        check_response = await client.post(
            f"{convex_url}/api/run/app_management/verifyAppSecret",
            json={
                "args": {"appSecret": existing_app_secret},
                "format": "json"
            },
            headers={"Content-Type": "application/json"}
        )

        if check_response.status_code == 200:
            result = check_response.json()
            app_data = result.get("value")

            if app_data:
                print(f"✅ App already exists: {app_data}")
                return app_data
            else:
                print("❌ App secret not found in database")

        # Create the app directly in the database
        # Note: This requires modifying the Convex schema to allow direct creation
        print("💡 SOLUTION:")
        print("1. Go to your frontend UI")
        print("2. Open the chat you want to create an API for")
        print("3. Click 'API Access' in the settings")
        print("4. Click 'Create App' to generate a new app with proper database entry")
        print("5. Use the new app secret instead of the hardcoded one")
        print("")
        print("OR")
        print("")
        print("1. Use the frontend to create an app")
        print("2. Get the real app secret from the UI")
        print("3. Update your test files to use the real app secret")

        return None

if __name__ == "__main__":
    asyncio.run(create_app_with_secret())
