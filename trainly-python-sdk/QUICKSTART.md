# Trainly Python SDK - Quick Start Guide

Get started with Trainly in under 5 minutes!

## 1. Installation

```bash
pip install trainly
```

## 2. Get Your Credentials

You'll need:
- **API Key**: Get it from your Trainly dashboard (starts with `tk_`)
- **Chat ID**: The ID of the chat you want to query

## 3. Basic Example

Create a file `test_trainly.py`:

```python
from trainly import TrainlyClient

# Initialize the client
trainly = TrainlyClient(
    api_key="tk_your_api_key",
    chat_id="chat_abc123"
)

# Ask a question
response = trainly.query("What are the main findings?")
print("Answer:", response.answer)

# See citations
for i, chunk in enumerate(response.context, 1):
    print(f"\nCitation {i}:")
    print(f"  Score: {chunk.score:.2f}")
    print(f"  Source: {chunk.source}")
    print(f"  Text: {chunk.chunk_text[:100]}...")
```

Run it:
```bash
python test_trainly.py
```

## 4. Environment Variables (Recommended)

For better security, use environment variables:

Create a `.env` file:
```bash
TRAINLY_API_KEY=tk_your_api_key
TRAINLY_CHAT_ID=chat_abc123
```

Then in your code:
```python
from trainly import TrainlyClient

# Automatically loads from environment variables
trainly = TrainlyClient()

response = trainly.query("What are the conclusions?")
print(response.answer)
```

## 5. Upload Files

```python
from trainly import TrainlyClient

trainly = TrainlyClient()

# Upload a file
result = trainly.upload_file("./document.pdf")
print(f"Uploaded: {result.filename}")

# Now query it
response = trainly.query("What is this document about?")
print(response.answer)
```

## 6. Advanced: Streaming Responses

```python
from trainly import TrainlyClient

trainly = TrainlyClient()

# Stream the response
for chunk in trainly.query_stream("Explain in detail"):
    if chunk.is_content:
        print(chunk.data, end="", flush=True)
    elif chunk.is_end:
        print("\n\nDone!")
```

## 7. Advanced: Custom Scopes (Multi-tenant)

```python
from trainly import TrainlyClient

trainly = TrainlyClient()

# Upload with scopes
trainly.upload_file(
    "./project_doc.pdf",
    scope_values={
        "workspace_id": "acme_corp",
        "project_id": "proj_123"
    }
)

# Query with filters
response = trainly.query(
    "What are the updates?",
    scope_filters={"workspace_id": "acme_corp"}
)
print(response.answer)
```

## 8. V1 OAuth (For User-Facing Apps)

```python
from trainly import TrainlyV1Client

# Get user's OAuth token from your auth provider
user_token = get_user_oauth_token()  # Your implementation

# Initialize V1 client
trainly = TrainlyV1Client(
    user_token=user_token,
    app_id="app_your_app_id"
)

# Query user's private data
response = trainly.query(
    messages=[{"role": "user", "content": "What's in my files?"}]
)
print(response.answer)
```

## Next Steps

- 📖 Read the [Full Documentation](README.md)
- 👀 Check out [Examples](examples/)
- 🐛 Report issues on [GitHub](https://github.com/trainly/python-sdk/issues)
- 💬 Join our [Discord](https://discord.gg/trainly)

## Common Issues

### Missing API Key Error
```
TrainlyError: API key is required
```
**Solution:** Set the `TRAINLY_API_KEY` environment variable or pass it to the constructor.

### Connection Timeout
```
TrainlyError: Request failed: timeout
```
**Solution:** Increase the timeout:
```python
trainly = TrainlyClient(timeout=60)  # 60 seconds
```

### Rate Limit
```
TrainlyError (429): Rate limit exceeded
```
**Solution:** Wait a moment and retry, or upgrade your plan.

## Get Help

- 📧 Email: support@trainly.com
- 💬 Discord: https://discord.gg/trainly
- 📖 Docs: https://trainly.com/docs/python-sdk

Happy coding! 🚀

