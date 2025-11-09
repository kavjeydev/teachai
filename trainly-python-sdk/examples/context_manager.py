"""
Context manager usage example for Trainly Python SDK

This example demonstrates using the Trainly client as a context manager
for automatic resource cleanup.
"""

from trainly import TrainlyClient, TrainlyError

def main():
    print("🔄 Trainly Python SDK - Context Manager Example\n")

    # Example 1: Basic context manager usage
    print("=" * 60)
    print("Example 1: Basic Context Manager")
    print("=" * 60)

    with TrainlyClient(
        api_key="tk_your_api_key_here",
        chat_id="chat_abc123"
    ) as trainly:
        response = trainly.query("What are the main points?")
        print(f"\n📝 Answer:\n{response.answer}\n")

        files = trainly.list_files()
        print(f"📁 Total files: {files.total_files}")

    print("\n✅ Session automatically closed after context")

    # Example 2: Error handling with context manager
    print("\n" + "=" * 60)
    print("Example 2: Error Handling")
    print("=" * 60)

    try:
        with TrainlyClient(
            api_key="tk_your_api_key_here",
            chat_id="chat_abc123"
        ) as trainly:
            # Try an operation that might fail
            response = trainly.query("Complex query that might timeout...")
            print(f"\n📝 Answer:\n{response.answer}")

    except TrainlyError as e:
        print(f"\n❌ Error occurred: {e}")
        print("   Session was still properly closed")

    # Example 3: Multiple operations in context
    print("\n" + "=" * 60)
    print("Example 3: Multiple Operations")
    print("=" * 60)

    with TrainlyClient(
        api_key="tk_your_api_key_here",
        chat_id="chat_abc123"
    ) as trainly:
        print("\n1. Listing files...")
        try:
            files = trainly.list_files()
            print(f"   Found {files.total_files} files")
        except TrainlyError as e:
            print(f"   Failed: {e}")

        print("\n2. Querying knowledge base...")
        try:
            response = trainly.query("What is the summary?")
            print(f"   Answer: {response.answer[:100]}...")
        except TrainlyError as e:
            print(f"   Failed: {e}")

        print("\n3. Querying with filters...")
        try:
            response = trainly.query(
                question="What are the filtered results?",
                scope_filters={"category": "important"}
            )
            print(f"   Answer: {response.answer[:100]}...")
        except TrainlyError as e:
            print(f"   Failed: {e}")

    print("\n✅ All operations completed, session closed")

    print("\n" + "=" * 60)
    print("Benefits of Context Manager:")
    print("=" * 60)
    print("✅ Automatic resource cleanup")
    print("✅ Proper session closing even if errors occur")
    print("✅ Cleaner, more Pythonic code")
    print("✅ No need to manually call .close()")

if __name__ == "__main__":
    main()

