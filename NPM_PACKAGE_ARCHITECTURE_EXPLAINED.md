# 🏗️ How @trainly/react NPM Package Works

## The Key Insight: npm Package ≠ Backend

The npm package is **just a client library** that makes API calls to your existing backend. Here's how the architecture works:

```
Developer's App               NPM Package              Your Backend Server
┌─────────────────┐          ┌──────────────────┐      ┌─────────────────────┐
│  Next.js App    │          │  @trainly/react  │      │  read_files.py      │
│  ┌─────────────┐│          │  ┌──────────────┐│      │  ┌─────────────────┐ │
│  │<TrainlyChat>││ ────────→│  │TrainlyClient ││ ────→│  │ /v1/{chat}/ask  │ │
│  └─────────────┘│          │  └──────────────┘│      │  └─────────────────┘ │
│  ┌─────────────┐│          │  ┌──────────────┐│      │  ┌─────────────────┐ │
│  │  useTrainly ││ ────────→│  │  API Client  ││ ────→│  │ /v1/privacy/*   │ │
│  └─────────────┘│          │  └──────────────┘│      │  └─────────────────┘ │
└─────────────────┘          └──────────────────┘      └─────────────────────┘
      (Frontend)                 (Client Library)            (Your API Server)
```

## 🔧 How It Actually Works

### 1. **NPM Package = API Client**

The npm package is essentially a smart API client that:

- Makes HTTP requests to your backend
- Handles authentication automatically
- Provides React components and hooks
- Manages state and errors

```typescript
// Inside @trainly/react package
class TrainlyClient {
  async ask(question: string) {
    // This makes a request to YOUR backend server
    const response = await fetch(
      `${this.baseUrl}/v1/${chatId}/answer_question`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      },
    );

    return response.json();
  }
}
```

### 2. **Your Backend Stays Unchanged**

Your `read_files.py` backend server continues to run and serve these endpoints:

#### **Direct API Endpoints** (for simple apps):

- `POST /v1/{chat_id}/answer_question` - Answer questions
- `POST /v1/{chat_id}/upload_file` - Upload files
- `GET /v1/{chat_id}/info` - Get chat info

#### **Privacy-First Endpoints** (for multi-user apps):

- `POST /v1/privacy/apps/users/provision` - Create user workspace
- `POST /v1/privacy/query` - Query user's private data
- `POST /v1/privacy/upload/presigned-url` - Private file uploads

### 3. **The Magic: Configuration**

The npm package automatically chooses which endpoints to use based on how it's configured:

```tsx
// Mode 1: Direct API Key (simple apps)
<TrainlyProvider apiKey="tk_chat_123_key">
  {/* Package calls: /v1/chat_123/answer_question */}
</TrainlyProvider>

// Mode 2: App Secret (multi-user apps)
<TrainlyProvider appSecret="as_secret_123">
  {/* Package calls: /v1/privacy/* endpoints */}
</TrainlyProvider>
```

## 📡 Network Flow Examples

### Example 1: Simple Question with Direct API

```javascript
// User clicks "Ask AI" button
const { ask } = useTrainly();
await ask("What is photosynthesis?");

// Behind the scenes, the package makes this request:
POST http://localhost:8000/v1/chat_123/answer_question
Authorization: Bearer tk_chat_123_your_key
Content-Type: application/json

{
  "question": "What is photosynthesis?",
  "selected_model": "gpt-4o-mini"
}

// Your backend processes this and returns:
{
  "answer": "Photosynthesis is the process...",
  "citations": [...]
}
```

### Example 2: Privacy-First Multi-User

```javascript
// User connects to their workspace
const { connectToTrainly } = useTrainlyHybrid();
await connectToTrainly();

// Behind the scenes:
// Step 1: Provision user workspace
POST http://localhost:8000/v1/privacy/apps/users/provision
Authorization: Bearer as_your_app_secret
Content-Type: application/json

{
  "end_user_id": "user_alice",
  "capabilities": ["ask", "upload"]
}

// Returns scoped token for this user
{
  "scoped_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "privacy_guarantee": "This user's data is completely isolated"
}

// Step 2: User asks question
await ask("What did I upload?");

// Makes request with user's scoped token:
POST http://localhost:8000/v1/privacy/query
x-scoped-token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "end_user_id": "user_alice",
  "question": "What did I upload?",
  "include_citations": true
}
```

## 🔄 Package Architecture Deep Dive

### TrainlyClient.ts (Core API Client)

```typescript
export class TrainlyClient {
  private config: TrainlyConfig;
  private scopedToken: string | null = null;

  constructor(config: TrainlyConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.config.apiKey) {
      // Direct mode - use API key directly
      this.scopedToken = this.config.apiKey;
      return;
    }

    // Privacy mode - provision user workspace
    const response = await fetch(
      `${this.config.baseUrl}/v1/privacy/apps/users/provision`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.appSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          end_user_id: this.config.userId || this.generateAnonymousId(),
          capabilities: ["ask", "upload"],
        }),
      },
    );

    const data = await response.json();
    this.scopedToken = data.scoped_token; // Store user's private token
  }

  async ask(question: string): Promise<QueryResponse> {
    if (this.config.apiKey) {
      // Direct API mode - call chat endpoint
      return this.callDirectAPI(question);
    } else {
      // Privacy mode - call privacy endpoint with scoped token
      return this.callPrivacyAPI(question);
    }
  }

  private async callDirectAPI(question: string) {
    const chatId = this.extractChatId(this.config.apiKey);
    const response = await fetch(
      `${this.config.baseUrl}/v1/${chatId}/answer_question`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      },
    );

    return response.json();
  }

  private async callPrivacyAPI(question: string) {
    const response = await fetch(`${this.config.baseUrl}/v1/privacy/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-scoped-token": this.scopedToken,
      },
      body: JSON.stringify({
        end_user_id: this.config.userId,
        question,
        include_citations: true,
      }),
    });

    return response.json();
  }
}
```

## 🌐 Backend Server Requirements

### What You Need Running

For the npm package to work, you need your backend server running:

```bash
cd backend
python read_files.py
```

This starts your FastAPI server on `http://localhost:8000` with all the endpoints.

### Environment Configuration

The npm package needs to know where your backend is:

```tsx
// Default: points to your local backend
<TrainlyProvider
  appSecret="as_secret_123"
  baseUrl="http://localhost:8000"  // Your backend URL
/>

// Production: point to your deployed backend
<TrainlyProvider
  appSecret="as_secret_123"
  baseUrl="https://api.yourdomain.com"  // Your production API
/>
```

## 🔒 Authentication Flow Breakdown

### Direct API Mode (Simple)

```
1. User installs: npm install @trainly/react
2. Developer configures: <TrainlyProvider apiKey="tk_chat_123_key" />
3. User asks question: const { ask } = useTrainly(); ask("Question?")
4. Package makes request: POST /v1/chat_123/answer_question
5. Your backend processes: Uses existing API key validation
6. Response returned: Answer with citations
```

### Privacy-First Mode (Multi-user)

```
1. User installs: npm install @trainly/react
2. Developer configures: <TrainlyProvider appSecret="as_secret_123" userId="alice" />
3. Package auto-provisions: POST /v1/privacy/apps/users/provision
4. Backend creates: Private workspace for "alice"
5. Package gets: Scoped token for alice's workspace
6. User asks question: ask("What did I upload?")
7. Package makes request: POST /v1/privacy/query (with alice's token)
8. Backend responds: Only alice's private data, AI-filtered
```

## 📦 What's NOT in the NPM Package

The package is **just a client library**. It doesn't include:

❌ **Backend server** - Your Python FastAPI server
❌ **Database** - Your Neo4j/vector database
❌ **AI models** - Your OpenAI/embedding models
❌ **File processing** - Your document parsing logic

## ✅ What IS in the NPM Package

The package includes:

✅ **API Client** - Smart HTTP client for your endpoints
✅ **React Components** - Pre-built UI components
✅ **Authentication Logic** - Token management and refresh
✅ **TypeScript Types** - Full type definitions
✅ **Error Handling** - Retry logic and error states
✅ **State Management** - React hooks and context

## 🚀 Why This is Brilliant

### For Developers

- **No backend setup** - just install and use
- **Works with existing API** - no changes to your server needed
- **Automatic authentication** - package handles all the token dance
- **Production ready** - error handling, loading states, TypeScript

### For You (Trainly)

- **Massive adoption** - removes biggest barrier
- **Same backend** - existing server handles all requests
- **Better UX** - developers love simple installation
- **More users** - easier onboarding = more signups

## 🔧 Technical Summary

1. **Your Backend**: Stays exactly the same, serves API endpoints
2. **NPM Package**: Smart client that knows how to call your backend
3. **Developer**: Just installs package and uses components
4. **Magic**: Package handles authentication, API calls, state management

The npm package is essentially a **super easy wrapper** around your existing API that provides React components and handles all the complex authentication flow automatically.

**Bottom line**: You don't put your backend IN the package - the package just makes it incredibly easy to USE your backend! 🎯
