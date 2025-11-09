# Trainly Python SDK

**Dead simple RAG integration for Python applications with V1 OAuth Authentication**

Go from `pip install` to working AI in under 5 minutes. Now supports direct OAuth integration with **permanent user subchats** and complete privacy protection.

[![PyPI version](https://badge.fury.io/py/trainly.svg)](https://badge.fury.io/py/trainly)
[![Python versions](https://img.shields.io/pypi/pyversions/trainly.svg)](https://pypi.org/project/trainly/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

### Installation

```bash
pip install trainly
```

### Basic Usage

```python
from trainly import TrainlyClient

# Initialize the client
trainly = TrainlyClient(
    api_key="tk_your_api_key_here",
    chat_id="chat_abc123"
)

# Ask a question
response = trainly.query(
    question="What are the main findings?"
)

print("Answer:", response.answer)
print("Citations:", len(response.context))

# Access context details
for i, chunk in enumerate(response.context):
    print(f"Citation [{i}]: {chunk.chunk_text[:100]}... (score: {chunk.score})")
```

## 📖 Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Type Hints](#type-hints)
- [Environment Variables](#environment-variables)
- [V1 OAuth Authentication](#v1-oauth-authentication)
- [Core Features](#core-features)
  - [Query](#query)
  - [Streaming Responses](#streaming-responses)
  - [File Upload](#file-upload)
  - [List Files](#list-files)
  - [Delete Files](#delete-files)
- [Custom Scopes](#custom-scopes)
- [Error Handling](#error-handling)
- [Configuration Options](#configuration-options)
- [Examples](#examples)
- [API Reference](#api-reference)

## 🎯 Type Hints

The Python SDK includes full type hints for better IDE support:

```python
from trainly import TrainlyClient, QueryResponse, ChunkScore
from typing import List

trainly = TrainlyClient(
    api_key="tk_your_api_key",
    chat_id="chat_abc123"
)

# Fully typed response
response: QueryResponse = trainly.query(
    question="What is the conclusion?",
    model="gpt-4o",
    temperature=0.5,
    max_tokens=2000
)

# Access typed fields
answer: str = response.answer
context: List[ChunkScore] = response.context
if response.usage:
    tokens: int = response.usage.total_tokens
```

## 🔐 Environment Variables

For better security, use environment variables for your credentials:

**.env**
```bash
TRAINLY_API_KEY=tk_your_api_key_here
TRAINLY_CHAT_ID=chat_abc123
```

**Python**
```python
from trainly import TrainlyClient

# Automatically loads from environment variables
trainly = TrainlyClient()

response = trainly.query("What are the key findings?")
print(response.answer)
```

## 🆕 V1 OAuth Authentication

For user-facing applications with OAuth:

```python
from trainly import TrainlyV1Client

# User authenticates with their OAuth provider
user_token = get_user_oauth_token()  # Your OAuth implementation

# Initialize V1 client with user's token
trainly = TrainlyV1Client(
    user_token=user_token,
    app_id="app_your_app_id"
)

# Query user's private data
response = trainly.query(
    messages=[
        {"role": "user", "content": "What is in my documents?"}
    ]
)

print(response.answer)
```

### V1 Benefits

- ✅ **Permanent User Data**: Same user = same private subchat forever
- ✅ **Complete Privacy**: Developer never sees user files or queries
- ✅ **Any OAuth Provider**: Clerk, Auth0, Cognito, Firebase, custom OIDC
- ✅ **Zero Migration**: Works with your existing OAuth setup
- ✅ **Simple Integration**: Just provide `app_id` and user's OAuth token

## 🎨 Core Features

### Query

Ask questions about your knowledge base:

```python
from trainly import TrainlyClient

trainly = TrainlyClient(
    api_key="tk_your_api_key",
    chat_id="chat_abc123"
)

# Simple query
response = trainly.query("What are the main conclusions?")
print(response.answer)

# Query with custom parameters
response = trainly.query(
    question="Explain the methodology in detail",
    model="gpt-4o",
    temperature=0.3,
    max_tokens=2000,
    include_context=True
)

# Access context chunks
for chunk in response.context:
    print(f"Source: {chunk.source}")
    print(f"Score: {chunk.score}")
    print(f"Text: {chunk.chunk_text[:200]}...")
    print("---")
```

### Streaming Responses

Stream responses in real-time:

```python
from trainly import TrainlyClient

trainly = TrainlyClient(
    api_key="tk_your_api_key",
    chat_id="chat_abc123"
)

# Stream response chunks
for chunk in trainly.query_stream("Explain the methodology in detail"):
    if chunk.is_content:
        print(chunk.data, end="", flush=True)
    elif chunk.is_context:
        print("\n\nContext chunks received:", len(chunk.data))
    elif chunk.is_end:
        print("\n\nStream complete!")
```

### File Upload

Upload files to your knowledge base:

```python
from trainly import TrainlyClient

trainly = TrainlyClient(
    api_key="tk_your_api_key",
    chat_id="chat_abc123"
)

# Upload a file
result = trainly.upload_file("./research_paper.pdf")
print(f"Uploaded: {result.filename}")
print(f"File ID: {result.file_id}")
print(f"Size: {result.size_bytes} bytes")

# Upload with custom scopes
result = trainly.upload_file(
    "./document.pdf",
    scope_values={
        "project_id": "proj_123",
        "category": "research"
    }
)
```

### List Files

Get all files in your knowledge base:

```python
from trainly import TrainlyClient

trainly = TrainlyClient(
    api_key="tk_your_api_key",
    chat_id="chat_abc123"
)

# List all files
files = trainly.list_files()
print(f"Total files: {files.total_files}")
print(f"Total size: {files.total_size_bytes} bytes")

for file in files.files:
    print(f"- {file.filename}")
    print(f"  ID: {file.file_id}")
    print(f"  Size: {file.size_bytes} bytes")
    print(f"  Chunks: {file.chunk_count}")
    print(f"  Uploaded: {file.upload_datetime}")
```

### Delete Files

Remove files from your knowledge base:

```python
from trainly import TrainlyClient

trainly = TrainlyClient(
    api_key="tk_your_api_key",
    chat_id="chat_abc123"
)

# Delete a specific file
result = trainly.delete_file("v1_user_xyz_document.pdf_1609459200")
print(f"Deleted: {result.filename}")
print(f"Chunks deleted: {result.chunks_deleted}")
print(f"Space freed: {result.size_bytes_freed} bytes")
```

## 🏷️ Custom Scopes

Tag your documents with custom attributes for powerful filtering:

```python
from trainly import TrainlyClient

trainly = TrainlyClient(
    api_key="tk_your_api_key",
    chat_id="chat_abc123"
)

# Upload with scopes
trainly.upload_file(
    "./project_report.pdf",
    scope_values={
        "playlist_id": "xyz123",
        "workspace_id": "acme_corp",
        "project": "alpha"
    }
)

# Query with scope filters - only searches matching documents
response = trainly.query(
    question="What are the key features?",
    scope_filters={"playlist_id": "xyz123"}
)
# ☝️ Only searches documents with playlist_id="xyz123"

# Query with multiple filters
response = trainly.query(
    question="Show me updates",
    scope_filters={
        "workspace_id": "acme_corp",
        "project": "alpha"
    }
)
# ☝️ Only searches documents matching ALL specified scopes

# Query everything (no filters)
response = trainly.query("What do I have?")
# ☝️ Searches ALL documents
```

**Use Cases:**

- 🎵 **Playlist Apps**: Filter by `playlist_id` to query specific playlists
- 🏢 **Multi-Tenant SaaS**: Filter by `tenant_id` or `workspace_id`
- 📁 **Project Management**: Filter by `project_id` or `team_id`
- 👥 **User Segmentation**: Filter by `user_tier`, `department`, etc.

## ⚠️ Error Handling

Always wrap API calls in try-except blocks:

```python
from trainly import TrainlyClient, TrainlyError

trainly = TrainlyClient(
    api_key="tk_your_api_key",
    chat_id="chat_abc123"
)

try:
    response = trainly.query("What is the conclusion?")
    print(response.answer)
except TrainlyError as e:
    if e.status_code == 429:
        print("Rate limit exceeded. Please wait and retry.")
    elif e.status_code == 401:
        print("Invalid API key")
    elif e.status_code == 400:
        print(f"Bad request: {e}")
    else:
        print(f"Error: {e}")
```

## ⚙️ Configuration Options

### TrainlyClient

```python
from trainly import TrainlyClient

trainly = TrainlyClient(
    api_key="tk_your_api_key",          # Required (or set TRAINLY_API_KEY)
    chat_id="chat_abc123",               # Required (or set TRAINLY_CHAT_ID)
    base_url="https://api.trainly.com",  # Optional: Custom API URL
    timeout=30,                          # Optional: Request timeout (seconds)
    max_retries=3,                       # Optional: Max retry attempts
)
```

### TrainlyV1Client (OAuth)

```python
from trainly import TrainlyV1Client

trainly = TrainlyV1Client(
    user_token="user_oauth_token",       # Required: User's OAuth token
    app_id="app_your_app_id",            # Required: Your app ID
    base_url="https://api.trainly.com",  # Optional: Custom API URL
    timeout=30,                          # Optional: Request timeout (seconds)
)
```

## 🔍 Examples

### Complete File Management

```python
from trainly import TrainlyClient, TrainlyError

def manage_files():
    trainly = TrainlyClient(
        api_key="tk_your_api_key",
        chat_id="chat_abc123"
    )

    # Upload multiple files
    files_to_upload = [
        "./doc1.pdf",
        "./doc2.txt",
        "./doc3.docx"
    ]

    for file_path in files_to_upload:
        try:
            result = trainly.upload_file(file_path)
            print(f"✅ Uploaded: {result.filename}")
        except TrainlyError as e:
            print(f"❌ Failed to upload {file_path}: {e}")

    # List all files
    files = trainly.list_files()
    print(f"\n📁 Total files: {files.total_files}")
    print(f"💾 Total storage: {files.total_size_bytes / 1024 / 1024:.2f} MB")

    for file in files.files:
        print(f"\n- {file.filename}")
        print(f"  Size: {file.size_bytes / 1024:.2f} KB")
        print(f"  Chunks: {file.chunk_count}")

    # Query the knowledge base
    response = trainly.query("What are the key findings across all documents?")
    print(f"\n🤖 AI Response:\n{response.answer}")

    # Delete old files
    if files.files:
        oldest_file = files.files[0]
        confirm = input(f"\nDelete {oldest_file.filename}? (y/n): ")
        if confirm.lower() == 'y':
            result = trainly.delete_file(oldest_file.file_id)
            print(f"🗑️ Deleted: {result.filename}")
            print(f"💾 Freed: {result.size_bytes_freed / 1024:.2f} KB")

if __name__ == "__main__":
    manage_files()
```

### Context Manager Usage

```python
from trainly import TrainlyClient

# Use as context manager for automatic cleanup
with TrainlyClient(api_key="tk_your_api_key", chat_id="chat_abc123") as trainly:
    response = trainly.query("What are the main points?")
    print(response.answer)

    files = trainly.list_files()
    print(f"Total files: {files.total_files}")
# Session automatically closed
```

### V1 OAuth Integration (Flask Example)

```python
from flask import Flask, request, jsonify
from trainly import TrainlyV1Client, TrainlyError

app = Flask(__name__)

@app.route("/api/query", methods=["POST"])
def query_user_data():
    # Get user's OAuth token from request
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid authorization"}), 401

    user_token = auth_header.split(" ")[1]

    try:
        # Initialize V1 client with user's token
        trainly = TrainlyV1Client(
            user_token=user_token,
            app_id="app_your_app_id"
        )

        # Get question from request
        data = request.get_json()
        question = data.get("question")

        if not question:
            return jsonify({"error": "Missing question"}), 400

        # Query user's private knowledge base
        response = trainly.query(
            messages=[{"role": "user", "content": question}]
        )

        return jsonify({
            "answer": response.answer,
            "context_count": len(response.context),
            "model": response.model
        })

    except TrainlyError as e:
        return jsonify({"error": str(e)}), e.status_code or 500
    finally:
        if 'trainly' in locals():
            trainly.close()

if __name__ == "__main__":
    app.run(debug=True)
```

## 📚 API Reference

### TrainlyClient

#### `__init__(api_key, chat_id, base_url, timeout, max_retries)`
Initialize the client with API credentials.

#### `query(question, model, temperature, max_tokens, include_context, scope_filters) -> QueryResponse`
Query the knowledge base with a question.

#### `query_stream(question, model, temperature, max_tokens, scope_filters) -> Iterator[StreamChunk]`
Stream responses in real-time.

#### `upload_file(file_path, scope_values) -> UploadResult`
Upload a file to the knowledge base.

#### `list_files() -> FileListResult`
List all files in the knowledge base.

#### `delete_file(file_id) -> FileDeleteResult`
Delete a file from the knowledge base.

### TrainlyV1Client

#### `__init__(user_token, app_id, base_url, timeout)`
Initialize the V1 client with OAuth token.

#### `query(messages, model, temperature, max_tokens, scope_filters) -> QueryResponse`
Query the user's private knowledge base.

#### `upload_file(file_path, scope_values) -> UploadResult`
Upload a file to the user's knowledge base.

#### `upload_text(text, content_name, scope_values) -> UploadResult`
Upload text content to the user's knowledge base.

#### `list_files() -> FileListResult`
List all files in the user's knowledge base.

#### `delete_file(file_id) -> FileDeleteResult`
Delete a file from the user's knowledge base.

#### `bulk_upload_files(file_paths, scope_values) -> BulkUploadResult`
Upload multiple files at once (up to 10 files).

### Response Models

All response models are dataclasses with full type hints:

- `QueryResponse`: Answer and context from a query
- `ChunkScore`: A chunk of text with relevance score
- `Usage`: Token usage information
- `UploadResult`: Result of a file upload
- `FileInfo`: Information about a file
- `FileListResult`: List of files with metadata
- `FileDeleteResult`: Result of file deletion
- `BulkUploadResult`: Result of bulk upload operation
- `StreamChunk`: A chunk from a streaming response

### Exceptions

- `TrainlyError`: Base exception for all Trainly SDK errors
  - `status_code`: HTTP status code (if applicable)
  - `details`: Additional error details

## 🛠️ Development

### Install in Development Mode

```bash
git clone https://github.com/trainly/python-sdk.git
cd python-sdk
pip install -e ".[dev]"
```

### Run Tests

```bash
pytest
pytest --cov=trainly  # With coverage
```

### Format Code

```bash
black trainly examples tests
```

### Type Checking

```bash
mypy trainly
```

## 📝 License

MIT - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🆘 Support

- 📖 [Documentation](https://trainly.com/docs/python-sdk)
- 💬 [Discord Community](https://discord.gg/trainly)
- 📧 [Email Support](mailto:support@trainly.com)
- 🐛 [Report Issues](https://github.com/trainly/python-sdk/issues)

---

**Made with ❤️ by the Trainly team**

*The simplest way to add AI to your Python app*

