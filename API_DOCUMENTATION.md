# TeachAI Chat API Documentation

## Overview

The TeachAI Chat API allows you to integrate your knowledge graphs and RAG (Retrieval-Augmented Generation) capabilities into any application. Each chat becomes a secure, scoped API that can be accessed by third-party applications.

## 🚀 Quick Start

### 1. Create an Integration Key

In your TeachAI dashboard:
1. Open the chat you want to expose as an API
2. Go to **Settings** → **API Access**
3. Click **Generate Integration Key**
4. Copy your integration key (starts with `cik_`)

### 2. Install the SDK

**JavaScript/TypeScript:**
```bash
npm install @teachai/sdk
# or
yarn add @teachai/sdk
```

**Python:**
```bash
pip install teachai-sdk
```

### 3. Start Querying

**JavaScript:**
```javascript
import { TeachAIClient } from '@teachai/sdk';

const client = new TeachAIClient({
  integrationKey: 'cik_your_integration_key',
  chatId: 'your_chat_id',
  baseUrl: 'https://api.teachai.com'
});

const response = await client.ask('What are the main topics in this knowledge base?');
console.log(response);
```

**Python:**
```python
from teachai_sdk import TeachAIClient

client = TeachAIClient(
    integration_key='cik_your_integration_key',
    chat_id='your_chat_id'
)

answer = client.ask('What are the main topics in this knowledge base?')
print(answer)
```

## 🔐 Authentication

TeachAI uses a two-step authentication process for maximum security:

1. **Integration Key** → Long-lived key for your application (managed in dashboard)
2. **JWT Token** → Short-lived token (15 minutes) for API requests

### Token Exchange

Before making any API calls, exchange your integration key for a JWT token:

```http
POST /v1/tokens/exchange
Authorization: Bearer cik_your_integration_key
Content-Type: application/json

{
  "chat_id": "your_chat_id",
  "requested_scopes": ["chat.query", "graph.read"]
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "scope": "chat.query graph.read",
  "chat_id": "your_chat_id"
}
```

## 📡 API Endpoints

### Base URL
```
https://api.teachai.com
```

### Core Endpoints

#### 1. Query Chat
Query your knowledge base with natural language.

```http
POST /v1/chats/{chat_id}/query
Authorization: Bearer {jwt_token}
Content-Type: application/json
Idempotency-Key: {unique_key}

{
  "messages": [
    {"role": "user", "content": "What is machine learning?"}
  ],
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response:**
```json
{
  "answer": "Machine learning is a subset of artificial intelligence...",
  "citations": [
    {
      "node_id": "chunk_123",
      "title": "Introduction to ML",
      "snippet": "Machine learning algorithms...",
      "score": 0.95,
      "source_uri": "document_1.pdf"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 300,
    "total_tokens": 450
  },
  "run_id": "run_abc123",
  "model": "gpt-4o-mini"
}
```

#### 2. Stream Chat Response
Get real-time streaming responses.

```http
POST /v1/chats/{chat_id}/query/stream
Authorization: Bearer {jwt_token}
Accept: text/event-stream

{
  "messages": [
    {"role": "user", "content": "Explain neural networks"}
  ]
}
```

**Response (Server-Sent Events):**
```
data: {"type": "context", "data": [...]}

data: {"type": "content", "data": "Neural networks are"}

data: {"type": "content", "data": " computational models"}

data: {"type": "end", "run_id": "run_xyz789"}
```

#### 3. Get Graph Data
Access the knowledge graph structure.

```http
GET /v1/chats/{chat_id}/graph?center_node=chunk_123&hops=2&limit=100
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "nodes": [
    {
      "node_id": "chunk_123",
      "type": "Chunk",
      "title": "Neural Networks Introduction",
      "snippet": "Neural networks are...",
      "source_uri": "ml_textbook.pdf",
      "properties": {
        "page": 42,
        "section": "Deep Learning"
      }
    }
  ],
  "relationships": [
    {
      "rel_id": "rel_456",
      "type": "EXPLAINS",
      "from_node": "chunk_123",
      "to_node": "chunk_124",
      "properties": {
        "confidence": 0.9
      }
    }
  ],
  "center_node": "chunk_123"
}
```

#### 4. Get Specific Nodes
Fetch nodes by IDs for citations and tooltips.

```http
GET /v1/chats/{chat_id}/nodes?node_ids=chunk_123,chunk_124,chunk_125
Authorization: Bearer {jwt_token}
```

## 🛡️ Security Features

### Automatic Scoping
- All data access is automatically scoped to your specific chat
- No risk of accessing other users' data
- Tenant isolation enforced at the database level

### Rate Limiting
- **Default**: 60 requests per minute
- **Burst**: Up to 10 requests in quick succession
- **Headers**: `Retry-After` provided when rate limited

### CORS Protection
- Configure allowed origins in your dashboard
- Supports wildcard (`*`) for development
- Strict origin validation for production

### Audit Logging
All API usage is logged for security and billing:
- Request timestamp and IP address
- Tokens used and model selected
- Response status and run ID

## 📚 SDK Reference

### JavaScript/TypeScript SDK

#### Basic Usage
```typescript
import { TeachAIClient } from '@teachai/sdk';

const client = new TeachAIClient({
  integrationKey: 'cik_your_key',
  chatId: 'your_chat_id',
  baseUrl: 'https://api.teachai.com', // optional
  timeout: 30000, // optional
  debug: true // optional
});

// Simple question
const answer = await client.ask('What is AI?');

// Detailed query
const response = await client.query({
  messages: [
    { role: 'user', content: 'Explain machine learning' }
  ],
  model: 'gpt-4o',
  temperature: 0.3
});

// Streaming
await client.askStream(
  'Tell me about neural networks',
  (content) => process.stdout.write(content),
  (fullAnswer) => console.log(`\nComplete: ${fullAnswer.length} chars`)
);

// Graph access
const graph = await client.getGraph({
  centerNode: 'chunk_123',
  hops: 2,
  limit: 50
});
```

#### React Hook
```typescript
import { useTeachAI } from '@teachai/sdk';

function MyComponent() {
  const { client, loading, error, ask } = useTeachAI({
    integrationKey: 'cik_your_key',
    chatId: 'your_chat_id'
  });

  const handleQuestion = async () => {
    const answer = await ask('What is the main topic?');
    console.log(answer);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <button onClick={handleQuestion}>Ask Question</button>;
}
```

### Python SDK

#### Basic Usage
```python
from teachai_sdk import TeachAIClient

client = TeachAIClient(
    integration_key='cik_your_key',
    chat_id='your_chat_id',
    debug=True
)

# Simple question
answer = client.ask('What is machine learning?')
print(answer)

# Detailed query
response = client.query([
    {'role': 'user', 'content': 'Explain neural networks'}
], model='gpt-4o', temperature=0.3)

print(f"Answer: {response.answer}")
print(f"Citations: {len(response.citations)}")

# Streaming
def on_content(content):
    print(content, end='', flush=True)

def on_complete(full_answer):
    print(f"\nComplete! ({len(full_answer)} chars)")

client.ask_stream(
    'Tell me about deep learning',
    on_content=on_content,
    on_complete=on_complete
)

# Graph access
graph = client.get_graph(center_node='chunk_123', hops=2)
print(f"Graph: {len(graph.nodes)} nodes, {len(graph.relationships)} relationships")
```

#### Async Usage
```python
import asyncio

async def main():
    client = TeachAIClient(
        integration_key='cik_your_key',
        chat_id='your_chat_id'
    )

    # Async query
    response = await client.query_async([
        {'role': 'user', 'content': 'What is AI?'}
    ])

    print(response.answer)

asyncio.run(main())
```

## 🔧 Advanced Features

### Idempotency
Prevent duplicate operations by including an `Idempotency-Key` header:

```http
POST /v1/chats/{chat_id}/query
Idempotency-Key: user_action_12345
```

### Custom Models
Support for different AI models:

```json
{
  "model": "gpt-4o",           // OpenAI GPT-4
  "model": "gpt-4o-mini",      // OpenAI GPT-4 Mini
  "model": "claude-3-sonnet",  // Anthropic Claude
  "model": "gemini-pro"        // Google Gemini
}
```

### Temperature Control
Control response creativity:

```json
{
  "temperature": 0.0,  // Deterministic, factual
  "temperature": 0.7,  // Balanced (default)
  "temperature": 1.0   // Creative, varied
}
```

### Citation Access
Get detailed information about citations:

```javascript
// Get nodes referenced in citations
const nodes = await client.getNodes(['chunk_123', 'chunk_124']);

// Get neighborhood around a citation
const graph = await client.getGraph({
  centerNode: 'chunk_123',
  hops: 1
});
```

## 📊 Error Handling

### Error Types

| Status | Type | Description |
|--------|------|-------------|
| 400 | `validation_error` | Invalid request parameters |
| 401 | `authentication_error` | Invalid or expired token |
| 403 | `permission_error` | Insufficient scopes |
| 404 | `not_found` | Chat or resource not found |
| 409 | `conflict_error` | Version mismatch (optimistic updates) |
| 429 | `rate_limit_error` | Too many requests |
| 500 | `server_error` | Internal server error |

### Error Response Format
```json
{
  "error": "Token has expired",
  "type": "authentication_error",
  "details": {
    "code": "TOKEN_EXPIRED",
    "suggestion": "Exchange your integration key for a new token"
  }
}
```

### SDK Error Handling

**JavaScript:**
```typescript
try {
  const response = await client.query({
    messages: [{ role: 'user', content: 'Hello' }]
  });
} catch (error) {
  if (error instanceof TeachAIError) {
    console.error(`API Error (${error.status}): ${error.message}`);

    if (error.code === 'TOKEN_EXPIRED') {
      // SDK automatically handles token refresh
      // Retry the request
    }
  }
}
```

**Python:**
```python
from teachai_sdk import TeachAIClient, TeachAIError

try:
    response = client.query([
        {'role': 'user', 'content': 'Hello'}
    ])
except TeachAIError as e:
    print(f"API Error ({e.status}): {e.message}")

    if e.code == 'RATE_LIMITED':
        time.sleep(60)  # Wait and retry
```

## 🔒 Security Best Practices

### 1. Integration Key Management
- **Never expose integration keys in client-side code**
- Store keys in environment variables or secure key management
- Rotate keys regularly (every 90 days recommended)
- Revoke unused keys immediately

### 2. Scoping
- Each integration key is scoped to a single chat
- No access to other chats or tenant data
- Automatic tenant isolation at database level

### 3. Rate Limiting
- Implement client-side rate limiting to avoid 429 errors
- Use exponential backoff for retries
- Monitor usage in your dashboard

### 4. CORS Configuration
- Configure specific allowed origins (avoid `*` in production)
- Use HTTPS only for production
- Validate referrer headers when possible

## 💡 Use Cases

### 1. Customer Support Chatbot
```javascript
// Integrate your knowledge base into customer support
const client = new TeachAIClient({
  integrationKey: process.env.SUPPORT_CHAT_KEY,
  chatId: 'support_knowledge_base'
});

app.post('/api/support/query', async (req, res) => {
  const answer = await client.ask(req.body.question);
  res.json({ answer });
});
```

### 2. Documentation Search
```python
# Add intelligent search to your docs
client = TeachAIClient(
    integration_key=os.getenv('DOCS_CHAT_KEY'),
    chat_id='documentation_chat'
)

@app.route('/search')
def search_docs():
    query = request.json['query']
    response = client.query([
        {'role': 'user', 'content': f'Search documentation: {query}'}
    ])

    return {
        'answer': response.answer,
        'sources': [c.title for c in response.citations]
    }
```

### 3. Slack Bot Integration
```javascript
// Slack bot that queries your knowledge base
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.message(/ask (.*)/, async ({ message, say }) => {
  const question = message.text.replace('ask ', '');

  const answer = await teachAIClient.ask(question);

  await say({
    text: answer,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: answer }
      }
    ]
  });
});
```

### 4. Mobile App Integration
```swift
// iOS Swift example
import Foundation

class TeachAIService {
    private let integrationKey: String
    private let chatId: String
    private var accessToken: String?

    func ask(question: String) async throws -> String {
        let token = try await getAccessToken()

        let request = QueryRequest(
            messages: [ChatMessage(role: "user", content: question)]
        )

        // Make API call...
        return response.answer
    }
}
```

## 📈 Monitoring and Analytics

### Usage Tracking
Monitor your API usage in the TeachAI dashboard:
- Request volume and patterns
- Token usage and costs
- Error rates and types
- Response times

### Audit Logs
All API calls are logged with:
- Timestamp and IP address
- User agent and request details
- Response status and tokens used
- Run ID for debugging

### Billing
Usage-based billing with:
- Token consumption tracking
- Model-specific pricing
- Monthly usage reports
- Spending alerts and limits

## 🚨 Rate Limits

| Plan | Requests/Minute | Burst | Max Tokens/Day |
|------|----------------|-------|----------------|
| Free | 20 | 5 | 10,000 |
| Pro | 60 | 10 | 100,000 |
| Enterprise | 300 | 30 | 1,000,000 |

### Rate Limit Headers
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

## 🔄 Webhook Integration

Get notified when your chat data changes:

```http
POST /v1/chats/{chat_id}/webhooks
{
  "url": "https://your-app.com/webhooks/teachai",
  "events": ["node.created", "node.updated", "relationship.created"],
  "secret": "your_webhook_secret"
}
```

**Webhook Payload:**
```json
{
  "event": "node.created",
  "chat_id": "your_chat_id",
  "data": {
    "node_id": "chunk_123",
    "type": "Chunk",
    "title": "New Content"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🧪 Testing

### Test with cURL
```bash
# 1. Exchange token
curl -X POST https://api.teachai.com/v1/tokens/exchange \
  -H "Authorization: Bearer cik_your_key" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "your_chat_id"}'

# 2. Query chat
curl -X POST https://api.teachai.com/v1/chats/your_chat_id/query \
  -H "Authorization: Bearer eyJhbGciOi..." \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### SDK Testing
```javascript
// Test your integration
const client = new TeachAIClient({
  integrationKey: 'cik_test_key',
  chatId: 'test_chat',
  debug: true
});

// Health check
try {
  const info = await client.getChatInfo();
  console.log('✅ Connection successful:', info);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
}
```

## 🚀 Production Deployment

### Environment Variables
```bash
# Required
TEACHAI_INTEGRATION_KEY=cik_your_production_key
TEACHAI_CHAT_ID=your_production_chat_id

# Optional
TEACHAI_BASE_URL=https://api.teachai.com
TEACHAI_TIMEOUT=30000
TEACHAI_DEBUG=false
```

### Error Monitoring
Integrate with your monitoring service:

```javascript
import * as Sentry from '@sentry/node';

client.on('error', (error) => {
  Sentry.captureException(error, {
    tags: {
      service: 'teachai-api',
      chat_id: client.chatId
    }
  });
});
```

### Caching
Implement caching for better performance:

```javascript
const cache = new Map();

async function cachedQuery(question) {
  const cacheKey = `query:${hashString(question)}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const response = await client.ask(question);
  cache.set(cacheKey, response);

  // Expire after 1 hour
  setTimeout(() => cache.delete(cacheKey), 3600000);

  return response;
}
```

## 🆘 Support

### Getting Help
- **Documentation**: [docs.teachai.com](https://docs.teachai.com)
- **Discord**: [discord.gg/teachai](https://discord.gg/teachai)
- **Email**: support@teachai.com
- **Status Page**: [status.teachai.com](https://status.teachai.com)

### Common Issues

**Q: "Token has expired" errors**
A: The SDK automatically handles token refresh. If you're getting this error, check that your integration key is valid and not revoked.

**Q: "Rate limit exceeded"**
A: Implement exponential backoff or reduce request frequency. Consider upgrading your plan for higher limits.

**Q: "Chat not found"**
A: Verify the chat ID and ensure the chat hasn't been deleted or archived.

**Q: CORS errors in browser**
A: Configure allowed origins in your dashboard. Use `*` only for development.

### Feature Requests
Submit feature requests and bug reports at [github.com/teachai/api-feedback](https://github.com/teachai/api-feedback).

---

## 📄 License

The TeachAI SDK is MIT licensed. See [LICENSE](LICENSE) for details.

## 🔄 Changelog

### v1.0.0 (2024-01-15)
- Initial release
- JWT-based authentication
- Core query and graph endpoints
- JavaScript and Python SDKs
- Comprehensive documentation

---

**Ready to build something amazing with TeachAI? Start with our [Quick Start Guide](https://docs.teachai.com/quickstart) or explore the [API Reference](https://docs.teachai.com/api).**
