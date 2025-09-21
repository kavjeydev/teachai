# 🚀 Production Ready Chat API - Simple Setup

## Overview

Your `read_files.py` now includes everything needed for production Chat API access! Users can create chats, upload files, generate API keys, and external apps can query at `api.trainlyai.com/v1/{chatId}/answer_question`.

## ✅ What's Now Included in `read_files.py`

### 🔐 **Security Features**
- API key authentication via `Authorization: Bearer tk_your_key`
- Rate limiting (60 requests/minute per API key)
- Chat access validation through Convex
- Input sanitization and error handling

### 📡 **New API Endpoints**
- `POST /v1/{chat_id}/answer_question` - Main Q&A endpoint
- `POST /v1/{chat_id}/answer_question_stream` - Streaming responses
- `GET /v1/{chat_id}/info` - Chat information
- `GET /v1/health` - Health check

### 🔧 **Existing Endpoints** (Still work for your dashboard)
- `POST /answer_question` - Internal use
- `POST /create_nodes_and_embeddings` - File processing
- Graph management endpoints

## 🚀 Quick Start

### 1. Install New Dependency
```bash
cd backend
pip install httpx
```

### 2. Start Your Server
```bash
python read_files.py
```

You'll see:
```
🚀 Starting TeachAI GraphRAG API with Chat API endpoints...
📡 Internal endpoints: http://localhost:8000
🌐 External API endpoints:
   POST /v1/{chat_id}/answer_question
   POST /v1/{chat_id}/answer_question_stream
   GET  /v1/{chat_id}/info
   GET  /v1/health
📚 API Documentation: http://localhost:8000/docs
🔐 Authentication: Bearer token required for /v1/ endpoints
```

### 3. Add API Management to Frontend

Add the simple API manager to your chat settings:

```typescript
// In your chat settings component
import { SimpleApiManager } from "@/components/simple-api-manager";

<SimpleApiManager chatId={chatId} chatTitle={chatTitle} />
```

Don't forget to deploy the Convex schema update:
```bash
cd frontend
npx convex deploy
```

## 🎯 Complete User Flow

### For Chat Owners:
1. **Create chat** in TeachAI dashboard
2. **Upload files** (PDF, DOCX, TXT, etc.)
3. **Go to chat settings** → API Access
4. **Click "Generate API Key"** → Get `tk_abc123...`
5. **Share API key** with developers

### For External Developers:
```bash
# Test the API
curl -X POST https://api.trainlyai.com/v1/YOUR_CHAT_ID/answer_question \
  -H "Authorization: Bearer tk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is machine learning?",
    "selected_model": "gpt-4o-mini",
    "temperature": 0.7
  }'
```

**Response:**
```json
{
  "answer": "Based on the uploaded documents, machine learning is...",
  "context": [
    {
      "chunk_id": "doc1-chunk-0",
      "chunk_text": "Machine learning is a subset of AI...",
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

## 🌐 Production Deployment

### Option 1: Direct Deployment
```bash
# On your production server
cd teachai/backend
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY=your_key
export NEO4J_URI=your_neo4j_uri
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=your_password

# Run with production server
pip install gunicorn
gunicorn read_files:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Option 2: Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY read_files.py .
COPY constants.py .

EXPOSE 8000
CMD ["python", "read_files.py"]
```

### Option 3: Cloud Platform (Railway/Render)
Just point to `read_files.py` as your main file and set the environment variables.

## 🔧 Domain Setup

### 1. Point Domain to Your Server
```
A record: api.trainlyai.com → YOUR_SERVER_IP:8000
```

### 2. Add SSL (Let's Encrypt)
```bash
sudo certbot certonly --standalone -d api.trainlyai.com
```

### 3. Reverse Proxy (Nginx)
```nginx
server {
    listen 443 ssl;
    server_name api.trainlyai.com;

    ssl_certificate /etc/letsencrypt/live/api.trainlyai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.trainlyai.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🧪 Testing Your Production API

### 1. Health Check
```bash
curl https://api.trainlyai.com/v1/health
```

### 2. Create Test Chat & API Key
1. Go to your TeachAI dashboard
2. Create a new chat
3. Upload a test document
4. Generate API key in chat settings
5. Copy the API key (starts with `tk_`)

### 3. Test the API
```bash
# Replace with your actual values
CHAT_ID="your_actual_chat_id"
API_KEY="tk_your_actual_api_key"

# Test basic query
curl -X POST https://api.trainlyai.com/v1/$CHAT_ID/answer_question \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the main topic of the uploaded documents?",
    "selected_model": "gpt-4o-mini",
    "temperature": 0.7
  }'

# Test streaming
curl -X POST https://api.trainlyai.com/v1/$CHAT_ID/answer_question_stream \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "question": "Explain this in detail",
    "selected_model": "gpt-4o-mini"
  }'

# Test chat info
curl -H "Authorization: Bearer $API_KEY" \
     https://api.trainlyai.com/v1/$CHAT_ID/info
```

## 📊 What You Get

### Security
- ✅ Each chat has its own API key
- ✅ API keys can be enabled/disabled per chat
- ✅ Rate limiting prevents abuse
- ✅ Automatic validation against your Convex database

### API Features
- ✅ Question answering with citations
- ✅ Streaming responses for real-time apps
- ✅ Multiple AI models support
- ✅ Custom prompts and temperature control
- ✅ Usage tracking and monitoring

### Integration Examples
```javascript
// JavaScript
const response = await fetch('https://api.trainlyai.com/v1/chat123/answer_question', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer tk_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: 'What is machine learning?'
  })
});

const data = await response.json();
console.log(data.answer);
```

```python
# Python
import requests

response = requests.post(
    'https://api.trainlyai.com/v1/chat123/answer_question',
    headers={
        'Authorization': 'Bearer tk_your_api_key',
        'Content-Type': 'application/json'
    },
    json={
        'question': 'What is machine learning?'
    }
)

data = response.json()
print(data['answer'])
```

## 🎉 You're Ready!

That's it! Your `read_files.py` now handles:
- ✅ **Internal dashboard functionality** (existing endpoints)
- ✅ **External API access** (new `/v1/` endpoints)
- ✅ **Security and authentication** (API key validation)
- ✅ **Rate limiting and monitoring** (production ready)

Just deploy this single file and point `api.trainlyai.com` to it. Your users can immediately start creating chats, uploading files, generating API keys, and external developers can integrate with `api.trainlyai.com/v1/{chatId}/answer_question`! 🚀
