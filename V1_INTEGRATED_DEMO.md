# V1 Trusted Issuer - Integrated Demo

## ✅ **Exactly What You Wanted**

The V1 Trusted Issuer authentication is now **fully integrated into `read_files.py`** and works exactly as you described:

1. **Developer builds app with any OAuth** (Clerk, Auth0, Cognito, custom)
2. **User logs into developer's app** → gets ID token from OAuth provider
3. **Client sends ID token to Trainly** as Bearer authorization
4. **Trainly validates the token** against the registered app config
5. **Creates permanent subchat** for that user automatically
6. **Completely secure** - user data is isolated and permanent

## 🚀 **How to Use**

### Step 1: Register Your App (One-time setup)

```bash
curl -X POST "http://localhost:8000/v1/console/apps/register" \
  -H "X-Admin-Token: admin_dev_token_123" \
  -F "app_name=My Awesome App" \
  -F "issuer=https://clerk.myapp.com" \
  -F 'allowed_audiences=["my-clerk-frontend-api"]' \
  -F 'alg_allowlist=["RS256"]'
```

Response includes your `app_id` which you'll use in client requests.

### Step 2: Client Integration

```javascript
// Your existing OAuth flow (Clerk example)
import { useAuth } from "@clerk/nextjs";

export function useTrainlyV1() {
  const { getToken } = useAuth();

  async function queryWithV1(messages) {
    // Get ID token from your OAuth provider
    const idToken = await getToken();

    // Send directly to Trainly V1 endpoint
    const response = await fetch("/v1/me/chats/query", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`, // User's OAuth ID token
        "X-App-ID": "your_app_id_from_registration",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        messages: JSON.stringify(messages),
        response_tokens: "150",
      }),
    });

    return response.json();
  }

  async function uploadWithV1(file) {
    const idToken = await getToken();

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/v1/me/chats/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "X-App-ID": "your_app_id_from_registration",
      },
      body: formData,
    });

    return response.json();
  }

  return { queryWithV1, uploadWithV1 };
}
```

## 🔒 **Security & Privacy**

### What Happens Behind the Scenes:

1. **Token Validation**: Trainly fetches your OAuth provider's JWKS and validates the ID token signature, issuer, audience, and expiration
2. **User Identity**: Extracts `sub` (user ID) from the token and creates a deterministic permanent user ID
3. **Permanent Subchat**: Creates a subchat that's always the same for this user + app combination
4. **Data Isolation**: All files and queries are stored in the user's permanent subchat - completely isolated
5. **Developer Privacy**: Developer never sees the ID token contents, user files, or raw queries

### Security Features:

- ✅ **JWT Signature Verification** with JWKS key rotation support
- ✅ **Algorithm Allowlist** (rejects `none`, validates `RS256`, `ES256`, etc.)
- ✅ **Issuer & Audience Validation** against your registered app config
- ✅ **Clock Skew Tolerance** (5 minutes)
- ✅ **Automatic JWKS Caching** (1 hour TTL with refresh on key miss)

## 🎯 **Key Benefits**

1. **Permanent User Data**: Each user gets the same subchat every time - truly persistent
2. **Any OAuth Provider**: Works with Clerk, Auth0, Cognito, Firebase Auth, custom OIDC
3. **Zero Developer File Access**: Developer cannot see user files or queries, only AI responses
4. **Integrated**: Everything in one `read_files.py` file - no separate services
5. **Production Ready**: Full JWT validation, caching, error handling

## 📋 **Available Endpoints**

### Console (Admin - one-time setup):

- `POST /v1/console/apps/register` - Register your OAuth app

### User APIs (Bearer ID Token):

- `POST /v1/me/chats/query` - User queries their permanent subchat
- `POST /v1/me/chats/files/upload` - User uploads files to permanent subchat
- `GET /v1/me/profile` - Get user profile and subchat info

## 🧪 **Test the Flow**

1. **Start the server**: `python read_files.py`
2. **Register your app** with the console endpoint
3. **Get an ID token** from your OAuth provider
4. **Make requests** to `/v1/me/*` endpoints with the ID token

## 🔄 **Workflow Summary**

```
User's Device                    Developer App                     Trainly
     |                              |                               |
     |-- Logs in with OAuth ------->|                               |
     |<-- ID Token ------------------|                               |
     |                              |                               |
     |-- API Request with ID Token ----------------------->|         |
     |                              |                      |         |
     |                              |              Validates Token   |
     |                              |              Creates Subchat   |
     |                              |              Processes Request |
     |                              |                      |         |
     |<-- AI Response -----------------------------------|         |
     |                              |                               |
```

**Perfect!** ✨ The V1 system is now exactly what you wanted - fully integrated, secure, and creating permanent subchats for users based on their OAuth tokens.
