# V1 Trusted Issuer Authentication Setup Guide

This guide walks you through setting up the V1 "Trusted Issuer" authentication system for Trainly, where user ID tokens from your OAuth provider are accepted directly.

## 🔧 Setup Overview

The V1 system allows your users to authenticate directly with Trainly using ID tokens from your existing OAuth provider (Clerk, Auth0, Cognito, etc.), while ensuring complete data isolation and privacy.

## 1. Console Setup (Developer Registration)

### Register Your App

First, register your application with Trainly console:

```bash
# Set admin token (in production, this would be properly secured)
export TRAINLY_CONSOLE_ADMIN_TOKEN="admin_dev_token_123"

# Register your app
curl -X POST "http://localhost:8000/v1/console/apps/register" \
  -H "X-Admin-Token: $TRAINLY_CONSOLE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "My Awesome App",
    "issuer": "https://clerk.myapp.com",
    "allowed_audiences": ["my-clerk-frontend-api"],
    "alg_allowlist": ["RS256"],
    "max_token_age": 3600
  }'
```

Response:

```json
{
  "app_id": "app_abc123def456",
  "app_secret": "trainly_secret_xyz789...",
  "app_name": "My Awesome App",
  "issuer": "https://clerk.myapp.com",
  "allowed_audiences": ["my-clerk-frontend-api"],
  "alg_allowlist": ["RS256"],
  "max_token_age": 3600,
  "created_at": "2025-09-27T...",
  "setup_instructions": {
    "client_integration": {
      "description": "How to use this configuration in your client app",
      "steps": [
        "1. User logs into your app with OAuth (get ID token)",
        "2. Client calls Trainly APIs with: Authorization: Bearer <ID_TOKEN>",
        "3. Include app_id in requests or use domain binding"
      ]
    },
    "example_request": {
      "url": "POST https://api.trainly.com/me/chats/query",
      "headers": {
        "Authorization": "Bearer <USER_ID_TOKEN_FROM_YOUR_OAUTH>",
        "Content-Type": "application/json",
        "X-App-ID": "app_abc123def456"
      },
      "body": {
        "messages": [{ "role": "user", "content": "What files do I have?" }],
        "response_tokens": 150
      }
    }
  }
}
```

### Save Your Credentials

Store these securely:

- `app_id`: Include in client requests or use domain binding
- `app_secret`: Use only for server-to-server admin operations

## 2. Client Integration

### Frontend Implementation

```typescript
// Your existing OAuth flow (Clerk example)
import { useAuth } from "@clerk/nextjs";

export function useTrainlyAuth() {
  const { getToken } = useAuth();

  async function queryTrainly(
    messages: Array<{ role: string; content: string }>,
  ) {
    // Get ID token from your OAuth provider
    const idToken = await getToken();

    // Call Trainly directly with user's ID token
    const response = await fetch("https://api.trainly.com/v1/me/chats/query", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
        "X-App-ID": "app_abc123def456", // Your app ID
      },
      body: JSON.stringify({
        messages,
        response_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    return response.json();
  }

  async function uploadFile(file: File) {
    const idToken = await getToken();

    // Get presigned upload URL
    const presignResponse = await fetch(
      "https://api.trainly.com/v1/me/chats/files/presign",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
          "X-App-ID": "app_abc123def456",
        },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
        }),
      },
    );

    const { file_id, upload_url } = await presignResponse.json();

    // Upload file content
    const uploadResponse = await fetch(upload_url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "X-App-ID": "app_abc123def456",
      },
      body: file,
    });

    return { file_id, success: uploadResponse.ok };
  }

  return { queryTrainly, uploadFile };
}
```

### Backend Server Operations (Optional)

Use your app secret for server-side operations like metrics:

```typescript
// server-side only
export async function getAppMetrics() {
  const response = await fetch(
    "https://api.trainly.com/v1/apps/app_abc123def456/metrics",
    {
      headers: {
        "X-App-Secret": process.env.TRAINLY_APP_SECRET,
      },
    },
  );

  return response.json();
}
```

## 3. User Flow

1. **User logs into your app** using your OAuth provider (Clerk, Auth0, etc.)
2. **Your app obtains an ID token** from the OAuth provider
3. **Client calls Trainly APIs directly** using the ID token as Bearer authorization
4. **Trainly validates the token** against your registered OIDC configuration
5. **User data is isolated** in their private namespace automatically
6. **Responses contain only AI-generated content** - no raw file access for developers

## 4. API Endpoints

### User APIs (`/v1/me/*`)

All user APIs require `Authorization: Bearer <ID_TOKEN>` and `X-App-ID` header.

#### Upload Files

```bash
# Get presigned upload URL
curl -X POST "https://api.trainly.com/v1/me/chats/files/presign" \
  -H "Authorization: Bearer $USER_ID_TOKEN" \
  -H "X-App-ID: app_abc123def456" \
  -H "Content-Type: application/json" \
  -d '{"filename": "document.pdf"}'

# Upload file content
curl -X POST "https://api.trainly.com/v1/me/chats/files/file_xyz123/upload" \
  -H "Authorization: Bearer $USER_ID_TOKEN" \
  -H "X-App-ID: app_abc123def456" \
  -F "file=@document.pdf"
```

#### Query Chat

```bash
curl -X POST "https://api.trainly.com/v1/me/chats/query" \
  -H "Authorization: Bearer $USER_ID_TOKEN" \
  -H "X-App-ID: app_abc123def456" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What does my uploaded document say about privacy?"}
    ],
    "response_tokens": 200
  }'
```

#### List Files

```bash
curl -X GET "https://api.trainly.com/v1/me/chats/files" \
  -H "Authorization: Bearer $USER_ID_TOKEN" \
  -H "X-App-ID: app_abc123def456"
```

### Developer APIs (`/v1/apps/*`)

Developer APIs require your app secret for server-to-server authentication.

#### Get Metrics

```bash
curl -X GET "https://api.trainly.com/v1/apps/app_abc123def456/metrics" \
  -H "X-App-Secret: $TRAINLY_APP_SECRET"
```

#### Get Usage Stats

```bash
curl -X GET "https://api.trainly.com/v1/apps/app_abc123def456/usage?period=7d" \
  -H "X-App-Secret: $TRAINLY_APP_SECRET"
```

## 5. Security Features

### Built-in Protection

- **JWT Verification**: Full OIDC validation with JWKS caching and key rotation
- **Algorithm Allowlist**: Only secure algorithms (RS256, ES256, etc.)
- **Rate Limiting**: Per-user and per-app limits
- **Abuse Detection**: Monitors for suspicious patterns
- **Audit Logging**: Immutable logs for compliance

### Data Isolation

- **Storage Prefixes**: `apps/{app_id}/users/{user_id}/`
- **Vector Namespaces**: `{app_id}::{user_id}`
- **Graph Filters**: Automatic WHERE clauses for user isolation
- **Zero Cross-User Access**: Impossible by design

### Privacy Guarantees

- **User-Controlled**: Users own their data and tokens
- **Developer Cannot See**: No access to raw files or queries
- **Revocable**: Users can delete all data anytime
- **Audit Trail**: Complete request logging (no content)

## 6. Testing Your Integration

### 1. Test Authentication

```bash
# This should fail with invalid token
curl -X POST "https://api.trainly.com/v1/me/chats/query" \
  -H "Authorization: Bearer invalid_token" \
  -H "X-App-ID: app_abc123def456"
```

### 2. Test Rate Limits

```bash
# Send 35 requests rapidly (should hit 30/minute limit)
for i in {1..35}; do
  curl -X POST "https://api.trainly.com/v1/me/chats/query" \
    -H "Authorization: Bearer $VALID_ID_TOKEN" \
    -H "X-App-ID: app_abc123def456" \
    -d '{"messages":[{"role":"user","content":"test"}]}'
done
```

### 3. Test Cross-User Isolation

Upload files with different user tokens and verify users can't access each other's data.

## 7. Environment Variables

Set these in your environment:

```bash
# Required for console admin access
export TRAINLY_CONSOLE_ADMIN_TOKEN="your_secure_admin_token"

# Your app credentials (from registration)
export TRAINLY_APP_ID="app_abc123def456"
export TRAINLY_APP_SECRET="trainly_secret_xyz789..."

# Optional: Custom OIDC configurations
export CLERK_ISSUER="https://clerk.myapp.com"
export CLERK_AUDIENCE="my-clerk-frontend-api"
```

## 8. Production Checklist

- [ ] Register production domains with Trainly
- [ ] Configure CORS origins properly
- [ ] Set up monitoring for rate limits and errors
- [ ] Implement token refresh in your client
- [ ] Set up audit log retention policies
- [ ] Configure backup for user data
- [ ] Test disaster recovery procedures
- [ ] Set up cost monitoring and alerts

## 9. Support and Troubleshooting

### Common Issues

1. **"Invalid token" errors**: Check issuer URL and audience configuration
2. **Rate limit exceeded**: Implement exponential backoff in client
3. **CORS errors**: Verify domain registration and CORS settings
4. **File upload failures**: Check file size limits (100MB max)

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=DEBUG
python -m uvicorn read_files:app --reload
```

### Get Help

- Check app health: `GET /v1/apps/{app_id}/health`
- View audit logs: Available through developer console
- Contact support: Include app_id and timestamp for faster resolution

## 10. Migration and Updates

When updating your OAuth provider configuration:

1. Update via console API:

```bash
curl -X PUT "https://api.trainly.com/v1/console/apps/app_abc123def456" \
  -H "X-Admin-Token: $TRAINLY_CONSOLE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"issuer": "https://new-issuer.com"}'
```

2. Test with new configuration
3. Update client applications
4. Monitor for any authentication errors

---

This V1 implementation provides immediate privacy-first authentication while maintaining a clear path to V2 token exchange features.
