# TeachAI Chat-as-API Setup Guide

## 🎯 Overview

This guide will help you set up the secure Chat-as-API system that allows users to expose their TeachAI chats as APIs for third-party integration.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│   API Gateway    │───▶│   GraphRAG      │
│                 │    │  (JWT + Scoping) │    │   Backend       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │     Convex       │    │     Neo4j       │
                       │ (API Key Mgmt)   │    │ (Graph Data)    │
                       └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Setup

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt

# Add new dependencies for secure API
pip install PyJWT cryptography redis python-multipart
```

#### Environment Variables
Create `.env` file in backend directory:
```bash
# Existing variables
OPENAI_API_KEY=your_openai_key
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# New variables for secure API
JWT_SECRET=your-super-secret-jwt-key-change-in-production-256-bits
GRAPHRAG_BACKEND_URL=http://localhost:8000
API_HOST=0.0.0.0
API_PORT=8001

# Optional: Redis for production rate limiting
REDIS_URL=redis://localhost:6379
```

#### Start the Secure API Server
```bash
cd backend
python secure_api_server.py
```

The API will be available at `http://localhost:8001`

### 2. Frontend Integration

#### Update Convex Schema
The schema has been updated to include:
- `integration_keys` table for API key management
- `api_usage_logs` table for usage tracking
- New fields in `chats` table for API access

Run Convex deployment:
```bash
cd frontend
npx convex deploy
```

#### Add API Management to Dashboard
The `ApiKeyManager` component can be integrated into your chat settings:

```typescript
import { ApiKeyManager } from "@/components/api-key-manager";

// In your chat settings/dashboard
<ApiKeyManager
  chatId={chatId}
  chatTitle={chatTitle}
/>
```

### 3. Neo4j Setup

#### Install Neo4j
```bash
# Using Docker (recommended)
docker run \
  --name neo4j-teachai \
  -p 7474:7474 -p 7687:7687 \
  -d \
  -v $HOME/neo4j/data:/data \
  -v $HOME/neo4j/logs:/logs \
  -v $HOME/neo4j/import:/var/lib/neo4j/import \
  -v $HOME/neo4j/plugins:/plugins \
  --env NEO4J_AUTH=neo4j/your_password \
  neo4j:5.15
```

#### Initialize Database
```bash
cd backend
python -c "
from neo4j_backend import neo4j_backend
print('Database initialized with constraints and indexes')
"
```

## 🔐 Security Configuration

### 1. JWT Secret
Generate a secure JWT secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. CORS Configuration
Update allowed origins for production:
```python
# In secure_api_server.py
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["api.teachai.com", "your-domain.com"]
)
```

### 3. Rate Limiting
For production, use Redis:
```bash
# Install Redis
docker run -d -p 6379:6379 redis:alpine

# Update rate limiter to use Redis
# (Implementation in auth_middleware.py)
```

## 📊 Monitoring Setup

### 1. Logging
Configure structured logging:
```python
import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module
        })

# Apply to your loggers
```

### 2. Health Checks
Set up health monitoring:
```bash
# Check API health
curl http://localhost:8001/v1/health

# Check specific chat
curl -H "Authorization: Bearer YOUR_JWT" \
     http://localhost:8001/v1/chats/your_chat_id/info
```

### 3. Usage Analytics
Monitor API usage through Convex:
```typescript
const stats = useQuery(api.api_keys.getChatUsageStats, {
  chatId: "your_chat_id",
  timeRange: "7d"
});
```

## 🧪 Testing Your API

### 1. Create Integration Key
```bash
# Through your dashboard or programmatically
curl -X POST http://localhost:8001/v1/chats/your_chat_id/keys \
  -H "Content-Type: application/json" \
  -d '{
    "scopes": ["chat.query", "graph.read"],
    "allowed_origins": ["https://yourapp.com"],
    "rate_limit_rpm": 60
  }'
```

### 2. Exchange for JWT
```bash
curl -X POST http://localhost:8001/v1/tokens/exchange \
  -H "Authorization: Bearer cik_your_integration_key" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "your_chat_id"}'
```

### 3. Query the Chat
```bash
curl -X POST http://localhost:8001/v1/chats/your_chat_id/query \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is machine learning?"}
    ],
    "model": "gpt-4o-mini",
    "temperature": 0.7
  }'
```

### 4. Test Streaming
```bash
curl -X POST http://localhost:8001/v1/chats/your_chat_id/query/stream \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Explain neural networks"}
    ]
  }'
```

## 📚 SDK Integration

### JavaScript/TypeScript
```bash
npm install @teachai/sdk
```

```typescript
import { TeachAIClient } from '@teachai/sdk';

const client = new TeachAIClient({
  integrationKey: 'cik_your_key',
  chatId: 'your_chat_id',
  baseUrl: 'http://localhost:8001' // or your production URL
});

// Simple usage
const answer = await client.ask('What is AI?');
console.log(answer);

// Advanced usage
const response = await client.query({
  messages: [{ role: 'user', content: 'Explain machine learning' }],
  model: 'gpt-4o',
  temperature: 0.3
});

console.log(response.answer);
console.log(`Used ${response.usage.total_tokens} tokens`);
```

### Python
```bash
pip install teachai-sdk
```

```python
from teachai_sdk import TeachAIClient

client = TeachAIClient(
    integration_key='cik_your_key',
    chat_id='your_chat_id',
    base_url='http://localhost:8001'
)

# Simple usage
answer = client.ask('What is machine learning?')
print(answer)

# Streaming
def on_content(content):
    print(content, end='', flush=True)

client.ask_stream(
    'Explain neural networks in detail',
    on_content=on_content
)
```

## 🚀 Production Deployment

### 1. Environment Setup
```bash
# Production environment variables
JWT_SECRET=your-production-jwt-secret-256-bits
NEO4J_URI=neo4j+s://your-aura-instance.databases.neo4j.io
REDIS_URL=redis://your-redis-instance:6379
API_HOST=0.0.0.0
API_PORT=8001
```

### 2. Docker Deployment
```dockerfile
# Dockerfile for secure API server
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8001
CMD ["python", "secure_api_server.py"]
```

### 3. Load Balancer Configuration
```nginx
# Nginx configuration
upstream teachai_api {
    server api1.teachai.com:8001;
    server api2.teachai.com:8001;
}

server {
    listen 443 ssl;
    server_name api.teachai.com;

    location / {
        proxy_pass http://teachai_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📈 Monitoring and Analytics

### 1. Usage Dashboard
Create a dashboard component:
```typescript
function ApiUsageDashboard({ chatId }: { chatId: string }) {
  const stats = useQuery(api.api_keys.getChatUsageStats, {
    chatId,
    timeRange: "30d"
  });

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="Requests" value={stats?.totalRequests} />
      <StatCard title="Tokens" value={stats?.totalTokens} />
      <StatCard title="Error Rate" value={`${stats?.errorRate}%`} />
      <StatCard title="Avg Response" value={`${stats?.avgResponseTime}ms`} />
    </div>
  );
}
```

### 2. Alerting
Set up alerts for:
- High error rates (>5%)
- Rate limit violations
- Unusual usage patterns
- Token expiration issues

### 3. Billing Integration
Track token usage for billing:
```python
# In your billing system
def calculate_api_costs(usage_logs):
    total_cost = 0
    for log in usage_logs:
        model_cost = MODEL_COSTS.get(log.model, 0.001)
        total_cost += log.tokens_used * model_cost
    return total_cost
```

## 🛠️ Customization

### 1. Custom Scopes
Add new permission scopes:
```python
# In auth_middleware.py
AVAILABLE_SCOPES = {
    "chat.query": "Query the chat",
    "graph.read": "Read graph structure",
    "graph.write": "Modify graph",
    "analytics.read": "View usage analytics",  # New scope
    "export.data": "Export chat data"  # New scope
}
```

### 2. Custom Rate Limits
Implement per-plan rate limits:
```python
PLAN_RATE_LIMITS = {
    "free": {"rpm": 20, "daily_tokens": 10000},
    "pro": {"rpm": 60, "daily_tokens": 100000},
    "enterprise": {"rpm": 300, "daily_tokens": 1000000}
}
```

### 3. Webhook Integration
Add webhook support for real-time notifications:
```python
@app.post("/v1/chats/{chat_id}/webhooks")
async def create_webhook(
    chat_id: str,
    webhook_config: WebhookConfig,
    token_claims: TokenClaims = Depends(check_rate_limit)
):
    # Register webhook for chat events
    pass
```

## 🔍 Troubleshooting

### Common Issues

1. **"Token has expired" errors**
   - Check JWT_SECRET is consistent across restarts
   - Verify system clocks are synchronized
   - SDK should automatically handle token refresh

2. **CORS errors**
   - Check allowed_origins configuration
   - Verify Origin header in requests
   - Use `*` only for development

3. **Rate limit exceeded**
   - Check rate_limit_rpm settings
   - Implement exponential backoff in clients
   - Monitor usage patterns

4. **Neo4j connection issues**
   - Verify NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
   - Check network connectivity
   - Ensure constraints are properly created

### Debug Mode
Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
python secure_api_server.py
```

### Health Checks
```bash
# API health
curl http://localhost:8001/v1/health

# Neo4j connectivity
curl -H "Authorization: Bearer JWT_TOKEN" \
     http://localhost:8001/v1/chats/test_chat/info
```

## 📖 Next Steps

1. **Review the API Documentation** (`API_DOCUMENTATION.md`)
2. **Test with the provided SDKs**
3. **Set up monitoring and alerting**
4. **Configure production environment**
5. **Create your first integration!**

## 🆘 Support

- **Documentation**: Full API reference available at `/docs` endpoint
- **Examples**: Check the SDK files for usage examples
- **Issues**: Report issues with detailed logs and reproduction steps

---

**🎉 You're ready to offer Chat-as-API to your users! Each chat becomes a powerful, secure API that can be integrated into any application.**
