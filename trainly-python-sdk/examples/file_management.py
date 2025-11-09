"""
File management example for Trainly Python SDK
"""

from trainly import TrainlyClient, TrainlyError
import sys

def format_bytes(bytes_size):
    """Format bytes to human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.2f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.2f} TB"

def main():
    # Initialize the client
    trainly = TrainlyClient(
        api_key="tk_your_api_key_here",
        chat_id="chat_abc123"
    )

    print("📁 Trainly Python SDK - File Management Example\n")

    # Example 1: Upload a file
    print("=" * 60)
    print("Example 1: Upload File")
    print("=" * 60)

    # Replace with your actual file path
    file_path = "./sample_document.pdf"

    try:
        result = trainly.upload_file(file_path)
        print(f"\n✅ Upload successful!")
        print(f"   Filename: {result.filename}")
        print(f"   File ID: {result.file_id}")
        print(f"   Size: {format_bytes(result.size_bytes)}")
        print(f"   Message: {result.message}")
    except TrainlyError as e:
        print(f"\n❌ Upload failed: {e}")
    except FileNotFoundError:
        print(f"\n❌ File not found: {file_path}")
        print("   Please replace with an actual file path in the example")

    # Example 2: Upload with custom scopes
    print("\n" + "=" * 60)
    print("Example 2: Upload with Custom Scopes")
    print("=" * 60)

    try:
        result = trainly.upload_file(
            file_path,
            scope_values={
                "project_id": "proj_123",
                "category": "research",
                "priority": "high"
            }
        )
        print(f"\n✅ Upload with scopes successful!")
        print(f"   Filename: {result.filename}")
        print(f"   Scopes: project_id=proj_123, category=research, priority=high")
    except (TrainlyError, FileNotFoundError) as e:
        print(f"\n⚠️ Skipping: {e}")

    # Example 3: List all files
    print("\n" + "=" * 60)
    print("Example 3: List All Files")
    print("=" * 60)

    try:
        files = trainly.list_files()
        print(f"\n📋 Total files: {files.total_files}")
        print(f"💾 Total storage: {format_bytes(files.total_size_bytes)}")

        if files.files:
            print(f"\n📄 Files:")
            for i, file in enumerate(files.files, 1):
                print(f"\n  {i}. {file.filename}")
                print(f"     ID: {file.file_id}")
                print(f"     Size: {format_bytes(file.size_bytes)}")
                print(f"     Chunks: {file.chunk_count}")
                print(f"     Uploaded: {file.upload_datetime}")
        else:
            print("\n  No files found.")
    except TrainlyError as e:
        print(f"\n❌ Failed to list files: {e}")

    # Example 4: Query with scope filters
    print("\n" + "=" * 60)
    print("Example 4: Query with Scope Filters")
    print("=" * 60)

    try:
        response = trainly.query(
            question="What are the key findings?",
            scope_filters={"project_id": "proj_123"}
        )
        print(f"\n📝 Answer (filtered by project_id=proj_123):")
        print(f"{response.answer}")
    except TrainlyError as e:
        print(f"\n❌ Query failed: {e}")

    # Example 5: Delete a file (commented out for safety)
    print("\n" + "=" * 60)
    print("Example 5: Delete File (Disabled)")
    print("=" * 60)
    print("\n⚠️ File deletion is commented out for safety.")
    print("   Uncomment the code below to delete a specific file:")
    print("""
    # file_id = "your_file_id_here"
    # result = trainly.delete_file(file_id)
    # print(f"Deleted: {result.filename}")
    # print(f"Space freed: {format_bytes(result.size_bytes_freed)}")
    """)

    # Close the session
    trainly.close()

    print("\n✅ File management examples completed!")

if __name__ == "__main__":
    main()

