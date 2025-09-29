# Trainly V1 Trusted Issuer Setup Guide

## 🚀 Complete Setup for V1 Authentication

This guide shows you how to set up Trainly with the new V1 Trusted Issuer authentication system, where users authenticate with their own OAuth providers.

## 📋 Prerequisites

- Python 3.8+
- Your OAuth provider (Clerk, Auth0, Cognito, etc.) already set up
- Neo4j database running
- OpenAI API key

## 🔧 Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

The requirements.txt now includes all V1 dependencies:

- `PyJWT[crypto]` - JWT token verification
- `cryptography` - Cryptographic operations
- `cachetools` - JWKS caching
- `requests` - HTTP requests for JWKS fetching

## 🌍 Step 2: Environment Variables

Create/update your `.env` file:

```bash
# Existing variables
OPENAI_API_KEY=your_openai_key
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
CONVEX_URL=https://your-convex-url.convex.cloud

# V1 Authentication (new)
TRAINLY_CONSOLE_ADMIN_TOKEN=your_secure_admin_token_123
```

## 🚀 Step 3: Start Trainly Server

```bash
python read_files.py
```

You should see:

```
🚀 Starting TeachAI GraphRAG API with Privacy-First Architecture...
📡 Internal endpoints: http://localhost:8000
🔒 V1 Trusted Issuer endpoints now available!
```

## 🔐 Step 4: Register Your OAuth App (One-time)

Register your app with Trainly so it knows how to validate your OAuth tokens:

### For Clerk:

```bash
curl -X POST "http://localhost:8000/v1/console/apps/register" \
  -H "X-Admin-Token: your_secure_admin_token_123" \
  -F "app_name=My App with Clerk" \
  -F "issuer=https://your-clerk-domain.clerk.accounts.dev" \
  -F 'allowed_audiences=["your-clerk-frontend-api"]' \
  -F 'alg_allowlist=["RS256"]'
```

### For Auth0:

```bash
curl -X POST "http://localhost:8000/v1/console/apps/register" \
  -H "X-Admin-Token: your_secure_admin_token_123" \
  -F "app_name=My App with Auth0" \
  -F "issuer=https://your-domain.auth0.com/" \
  -F 'allowed_audiences=["your-auth0-client-id"]' \
  -F 'alg_allowlist=["RS256"]'
```

### For AWS Cognito:

```bash
curl -X POST "http://localhost:8000/v1/console/apps/register" \
  -H "X-Admin-Token: your_secure_admin_token_123" \
  -F "app_name=My App with Cognito" \
  -F "issuer=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX" \
  -F 'allowed_audiences=["your-cognito-client-id"]' \
  -F 'alg_allowlist=["RS256"]'
```

**Save the `app_id` from the response** - you'll need it for client requests!

## 💻 Step 5: Client Integration

Now integrate V1 authentication into your app:

### React with Clerk Example:

```typescript
// hooks/useTrainlyV1.ts
import { useAuth } from "@clerk/nextjs";

export function useTrainlyV1() {
  const { getToken } = useAuth();

  const APP_ID = "your_app_id_from_registration"; // From Step 4
  const TRAINLY_BASE_URL =
    process.env.NEXT_PUBLIC_TRAINLY_URL || "http://localhost:8000";

  async function queryTrainly(
    messages: Array<{ role: string; content: string }>,
  ) {
    const idToken = await getToken();

    if (!idToken) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(`${TRAINLY_BASE_URL}/v1/me/chats/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "X-App-ID": APP_ID,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        messages: JSON.stringify(messages),
        response_tokens: "150",
      }),
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    return response.json();
  }

  async function uploadFile(file: File) {
    const idToken = await getToken();

    if (!idToken) {
      throw new Error("User not authenticated");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${TRAINLY_BASE_URL}/v1/me/chats/files/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "X-App-ID": APP_ID,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async function getUserProfile() {
    const idToken = await getToken();

    if (!idToken) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(`${TRAINLY_BASE_URL}/v1/me/profile`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        "X-App-ID": APP_ID,
      },
    });

    return response.json();
  }

  return { queryTrainly, uploadFile, getUserProfile };
}
```

### Using in a React Component:

```typescript
// components/TrainlyChat.tsx
import { useState } from 'react';
import { useTrainlyV1 } from '../hooks/useTrainlyV1';

export function TrainlyChat() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const { queryTrainly, uploadFile } = useTrainlyV1();

  async function handleQuery() {
    setLoading(true);
    try {
      const result = await queryTrainly([
        { role: 'user', content: message }
      ]);

      setResponse(result.answer);
      console.log('User has permanent chat:', result.chat_id);
      console.log('Privacy guarantee:', result.privacy_guarantee);
    } catch (error) {
      console.error('Query failed:', error);
      setResponse('Error: ' + error.message);
    }
    setLoading(false);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      console.log('File uploaded to permanent subchat:', result.chat_id);
      alert(`File uploaded successfully: ${result.filename}`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    }
  }

  return (
    <div>
      <h2>Trainly V1 Chat</h2>

      {/* File Upload */}
      <div>
        <input type="file" onChange={handleFileUpload} />
      </div>

      {/* Query Interface */}
      <div>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a question..."
        />
        <button onClick={handleQuery} disabled={loading}>
          {loading ? 'Querying...' : 'Ask Trainly'}
        </button>
      </div>

      {/* Response */}
      {response && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5' }}>
          <strong>Trainly Response:</strong>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
```

## 🧪 Step 6: Test the Integration

1. **User logs into your app** with your OAuth (Clerk/Auth0/etc.)
2. **Upload a file** - it gets stored in their permanent subchat
3. **Ask questions** - Trainly responds using only their private files
4. **Same user, same subchat** - data persists across sessions

## 🔒 Security Features Active

✅ **JWT Validation**: Full OIDC compliance with JWKS verification
✅ **Permanent Subchats**: Each user gets consistent, isolated storage
✅ **Developer Privacy**: You never see user files or raw queries
✅ **Token Security**: Automatic signature verification and expiration checks
✅ **Key Rotation**: JWKS cache handles OAuth provider key rotations

## 📊 Monitoring Your App

Check your app's usage:

```bash
# Get aggregated metrics (no individual user data)
curl -X GET "http://localhost:8000/v1/apps/your_app_id/metrics" \
  -H "X-App-Secret: your_app_secret_from_registration"
```

## 🚨 Troubleshooting

### Common Issues:

1. **"App not configured for V1 auth"**
   - Make sure you registered your app (Step 4)
   - Check the `app_id` matches what you're sending in `X-App-ID` header

2. **"Invalid token" errors**
   - Verify your `issuer` URL is correct in app registration
   - Check `allowed_audiences` matches your OAuth client ID
   - Ensure user is actually logged in to your OAuth provider

3. **"Key with kid 'xxx' not found"**
   - OAuth provider rotated keys - this is normal, Trainly will auto-refresh
   - If persistent, check your `issuer` URL has a valid `.well-known/openid-configuration`

4. **CORS errors**
   - Add your domain to CORS origins in `read_files.py`
   - For development, `localhost:3000` should work

## 🎯 What You Get

- **Permanent User Data**: Files persist across sessions in user's private subchat
- **Complete Privacy**: Developer cannot access user files or queries
- **Any OAuth Provider**: Works with Clerk, Auth0, Cognito, Firebase, custom OIDC
- **Production Ready**: Full security, caching, error handling included
- **Simple Integration**: Standard HTTP requests, no complex SDK needed

## 🚀 Production Deployment

When deploying to production:

1. **Update environment variables** with production OAuth URLs
2. **Use secure admin tokens** for console access
3. **Configure CORS** for your production domains
4. **Set up monitoring** for the V1 endpoints
5. **Test with real OAuth tokens** from your production OAuth provider

---

**That's it!** 🎉 Your Trainly instance now supports V1 Trusted Issuer authentication with permanent user subchats and complete privacy protection.
