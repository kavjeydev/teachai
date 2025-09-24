# 🔄 Seamless OAuth Workflow - Complete Example

## 🎯 **How It Works: Each Chat is an App**

Instead of separate apps, **every chat becomes its own "app"** with OAuth capabilities. This is much more flexible and user-friendly.

## 👩‍💼 **Complete User Journey**

### **Scenario:** Sarah wants to use StudyHelper to analyze her ML course materials

#### **Step 1: Sarah Discovers StudyHelper**

```
Sarah: "I need help organizing my machine learning study materials"
Sarah finds: StudyHelper.com - "AI-powered study assistant"
Sarah clicks: "Try StudyHelper"
```

#### **Step 2: StudyHelper Offers AI Integration**

```
StudyHelper: "Welcome! Would you like to connect your study materials with AI?"

[Upload files manually] OR [Connect with Trainly AI ✨]

Sarah clicks: "Connect with Trainly AI"
```

#### **Step 3: Seamless OAuth Redirect**

```javascript
// StudyHelper redirects Sarah to Trainly OAuth
function connectToTrainly() {
  window.location.href =
    "https://trainly.com/oauth/authorize?" +
    "chat_id=ml_study_assistant_chat_123&" + // Dr. Smith's ML study chat
    "redirect_uri=https://studyhelper.com/auth/success&" + // Back to StudyHelper
    "capabilities=ask,upload&" + // What StudyHelper wants
    "response_type=code"; // OAuth standard
}
```

#### **Step 4: Sarah Sees Trainly Authorization**

```
🔐 Authorize StudyHelper

StudyHelper wants to connect to your chat:
"Machine Learning Study Assistant"
Created by: Dr. Sarah Johnson

StudyHelper will be able to:
✅ Ask questions about your study materials (AI responses only)
✅ Help you upload documents to your private workspace
❌ Cannot download or see your raw files
❌ Cannot access other users' study materials

Your study materials stay private - StudyHelper only gets AI responses.

[Authorize StudyHelper] [Cancel]
```

#### **Step 5: Sarah Authorizes & Gets Redirected**

```
Sarah clicks: "Authorize StudyHelper"

Trainly:
→ Creates private auth token: uat_sarah_private_ml_study_token_456
→ Redirects Sarah back to: https://studyhelper.com/auth/success?code=auth_code_789

StudyHelper receives Sarah back and exchanges the code:
```

#### **Step 6: Token Exchange (Behind the Scenes)**

```javascript
// StudyHelper backend (Sarah doesn't see this)
const tokenResponse = await fetch("/v1/oauth/token", {
  method: "POST",
  body: JSON.stringify({
    grant_type: "authorization_code",
    code: "auth_code_789",
    redirect_uri: "https://studyhelper.com/auth/success",
    chat_id: "ml_study_assistant_chat_123",
  }),
});

const result = await tokenResponse.json();
// result.access_token = "uat_sarah_private_ml_study_token_456"

// CRITICAL: StudyHelper stores this token on Sarah's device (localStorage)
// StudyHelper's servers NEVER see Sarah's private token
```

#### **Step 7: Sarah Uses StudyHelper with Privacy Protection**

```
StudyHelper: "✅ Connected! Upload your study materials"

Sarah uploads:
- machine_learning_textbook.pdf (confidential study material)
- exam_practice_questions.pdf (private notes)
- research_paper_drafts.docx (unpublished work)

Files are stored in Sarah's private sub-chat
StudyHelper CANNOT access raw files

Sarah asks: "What are the key concepts from my ML textbook?"

StudyHelper calls (using Sarah's private token):
POST /v1/chats/ml_study_assistant_chat_123/query/secure
Headers: x-user-auth-token: uat_sarah_private_ml_study_token_456
{
  "question": "What are the key ML concepts from my materials?",
  "include_citations": false  // StudyHelper doesn't get citations (privacy)
}

Sarah gets AI response through StudyHelper interface
StudyHelper never sees raw content or detailed citations
```

## 🔧 **Developer Integration Code**

### **Frontend (React Example):**

```javascript
import React, { useState, useEffect } from "react";

function TrainlyConnection({ chatId }) {
  const [userToken, setUserToken] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if user already has a token
  useEffect(() => {
    const stored = localStorage.getItem(`trainly_token_${chatId}`);
    if (stored) setUserToken(stored);
  }, [chatId]);

  // Initiate OAuth flow
  const connectToTrainly = async () => {
    setIsConnecting(true);

    // Get OAuth URL from your backend
    const response = await fetch(`/api/trainly/auth-url`, {
      method: "POST",
      body: JSON.stringify({
        chatId,
        redirectUri: `${window.location.origin}/auth/trainly/callback`,
      }),
    });

    const { authorization_url } = await response.json();

    // Seamless redirect to Trainly OAuth
    window.location.href = authorization_url;
  };

  // Query user's data (only works if user has authorized)
  const askQuestion = async (question) => {
    if (!userToken) {
      alert("Please connect with Trainly first");
      return;
    }

    const response = await fetch(`/v1/chats/${chatId}/query/secure`, {
      method: "POST",
      headers: {
        "x-user-auth-token": userToken, // User's private token
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: question,
        include_citations: false, // Privacy protection
      }),
    });

    const result = await response.json();
    return result.answer; // AI response only
  };

  return (
    <div>
      {userToken ? (
        <div>
          <p>✅ Connected to Trainly AI</p>
          <button onClick={() => askQuestion("What did I upload?")}>
            Ask AI about your documents
          </button>
        </div>
      ) : (
        <div>
          <h3>Connect with Trainly for AI features</h3>
          <p>Securely analyze your documents with AI</p>
          <button onClick={connectToTrainly} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect with Trainly ✨"}
          </button>
        </div>
      )}
    </div>
  );
}
```

### **Backend (Node.js Example):**

```javascript
// Generate OAuth URL
app.post("/api/trainly/auth-url", async (req, res) => {
  const { chatId, redirectUri } = req.body;

  const response = await fetch(
    `http://localhost:8000/v1/chats/${chatId}/oauth/authorize-url`,
    {
      method: "POST",
      headers: {
        "x-api-key": process.env.TRAINLY_CHAT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: "studyhelper",
        redirect_url: redirectUri,
        requested_capabilities: ["ask", "upload"],
      }),
    },
  );

  const result = await response.json();
  res.json(result);
});

// Handle OAuth callback
app.get("/auth/trainly/callback", async (req, res) => {
  const { code, state } = req.query;

  // Exchange code for user's private token
  const tokenResponse = await fetch("http://localhost:8000/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: `${req.protocol}://${req.get("host")}/auth/trainly/callback`,
      chat_id: "ml_study_assistant_chat_123",
    }),
  });

  const tokenData = await tokenResponse.json();

  // Return token to user's frontend (NOT to your servers)
  res.send(`
    <script>
      // Store user's private token on their device only
      localStorage.setItem('trainly_token_${tokenData.chat_id}', '${tokenData.access_token}');

      // Show success message
      alert('✅ Connected with Trainly! Your private token is stored securely.');

      // Redirect to app dashboard
      window.location.href = '/dashboard';
    </script>
  `);
});
```

## 🔒 **Privacy Protection Summary**

### **What Developers CAN Do:**

1. **Generate OAuth URLs** for their chat
2. **Receive OAuth callbacks** with authorization codes
3. **Facilitate token exchange** (but never see the actual token)
4. **Help users** store tokens securely on their devices
5. **Get AI responses** from user queries (no citations)

### **What Developers CANNOT Do:**

1. **See user auth tokens** - tokens go directly to user's device
2. **Access detailed citations** - only available to users directly
3. **Impersonate users** - no control over user authentication
4. **Access raw files** - complete data isolation maintained

### **What Users Control:**

1. **Their private auth tokens** - stored on their device only
2. **Authorization decisions** - they choose which apps to authorize
3. **Full data access** - can see all citations when querying directly
4. **Revocation power** - can disconnect apps anytime

## 🎯 **The Complete Flow:**

```
User Journey:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   StudyHelper   │    │     Trainly     │    │      User       │
│      App        │    │   (OAuth)       │    │    (Sarah)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │ 1. "Connect AI"        │                        │
         │◄───────────────────────│                        │
         │                        │                        │
         │ 2. Redirect to OAuth   │                        │
         │────────────────────────┼──────────────────────►│
         │                        │                        │
         │                        │ 3. Shows auth page    │
         │                        │◄──────────────────────│
         │                        │                        │
         │                        │ 4. User authorizes    │
         │                        │◄──────────────────────│
         │                        │                        │
         │                        │ 5. Creates private    │
         │                        │    token (uat_xxx)    │
         │                        │                        │
         │ 6. Redirect back       │                        │
         │◄───────────────────────┼──────────────────────►│
         │    with auth code      │                        │
         │                        │                        │
         │ 7. Exchange code for   │                        │
         │    user's private token│                        │
         │────────────────────────┼──────────────────────►│
         │                        │                        │
         │ 8. Token stored on     │                        │
         │    user's device       │                        │
         │◄───────────────────────┼──────────────────────►│
         │                        │                        │
         │ 9. User queries data   │                        │
         │    (StudyHelper UI)    │                        │
         │◄───────────────────────│                        │
         │                        │                        │
         │10. API call with       │                        │
         │   user's private token │                        │
         │────────────────────────┼──────────────────────►│
         │                        │                        │
         │11. AI response only    │                        │
         │    (no raw files)      │                        │
         │◄───────────────────────┼──────────────────────►│
```

## 🚀 **Key Benefits:**

### **1. Seamless User Experience**

- No manual token copying
- Standard OAuth flow users understand
- One-click "Connect with Trainly"
- Automatic redirect back to app

### **2. Maximum Flexibility**

- Each chat can be used as an API
- No need to create separate "apps"
- Granular permissions per chat
- Easy to set up and use

### **3. Genuine Privacy Protection**

- User-controlled authentication tokens
- Developers never see private tokens
- Citations hidden from developers
- Complete data isolation

### **4. Developer-Friendly**

- Industry-standard OAuth 2.0 flow
- Simple integration code
- Clear privacy boundaries
- No complex authentication logic

## 🎉 **Result:**

Sarah can now use StudyHelper with **complete confidence** knowing:

- ✅ Her study materials are private (StudyHelper can't access raw files)
- ✅ Her auth token is secure (StudyHelper can't see it)
- ✅ She controls the authorization (can revoke anytime)
- ✅ StudyHelper gets AI responses only (no detailed citations)

This creates a **truly secure, user-centric platform** where developers can build amazing AI apps while users maintain complete control over their data! 🔒✨🚀
