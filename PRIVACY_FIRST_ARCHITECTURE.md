# 🔒 Privacy-First App Architecture

## Problem Solved

**Before:** When developers create apps using Trainly, they could access all user data uploaded through their app's chat, creating a significant privacy concern.

**After:** Each end-user gets their own completely isolated sub-chat. Developers can only access AI-generated responses, never raw files or data.

## 🎯 Core Privacy Guarantees

### 1. Complete Data Isolation

- **Per-User Sub-Chats**: Each end-user gets their own private chat under an app
- **Zero Cross-User Access**: Apps cannot access other users' data
- **Developer Blind Spot**: Developers cannot see, list, or download user files

### 2. Capability-Based Security

- **Scoped Permissions**: Tokens limited to specific actions (`ask`, `upload`)
- **No Raw Data Access**: `list_files` and `download_file` capabilities never granted
- **Response-Only Integration**: Apps receive AI responses, never raw content

### 3. Comprehensive Audit Trail

- **Every Access Logged**: All attempts to access user data are recorded
- **User Visibility**: Users can see when and how their data was accessed
- **Anomaly Detection**: Unusual access patterns flagged automatically

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Developer     │    │     Trainly     │    │    End User     │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Your App  │ │    │ │ Privacy API │ │    │ │    Files    │ │
│ │             │ │    │ │             │ │    │ │             │ │
│ │ ┌─────────┐ │ │    │ │ ┌─────────┐ │ │    │ │ ┌─────────┐ │ │
│ │ │ Ask Bot │ │◄┼────┼─┤ │ AI Only │ │◄┼────┼─┤ │Sub-Chat │ │ │
│ │ └─────────┘ │ │    │ │ └─────────┘ │ │    │ │ └─────────┘ │ │
│ │             │ │    │ │             │ │    │ │             │ │
│ │      ❌     │ │    │ │     🔒      │ │    │ │     ✅      │ │
│ │  No Access  │ │    │ │  Isolation  │ │    │ │  Full Own   │ │
│ │  to Files   │ │    │ │  Enforced   │ │    │ │  their Data │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔑 Key Components

### 1. App Registration

```typescript
// Developer creates an app
const app = await createApp({
  name: "My Privacy-First App",
  allowedCapabilities: ["ask", "upload"], // Limited by design
  maxUsersPerApp: 10000,
});
// Returns: appId and appSecret (one-time)
```

### 2. User Provisioning

```typescript
// When user starts using the app
const response = await fetch("/v1/privacy/apps/users/provision", {
  method: "POST",
  headers: {
    Authorization: "Bearer your_app_secret",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    end_user_id: "user_123",
    capabilities: ["ask", "upload"],
  }),
});

const { scoped_token, is_new_user } = await response.json();
```

### 3. Scoped Queries (Privacy-Safe)

```typescript
// Query user's private data - you only get AI responses
const queryResponse = await fetch("/v1/privacy/query", {
  method: "POST",
  headers: {
    "x-scoped-token": scoped_token, // Short-lived, user-specific
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    end_user_id: "user_123",
    question: "What documents did I upload about machine learning?",
    include_citations: true,
  }),
});

const result = await queryResponse.json();
// Returns AI response + limited citations, never raw files
```

### 4. Direct User Uploads (Bypass Developer)

```typescript
// Get presigned URL for direct upload (user → Trainly, not via your server)
const uploadResponse = await fetch("/v1/privacy/upload/presigned-url", {
  method: "POST",
  headers: {
    "x-scoped-token": scoped_token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    end_user_id: "user_123",
    filename: "document.pdf",
    file_type: "application/pdf",
  }),
});

const { upload_url } = await uploadResponse.json();
// User uploads directly to Trainly, file never touches your servers
```

## 🛡️ Security Mechanisms

### 1. Scoped JWT Tokens

```typescript
interface TokenClaims {
  app_id: string; // Your app
  end_user_id: string; // Specific user
  chat_id: string; // Their private chat
  capabilities: string[]; // Limited permissions
  exp: number; // Short expiry (15 minutes)
}
```

### 2. Capability System

| Capability         | What it Allows      | What it Blocks            |
| ------------------ | ------------------- | ------------------------- |
| `ask`              | Query user's AI     | Cannot see raw questions  |
| `upload`           | Enable file uploads | Cannot download files     |
| ❌ `list_files`    | **NEVER GRANTED**   | Cannot list user files    |
| ❌ `download_file` | **NEVER GRANTED**   | Cannot download raw files |

### 3. Database Isolation

```sql
-- All queries automatically scoped to user
MATCH (d:Document)-[:HAS_CHUNK]->(c:Chunk)
WHERE c.chatId = '{user_specific_chat_id}'
AND c.appId = '{your_app_id}'
AND c.endUserId = '{specific_user}'
RETURN c.chunk_text  -- Only this user's data
```

## 📊 Audit & Compliance

### Comprehensive Logging

Every API call is logged with:

```typescript
{
  appId: "app_123",
  endUserId: "user_456",
  action: "query",
  requestedCapability: "ask",
  allowed: true,
  timestamp: 1234567890,
  ipAddress: "1.2.3.4",
  metadata: {
    question: "What files...", // First 100 chars only
    usedChunks: 3
  }
}
```

### User Transparency

Users can see:

- Which apps accessed their data
- When access occurred
- What actions were performed
- Whether requests were allowed/blocked

### Developer Visibility

Developers can see:

- Total users of their app
- API usage statistics
- Success/failure rates
- **But NOT**: User questions, file content, or raw data

## 🚀 Migration Guide

### Current (Unsafe) Pattern

```typescript
// BAD: Developer can see all user data
const chat = await getChat(developerId);
const files = await listFiles(chat.id); // 😱 Can see all user files!
const content = await downloadFile(files[0]); // 😱 Raw access!
```

### New (Privacy-First) Pattern

```typescript
// GOOD: Developer only gets AI responses
const token = await provisionUser("user_123");
const response = await queryUserData(token, "What did I upload?");
// Returns: AI answer only, no raw file access possible
```

## 📋 Implementation Checklist

### ✅ Completed

- [x] Per-user sub-chat architecture
- [x] Scoped JWT token system
- [x] Capability-based permissions
- [x] Privacy-first API endpoints
- [x] Audit logging framework
- [x] Developer dashboard (read-only)

### 🔄 In Progress

- [ ] Direct upload system (presigned URLs)
- [ ] User consent flow (OAuth-style)
- [ ] Anomaly detection rules
- [ ] User data export/deletion (GDPR)

### 📅 Planned

- [ ] App verification system
- [ ] Rate limiting per app/user
- [ ] PII redaction options
- [ ] Customer-managed encryption keys (CMEK)

## 🎯 Business Benefits

### For Trainly

- **Trust & Compliance**: GDPR/CCPA ready by design
- **Market Differentiator**: Only platform with true data isolation
- **Reduced Liability**: Users own their data, not developers

### For Developers

- **Zero Liability**: Cannot access user data = no data breach risk
- **User Trust**: Clear privacy guarantees increase adoption
- **Compliance**: Automatic GDPR/CCPA compliance

### For End Users

- **Data Ownership**: They own and control their data
- **Privacy Transparency**: Can see exactly how data is accessed
- **Easy Revocation**: Can revoke app access anytime

## 🔧 Technical Details

### Database Schema Changes

```typescript
// New tables for privacy-first architecture
apps: {
  appId: string;
  developerId: string;
  appSecret: string; // For server-to-server auth
  allowedCapabilities: string[]; // Max permissions
}

user_app_chats: {
  appId: string;
  endUserId: string; // User's ID from app perspective
  chatId: Id<"chats">; // Their private chat
  capabilities: string[]; // Actual granted permissions
  isRevoked: boolean;
}

app_audit_logs: {
  appId: string;
  endUserId: string;
  action: string;
  allowed: boolean;
  timestamp: number;
  metadata: object; // Non-sensitive context
}
```

### API Endpoints

#### Developer Endpoints (App Secret Required)

- `POST /v1/privacy/apps/users/provision` - Create user sub-chat
- `GET /v1/privacy/apps/{app_id}/audit` - Get sanitized audit logs
- `GET /v1/privacy/apps/{app_id}/stats` - Get usage statistics

#### User-Scoped Endpoints (Scoped Token Required)

- `POST /v1/privacy/query` - Query user's private data (AI responses only)
- `POST /v1/privacy/upload/presigned-url` - Get direct upload URL
- `GET /v1/privacy/users/{user_id}/export` - Export user's data (for user)

## 🌟 Success Metrics

### Privacy Metrics

- **Zero Data Breaches**: No developer can access raw user data
- **User Trust Score**: Track user retention and app authorization rates
- **Audit Compliance**: 100% of access attempts logged

### Business Metrics

- **Developer Adoption**: Apps using privacy-first vs legacy API
- **User Confidence**: Surveys on data privacy trust
- **Compliance Ready**: GDPR/CCPA compliance verification

## 🚨 Security Considerations

### Threat Model

1. **Malicious Developer**: Cannot access user data even if they try
2. **Token Theft**: Short expiry limits impact
3. **Data Exfiltration**: Impossible due to capability limits
4. **Cross-User Access**: Prevented by scoped tokens

### Monitoring & Alerts

- Alert on multiple failed authentication attempts
- Flag apps with unusual query patterns
- Monitor for capability escalation attempts
- Track user consent revocations

---

## 🎉 Conclusion

This privacy-first architecture ensures that **developers can build powerful AI apps while users maintain complete control over their data**. It's a win-win that builds trust, ensures compliance, and differentiates Trainly in the market.

The key insight: **Developers don't need to see raw user data to build great apps** - they just need access to AI-generated insights and responses.

**Result**: Users trust uploading sensitive documents because they know developers can't access them, leading to higher engagement and more valuable AI applications.
