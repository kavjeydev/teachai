"""
V1 OAuth authentication example for Trainly Python SDK

This example demonstrates how to use TrainlyV1Client with OAuth tokens.
In a real application, you would get the user_token from your OAuth provider
(Clerk, Auth0, Cognito, etc.)
"""

from trainly import TrainlyV1Client, TrainlyError

def get_user_oauth_token():
    """
    In a real application, this would get the OAuth token from your auth provider.

    Examples:
    - Clerk: clerk_client.users.get_oauth_access_token(user_id, "oauth_provider")
    - Auth0: Use the ID token from Auth0 callback
    - Cognito: Use the ID token from Cognito user pool
    """
    # Replace with actual OAuth token
    return "your_user_oauth_token_here"

def main():
    print("🔐 Trainly Python SDK - V1 OAuth Example\n")

    # Get user's OAuth token (from your auth provider)
    user_token = get_user_oauth_token()

    print("Initializing TrainlyV1Client...")
    print("=" * 60)

    try:
        # Initialize V1 client with user's OAuth token
        trainly = TrainlyV1Client(
            user_token=user_token,
            app_id="app_your_app_id"  # Your app ID from Trainly console
        )

        print("\n" + "=" * 60)
        print("Example 1: Query User's Private Data")
        print("=" * 60)

        # Query user's private knowledge base
        response = trainly.query(
            messages=[
                {"role": "user", "content": "What documents do I have?"}
            ]
        )

        print(f"\n📝 Answer:\n{response.answer}\n")
        print(f"📚 Context chunks: {len(response.context)}")

        # Example 2: Upload to user's private workspace
        print("\n" + "=" * 60)
        print("Example 2: Upload to User's Private Workspace")
        print("=" * 60)

        # Replace with actual file path
        file_path = "./user_document.pdf"

        try:
            result = trainly.upload_file(
                file_path,
                scope_values={
                    "playlist_id": "user_playlist_123",
                    "category": "personal"
                }
            )
            print(f"\n✅ Upload successful!")
            print(f"   Filename: {result.filename}")
            print(f"   Message: {result.message}")
        except FileNotFoundError:
            print(f"\n⚠️ File not found: {file_path}")
            print("   Replace with an actual file path to test upload")

        # Example 3: Upload text content
        print("\n" + "=" * 60)
        print("Example 3: Upload Text Content")
        print("=" * 60)

        result = trainly.upload_text(
            text="This is my personal note about the project. Key findings include...",
            content_name="My Project Notes",
            scope_values={
                "playlist_id": "user_playlist_123",
                "type": "notes"
            }
        )
        print(f"\n✅ Text upload successful!")
        print(f"   Content name: {result.filename}")
        print(f"   Message: {result.message}")

        # Example 4: List user's files
        print("\n" + "=" * 60)
        print("Example 4: List User's Files")
        print("=" * 60)

        files = trainly.list_files()
        print(f"\n📋 Total files: {files.total_files}")
        print(f"💾 Total storage: {files.total_size_bytes / 1024 / 1024:.2f} MB")

        if files.files:
            print(f"\n📄 Recent files:")
            for file in files.files[:5]:  # Show first 5
                print(f"  - {file.filename} ({file.size_bytes / 1024:.2f} KB)")

        # Example 5: Query with scope filters
        print("\n" + "=" * 60)
        print("Example 5: Query with Scope Filters")
        print("=" * 60)

        response = trainly.query(
            messages=[
                {"role": "user", "content": "What are my notes about?"}
            ],
            scope_filters={"playlist_id": "user_playlist_123"}
        )
        print(f"\n📝 Answer (filtered):\n{response.answer}")

        # Close the session
        trainly.close()

        print("\n✅ V1 OAuth examples completed successfully!")

    except TrainlyError as e:
        print(f"\n❌ Trainly Error: {e}")
        if e.status_code:
            print(f"   Status code: {e.status_code}")
        print("\n💡 Make sure to:")
        print("   1. Replace 'your_user_oauth_token_here' with a real OAuth token")
        print("   2. Replace 'app_your_app_id' with your actual app ID")
        print("   3. Register your OAuth app with Trainly console first")

if __name__ == "__main__":
    main()

