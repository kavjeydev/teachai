# Trainly Python SDK Examples

This directory contains example scripts demonstrating various features of the Trainly Python SDK.

## Setup

Before running the examples, make sure to:

1. Install the Trainly SDK:
```bash
pip install trainly
```

2. Set up your environment variables (or pass credentials directly in the code):
```bash
export TRAINLY_API_KEY=tk_your_api_key_here
export TRAINLY_CHAT_ID=chat_abc123
```

## Examples

### 1. Basic Usage (`basic_usage.py`)

Demonstrates simple queries and retrieving context with citations.

```bash
python basic_usage.py
```

Features:
- Simple query
- Query with custom parameters
- Accessing context and citations
- Token usage tracking

### 2. File Management (`file_management.py`)

Shows how to upload, list, and delete files.

```bash
python file_management.py
```

Features:
- Upload files
- Upload with custom scopes
- List all files
- Query with scope filters
- Delete files

### 3. Streaming Responses (`streaming_example.py`)

Demonstrates streaming responses in real-time.

```bash
python streaming_example.py
```

Features:
- Real-time streaming
- Handling different chunk types
- Progressive output

### 4. V1 OAuth Authentication (`v1_oauth_example.py`)

Shows how to use V1 OAuth authentication with user tokens.

```bash
python v1_oauth_example.py
```

Features:
- OAuth token authentication
- User-specific queries
- Upload to user's private workspace
- Text content upload
- Scope filtering

### 5. Context Manager (`context_manager.py`)

Demonstrates using the client as a context manager for automatic cleanup.

```bash
python context_manager.py
```

Features:
- Automatic resource management
- Error handling with cleanup
- Multiple operations in context
- Pythonic code patterns

## Customizing Examples

All examples use placeholder credentials. To run them with real data:

1. Replace `tk_your_api_key_here` with your actual API key
2. Replace `chat_abc123` with your actual chat ID
3. For V1 examples, replace `app_your_app_id` with your app ID
4. Replace file paths with actual files on your system

## Getting Help

- 📖 [Full Documentation](https://trainly.com/docs/python-sdk)
- 💬 [Discord Community](https://discord.gg/trainly)
- 📧 [Email Support](mailto:support@trainly.com)

