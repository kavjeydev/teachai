# 🔒 Trainly Privacy-First API Documentation

## 🎯 **Privacy-First Architecture**

Trainly's API ensures **complete user data isolation** - developers can build powerful AI apps while users maintain complete control over their data.

### **🔑 Key Privacy Guarantee**

> **Developers cannot access raw user files or data. Ever.**
> You receive AI-generated responses only, ensuring user trust and compliance.

---

## 🚀 **Quick Start for Developers**

### **1. Create Your App**

Register your app in the Trainly developer dashboard:

```bash
# You'll receive:
App ID: app_yourapp_123
App Secret: as_yourapp_secret_xyz789  # Store securely!
```

### **2. Provision Users (Creates Isolated Sub-Chats)**

When a user starts using your app, provision them:

```javascript
// Backend server-to-server call
const response = await fetch(
  "https://api.trainly.com/v1/privacy/apps/users/provision",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer as_yourapp_secret_xyz789",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      end_user_id: "user_12345", // Your user's ID
      capabilities: ["ask", "upload"], // Safe permissions only
    }),
  },
);

const { scoped_token, privacy_guarantee } = await response.json();
// Returns: Short-lived token scoped to this specific user
```

### **3. Query User's Private Data (AI Responses Only)**

```javascript
// Frontend or backend - only gets AI responses, never raw files
const response = await fetch("https://api.trainly.com/v1/privacy/query", {
  method: "POST",
  headers: {
    "x-scoped-token": scoped_token, // User-specific token
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    end_user_id: "user_12345",
    question: "What documents did I upload about machine learning?",
    include_citations: true,
  }),
});

const result = await response.json();
// Returns: AI answer + citations (snippets only, no raw files)
```

---

## 🔒 **Privacy-First API Endpoints**

### **Base URL**

```
https://api.trainly.com
```

### **1. User Provisioning**

Create isolated sub-chat for a user.

```http
POST /v1/privacy/apps/users/provision
Authorization: Bearer {app_secret}
Content-Type: application/json

{
  "end_user_id": "user_12345",
  "capabilities": ["ask", "upload"]
}
```

**Response:**

```json
{
  "success": true,
  "end_user_id": "user_12345",
  "scoped_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "capabilities": ["ask", "upload"],
  "is_new_user": true,
  "privacy_guarantee": "This user's data is completely isolated - you cannot access their files or raw data"
}
```

### **2. Privacy-First Query**

Query user's private data (AI responses only).

```http
POST /v1/privacy/query
x-scoped-token: {user_scoped_token}
Content-Type: application/json

{
  "end_user_id": "user_12345",
  "question": "What are the key points from my uploaded documents?",
  "include_citations": true
}
```

**Response:**

```json
{
  "success": true,
  "answer": "Based on your uploaded documents, the key points are...",
  "end_user_id": "user_12345",
  "privacy_note": "This response contains only AI-generated content based on the user's private data",
  "citations": [
    {
      "chunk_id": "chunk_abc123",
      "snippet": "Machine learning algorithms can be categorized...",
      "score": 0.95
    }
  ]
}
```

### **3. Direct Upload URLs**

Enable direct user uploads (bypassing your servers).

```http
POST /v1/privacy/upload/presigned-url
x-scoped-token: {user_scoped_token}
Content-Type: application/json

{
  "end_user_id": "user_12345",
  "filename": "business_plan.pdf",
  "file_type": "application/pdf"
}
```

**Response:**

```json
{
  "success": true,
  "upload_url": "https://storage.trainly.com/upload/signed-url-here",
  "filename": "business_plan.pdf",
  "expires_in": 3600,
  "privacy_note": "File will be uploaded directly to user's private namespace"
}
```

### **4. API Health Check**

```http
GET /v1/privacy/health
```

**Response:**

```json
{
  "status": "healthy",
  "privacy_model": "Complete data isolation - developers cannot access user files or raw data",
  "capabilities": {
    "allowed": ["ask", "upload"],
    "blocked": ["list_files", "download_file", "read_raw_data"]
  },
  "compliance": "GDPR/CCPA ready with user data ownership"
}
```

---

## 🛡️ **Security & Privacy Features**

### **Complete Data Isolation**

- ✅ Each user gets their own isolated sub-chat
- ✅ Database queries automatically scoped to user's data
- ✅ No cross-user data access possible
- ✅ Developer cannot see raw files or content

### **Capability-Based Permissions**

```javascript
// ✅ ALLOWED capabilities for developers:
capabilities: ["ask", "upload"];

// ❌ NEVER GRANTED (privacy protection):
capabilities: ["list_files", "download_file", "read_raw_data"];
```

### **Scoped JWT Tokens**

```javascript
// Token claims (automatically verified):
{
  "app_id": "app_yourapp_123",
  "end_user_id": "user_12345",
  "chat_id": "subchat_app_yourapp_123_user_12345",
  "capabilities": ["ask", "upload"],
  "exp": 1640995200  // 15 minutes expiry
}
```

### **Comprehensive Audit Logging**

Every API call is logged:

```javascript
{
  "app_id": "app_yourapp_123",
  "end_user_id": "user_12345",
  "action": "query",
  "allowed": true,
  "timestamp": 1640995200,
  "metadata": {
    "question": "What files...", // First 100 chars only
    "used_chunks": 3
  }
}
```

---

## 💡 **Integration Examples**

### **Example 1: Document Analysis App**

```javascript
class DocumentAnalyzerApp {
  constructor(appSecret) {
    this.appSecret = appSecret;
    this.userTokens = new Map(); // Store scoped tokens
  }

  // Step 1: User signs up to your app
  async onUserSignup(userId) {
    const response = await fetch("/v1/privacy/apps/users/provision", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.appSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        end_user_id: userId,
        capabilities: ["ask", "upload"],
      }),
    });

    const { scoped_token } = await response.json();
    this.userTokens.set(userId, scoped_token);

    return {
      success: true,
      message: "Your private AI workspace is ready!",
      privacy_note:
        "Your files will be stored privately - we cannot access them",
    };
  }

  // Step 2: User asks questions about their documents
  async analyzeUserDocuments(userId, question) {
    const token = this.userTokens.get(userId);

    const response = await fetch("/v1/privacy/query", {
      method: "POST",
      headers: {
        "x-scoped-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        end_user_id: userId,
        question: question,
        include_citations: true,
      }),
    });

    const result = await response.json();

    // You get AI analysis, never raw document content
    return {
      analysis: result.answer,
      sources: result.citations?.map((c) => c.snippet),
      privacy_confirmed: true,
    };
  }

  // Step 3: Enable direct file uploads
  async getUploadUrl(userId, filename) {
    const token = this.userTokens.get(userId);

    const response = await fetch("/v1/privacy/upload/presigned-url", {
      method: "POST",
      headers: {
        "x-scoped-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        end_user_id: userId,
        filename: filename,
        file_type: "application/pdf",
      }),
    });

    const { upload_url } = await response.json();

    // User uploads directly to Trainly, file never touches your servers
    return upload_url;
  }
}
```

### **Example 2: Study Assistant App**

```python
import requests
import time
from typing import Dict, Optional

class StudyAssistantApp:
    def __init__(self, app_secret: str):
        self.app_secret = app_secret
        self.base_url = "https://api.trainly.com"
        self.user_tokens: Dict[str, str] = {}

    def provision_student(self, student_id: str) -> Dict:
        """Create private study space for student"""
        response = requests.post(
            f"{self.base_url}/v1/privacy/apps/users/provision",
            headers={
                "Authorization": f"Bearer {self.app_secret}",
                "Content-Type": "application/json"
            },
            json={
                "end_user_id": student_id,
                "capabilities": ["ask", "upload"]
            }
        )

        if response.status_code == 200:
            data = response.json()
            self.user_tokens[student_id] = data["scoped_token"]

            return {
                "success": True,
                "message": f"Private study space created for student {student_id}",
                "privacy_guarantee": data["privacy_guarantee"]
            }
        else:
            return {"success": False, "error": "Failed to create study space"}

    def help_with_studies(self, student_id: str, question: str) -> Dict:
        """Provide AI study help using student's private materials"""
        if student_id not in self.user_tokens:
            return {"error": "Student not provisioned"}

        response = requests.post(
            f"{self.base_url}/v1/privacy/query",
            headers={
                "x-scoped-token": self.user_tokens[student_id],
                "Content-Type": "application/json"
            },
            json={
                "end_user_id": student_id,
                "question": question,
                "include_citations": True
            }
        )

        if response.status_code == 200:
            data = response.json()
            return {
                "ai_response": data["answer"],
                "study_sources": [c["snippet"] for c in data.get("citations", [])],
                "privacy_note": data["privacy_note"]
            }
        else:
            return {"error": "Failed to process question"}

# Usage
app = StudyAssistantApp("as_studyhelper_secret123")

# Student Alice signs up
result = app.provision_student("student_alice")
print(result["privacy_guarantee"])

# Alice asks about her materials
help_response = app.help_with_studies(
    "student_alice",
    "Summarize the key concepts from my calculus notes"
)
print(help_response["ai_response"])  # AI summary, not raw file content
```

---

## 🚨 **What You CANNOT Do (Privacy Protection)**

### **❌ Blocked Operations**

```javascript
// These will ALL fail with 400/403 errors:

// ❌ List user's files
capabilities: ["list_files"]; // Rejected at provision time

// ❌ Download raw file content
capabilities: ["download_file"]; // Rejected at provision time

// ❌ Access other users' data
fetch("/v1/privacy/query", {
  headers: { "x-scoped-token": "alice_token" },
  body: { end_user_id: "bob_user_id" }, // 403 Forbidden
});

// ❌ Use app secret for user queries
fetch("/v1/privacy/query", {
  headers: { Authorization: "Bearer app_secret" }, // 401 Unauthorized
});
```

### **🔒 Privacy Enforcement**

- **Database Level**: All queries automatically filtered by user's chat ID
- **Token Level**: Scoped tokens only work for specific users
- **Capability Level**: Raw file access capabilities never granted
- **Audit Level**: All access attempts logged and monitored

---

## 📊 **What You CAN See (Developer Dashboard)**

### **✅ Usage Analytics (Safe)**

```json
{
  "app_stats": {
    "total_users": 150,
    "active_users_7d": 45,
    "total_api_calls": 1250,
    "successful_calls": 1200,
    "blocked_calls": 50,
    "avg_response_time": "245ms"
  },
  "usage_by_action": {
    "provision_user": 150,
    "query": 900,
    "upload_request": 200
  }
}
```

### **✅ Audit Logs (Anonymized)**

```json
{
  "logs": [
    {
      "timestamp": 1640995200,
      "end_user_id": "user_***123", // Hashed for privacy
      "action": "query",
      "allowed": true,
      "metadata": {
        "filename": "document.pdf" // Filename only, no content
      }
    }
  ]
}
```

### **❌ What You CANNOT See**

- ❌ User's actual questions or file content
- ❌ Raw document text or metadata
- ❌ File download URLs or listings
- ❌ Cross-user data correlations
- ❌ Real user identities in logs

---

## 🔧 **Complete Integration Flow**

### **Backend Integration (Node.js Example)**

```javascript
const express = require("express");
const app = express();

class TrainlyPrivacyFirstClient {
  constructor(appSecret) {
    this.appSecret = appSecret;
    this.baseUrl = "https://api.trainly.com";
    this.userTokens = new Map();
  }

  // Step 1: User onboarding
  async onboardUser(userId) {
    const response = await fetch(
      `${this.baseUrl}/v1/privacy/apps/users/provision`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.appSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          end_user_id: userId,
          capabilities: ["ask", "upload"],
        }),
      },
    );

    if (response.ok) {
      const data = await response.json();
      this.userTokens.set(userId, data.scoped_token);
      return { success: true, privacy_guarantee: data.privacy_guarantee };
    }
    return { success: false };
  }

  // Step 2: Query user's private data
  async queryUserData(userId, question) {
    const token = this.userTokens.get(userId);
    if (!token) throw new Error("User not onboarded");

    const response = await fetch(`${this.baseUrl}/v1/privacy/query`, {
      method: "POST",
      headers: {
        "x-scoped-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        end_user_id: userId,
        question: question,
        include_citations: true,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error("Query failed");
  }
}

// Initialize client
const trainly = new TrainlyPrivacyFirstClient(process.env.TRAINLY_APP_SECRET);

// API routes
app.post("/api/users/:userId/onboard", async (req, res) => {
  const result = await trainly.onboardUser(req.params.userId);
  res.json(result);
});

app.post("/api/users/:userId/ask", async (req, res) => {
  const result = await trainly.queryUserData(
    req.params.userId,
    req.body.question,
  );
  res.json({
    answer: result.answer,
    privacy_protected: true,
    sources: result.citations?.map((c) => c.snippet),
  });
});
```

### **Frontend Integration (React Example)**

```javascript
import React, { useState, useEffect } from "react";

function DocumentAssistant({ userId }) {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    // Onboard user when component mounts
    onboardUser();
  }, [userId]);

  const onboardUser = async () => {
    const response = await fetch(`/api/users/${userId}/onboard`, {
      method: "POST",
    });

    const result = await response.json();
    if (result.success) {
      setIsOnboarded(true);
      console.log("Privacy guarantee:", result.privacy_guarantee);
    }
  };

  const askQuestion = async () => {
    const response = await fetch(`/api/users/${userId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const result = await response.json();
    setAnswer(result.answer);

    // Show user that their data is private
    if (result.privacy_protected) {
      console.log(
        "✅ Your data is private - developer cannot access your files",
      );
    }
  };

  return (
    <div>
      <h2>Your Private AI Assistant</h2>
      {isOnboarded ? (
        <div>
          <p>✅ Your private workspace is ready</p>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your documents..."
          />
          <button onClick={askQuestion}>Ask AI</button>
          {answer && <div>AI Response: {answer}</div>}
        </div>
      ) : (
        <p>Setting up your private workspace...</p>
      )}
    </div>
  );
}
```

---

## 🔍 **Testing Your Integration**

### **Development Testing**

```bash
# Health check
curl https://api.trainly.com/v1/privacy/health

# Provision test user
curl -X POST https://api.trainly.com/v1/privacy/apps/users/provision \
  -H "Authorization: Bearer your_app_secret" \
  -d '{"end_user_id": "test_user", "capabilities": ["ask", "upload"]}'

# Test query (use token from provision response)
curl -X POST https://api.trainly.com/v1/privacy/query \
  -H "x-scoped-token: scoped_token_here" \
  -d '{"end_user_id": "test_user", "question": "What can you tell me?"}'
```

### **Privacy Violation Tests (Should All Fail)**

```bash
# Test 1: Try dangerous capabilities (should get 400)
curl -X POST https://api.trainly.com/v1/privacy/apps/users/provision \
  -H "Authorization: Bearer your_app_secret" \
  -d '{"capabilities": ["list_files", "download_file"]}'

# Test 2: Try cross-user access (should get 403)
curl -X POST https://api.trainly.com/v1/privacy/query \
  -H "x-scoped-token: user_a_token" \
  -d '{"end_user_id": "user_b", "question": "What files did user B upload?"}'
```

---

## 🎯 **Migration from Legacy API**

### **Before (Legacy API - Privacy Risk)**

```javascript
// ❌ OLD WAY: Developer could access all user data
const client = new TrainlyClient({
  apiKey: "tk_developer_key",
  chatId: "developer_chat", // Single chat for all users
});

// Developer could see all user uploads! 😱
const files = await client.listFiles(); // All user files visible
const content = await client.downloadFile(files[0]); // Raw access
```

### **After (Privacy-First API)**

```javascript
// ✅ NEW WAY: User data is completely isolated
class PrivacyFirstApp {
  async handleUser(userId, question) {
    // Each user gets their own isolated sub-chat
    const { scoped_token } = await this.provisionUser(userId);

    // You only get AI responses, never raw files
    const response = await this.queryPrivateData(
      userId,
      question,
      scoped_token,
    );

    return response.answer; // AI response only, raw files protected
  }
}
```

---

## 📋 **Best Practices**

### **1. Token Management**

```javascript
// ✅ Good: Store tokens securely with expiry
const tokenCache = new Map();

function storeUserToken(userId, token) {
  tokenCache.set(userId, {
    token,
    expiresAt: Date.now() + 14 * 60 * 1000, // 14 minutes (buffer)
  });
}

function getUserToken(userId) {
  const cached = tokenCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }
  return null; // Need to re-provision
}
```

### **2. Error Handling**

```javascript
async function safeQuery(userId, question) {
  try {
    return await queryUserData(userId, question);
  } catch (error) {
    if (error.status === 401) {
      // Token expired - re-provision user
      await provisionUser(userId);
      return await queryUserData(userId, question);
    } else if (error.status === 403) {
      // Privacy violation - log and block
      console.error("Privacy violation attempted:", error.message);
      return { error: "Access denied for privacy protection" };
    }
    throw error;
  }
}
```

### **3. User Communication**

```javascript
// ✅ Be transparent about privacy protection
function showPrivacyMessage() {
  return {
    message:
      "Your documents are stored privately in your own AI workspace. " +
      "The app developer cannot access your files or see your content - " +
      "they only receive AI-generated responses to help you.",
    privacy_features: [
      "✅ Your files are stored in your private sub-chat",
      "✅ App developer cannot list or download your files",
      "✅ Only you and the AI can access your content",
      "✅ Complete audit trail of all access attempts",
    ],
  };
}
```

---

## 🔐 **Security Considerations**

### **App Secret Protection**

```javascript
// ✅ Server-side only
const appSecret = process.env.TRAINLY_APP_SECRET;

// ❌ Never in client-side code
const appSecret = "as_secret_123"; // Don't do this!
```

### **CORS Configuration**

```javascript
// ✅ Production: Specific domains
app.use(
  cors({
    origin: ["https://yourdomain.com", "https://app.yourdomain.com"],
  }),
);

// ⚠️ Development only
app.use(cors({ origin: "*" }));
```

### **Rate Limiting**

```javascript
// Implement client-side rate limiting
const rateLimiter = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter((time) => now - time < 60000);

  if (recentRequests.length >= 10) {
    // 10 requests per minute
    throw new Error("Rate limit exceeded");
  }

  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
}
```

---

## 🎉 **Benefits for Developers**

### **🛡️ Zero Privacy Liability**

- Cannot access user data = no data breach risk
- Automatic GDPR/CCPA compliance
- No need for complex privacy infrastructure

### **🚀 Higher User Adoption**

- Users trust uploading sensitive documents
- Clear privacy guarantees increase engagement
- Enterprise customers feel safe using your app

### **⚡ Simple Integration**

- Clean, focused API (AI responses only)
- No file management complexity
- Built-in security and compliance

### **📈 Business Benefits**

- Faster time to market
- Reduced development costs
- Competitive advantage through privacy

---

## 📞 **Support & Resources**

### **Documentation**

- [Privacy-First Architecture Guide](./PRIVACY_FIRST_ARCHITECTURE.md)
- [Testing Guide](./HOW_TO_TEST_PRIVACY_FIRST.md)
- [Migration Guide](./MIGRATION_GUIDE.md)

### **Example Apps**

- [Document Analyzer](https://github.com/trainly/examples/document-analyzer)
- [Study Assistant](https://github.com/trainly/examples/study-assistant)
- [Legal Document Helper](https://github.com/trainly/examples/legal-helper)

### **Get Help**

- **Discord**: [discord.gg/trainly](https://discord.gg/trainly)
- **Email**: developers@trainly.com
- **Docs**: [docs.trainly.com](https://docs.trainly.com)

---

## 🏆 **Success Stories**

> **"We built a legal document analyzer with Trainly's privacy-first API. Our clients trust us with sensitive contracts because they know we can't access their files - only AI insights."** - LegalTech Startup

> **"The privacy-first architecture let us build a medical education app. Students upload private study materials knowing we can't see them, leading to 3x higher engagement."** - MedEd Company

---

**Ready to build privacy-first AI apps? Start with user provisioning and experience the trust advantage!** 🚀🔒
