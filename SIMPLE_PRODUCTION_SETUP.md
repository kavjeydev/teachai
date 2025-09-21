# 🚀 Simple Production API Setup

## Overview

This is the simplified production setup for your exact use case:

1. **User creates chat** → uploads files → gets API key
2. **External apps call** → `api.trainlyai.com/v1/{chatId}/answer_question` with API key
3. **System returns** → AI answer with citations from the chat's knowledge base

## 🏗️ Architecture

```
External App → api.trainlyai.com → [API Key Check] → Your GraphRAG Backend → Response
                                        ↓
                                   Convex (Chat + API Key)
```

## 🚀 Quick Production Setup

### 1. Deploy the Simple API Server

```bash
cd backend

# Install additional dependencies
pip install httpx

# Create production environment file
cat > .env.production << EOF
# Your existing variables
OPENAI_API_KEY=your_openai_key
NEO4J_URI=your_neo4j_uri
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# API server settings
API_HOST=0.0.0.0
API_PORT=8001
GRAPHRAG_BACKEND_URL=http://localhost:8000

# Production settings
ENVIRONMENT=production
EOF

# Start the API server
python simple_api_server.py
```

### 2. Update Your Convex Schema

Add the simple API fields to your existing schema:

```typescript
// In convex/schema.ts - add to existing chats table
hasApiAccess: v.optional(v.boolean()),
```

Deploy the schema:
```bash
cd frontend
npx convex deploy
```

### 3. Add API Management to Dashboard

In your chat settings, add:

```typescript
import { SimpleApiManager } from "@/components/simple-api-manager";

// In your chat settings page
<SimpleApiManager chatId={chatId} chatTitle={chatTitle} />
```

## 🔧 Production Deployment

### Option 1: Docker (Recommended)

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8001
CMD ["python", "simple_api_server.py"]
```

```bash
# Build and run
docker build -t teachai-api .
docker run -d -p 8001:8001 --env-file .env.production teachai-api
```

### Option 2: Direct Deployment

```bash
# On your server
git clone your-repo
cd teachai/backend
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY=your_key
export NEO4J_URI=your_uri
# ... other variables

# Run with production WSGI server
pip install gunicorn
gunicorn simple_api_server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

### Option 3: Cloud Deployment (Railway/Render/Heroku)

```yaml
# railway.toml or similar
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "python simple_api_server.py"

[env]
OPENAI_API_KEY = "your_key"
NEO4J_URI = "your_uri"
# ... other env vars
```

## 🌐 Domain Setup

### 1. DNS Configuration
Point `api.trainlyai.com` to your server:

```
A record: api.trainlyai.com → YOUR_SERVER_IP
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d api.trainlyai.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Reverse Proxy (Nginx)
```nginx
# /etc/nginx/sites-available/api.trainlyai.com
server {
    listen 80;
    server_name api.trainlyai.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.trainlyai.com;

    ssl_certificate /etc/letsencrypt/live/api.trainlyai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.trainlyai.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🧪 Testing Your Production API

### 1. Test API Key Generation
```bash
# In your TeachAI dashboard:
# 1. Go to any chat
# 2. Click "API Settings"
# 3. Click "Generate API Key"
# 4. Copy the key (starts with tk_)
```

### 2. Test the API Endpoint
```bash
# Replace with your actual values
CHAT_ID="your_chat_id"
API_KEY="tk_your_api_key"

curl -X POST https://api.trainlyai.com/v1/$CHAT_ID/answer_question \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the main topic of this chat?",
    "selected_model": "gpt-4o-mini",
    "temperature": 0.7
  }'
```

**Expected Response:**
```json
{
  "answer": "Based on the documents in this chat...",
  "context": [
    {
      "chunk_id": "chunk_123",
      "chunk_text": "Content from your uploaded files...",
      "score": 0.95
    }
  ],
  "chat_id": "your_chat_id",
  "model": "gpt-4o-mini",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

### 3. Test Streaming
```bash
curl -X POST https://api.trainlyai.com/v1/$CHAT_ID/answer_question_stream \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain this in detail",
    "selected_model": "gpt-4o-mini"
  }'
```

## 📊 Monitoring

### 1. Health Check
```bash
curl https://api.trainlyai.com/v1/health
```

### 2. Chat Info
```bash
curl -H "Authorization: Bearer $API_KEY" \
     https://api.trainlyai.com/v1/$CHAT_ID/info
```

### 3. Logs
Monitor your server logs for:
- API key verification attempts
- Rate limiting events
- Backend connection issues
- Response times

## 🔐 Security Checklist

- ✅ API keys are unique per chat
- ✅ API access can be enabled/disabled per chat
- ✅ Rate limiting (60 requests/minute)
- ✅ HTTPS only in production
- ✅ API key verification against Convex
- ✅ Input validation and sanitization
- ✅ Error handling without data leaks

## 🎯 User Flow

### For Chat Owners:
1. **Create Chat**: Use your existing TeachAI interface
2. **Upload Files**: Add documents to build knowledge base
3. **Generate API Key**: Click "Generate API Key" in chat settings
4. **Share Key**: Give API key to developers who need access

### For Developers:
1. **Get API Key**: From chat owner
2. **Make Requests**: Call `api.trainlyai.com/v1/{chatId}/answer_question`
3. **Get Answers**: Receive AI responses based on the chat's knowledge

## 🚀 Go Live Checklist

- [ ] Deploy `simple_api_server.py` to production
- [ ] Configure `api.trainlyai.com` domain with SSL
- [ ] Update Convex schema with `hasApiAccess` field
- [ ] Add `SimpleApiManager` component to your dashboard
- [ ] Test end-to-end flow with a real chat
- [ ] Monitor logs and performance
- [ ] Update your documentation/marketing

## 💡 Example Integration

**Customer Support Bot:**
```javascript
// In your customer support system
async function answerSupportQuestion(question) {
  const response = await fetch('https://api.trainlyai.com/v1/support_chat_id/answer_question', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer tk_your_support_api_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question: question,
      selected_model: 'gpt-4o-mini'
    })
  });

  const data = await response.json();
  return data.answer;
}
```

**Documentation Search:**
```python
# In your docs website
import requests

def search_docs(query):
    response = requests.post(
        'https://api.trainlyai.com/v1/docs_chat_id/answer_question',
        headers={
            'Authorization': 'Bearer tk_your_docs_api_key',
            'Content-Type': 'application/json'
        },
        json={
            'question': f'Search documentation: {query}',
            'selected_model': 'gpt-4o-mini'
        }
    )

    return response.json()['answer']
```

---

**🎉 That's it! Your users can now create chats, upload files, generate API keys, and external apps can query those chats at `api.trainlyai.com/v1/{chatId}/answer_question`**
