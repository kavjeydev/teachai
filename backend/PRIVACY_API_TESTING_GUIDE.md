# 🔒 Privacy-First API Testing Guide

## Quick Start Testing

### 1. Start the Backend Server

```bash
cd backend
source myenv/bin/activate
python read_files.py
```

You should see:

```
🚀 Starting TeachAI GraphRAG API with Privacy-First Architecture...
🔒 Privacy-First API endpoints:
   POST /v1/privacy/apps/users/provision   (Create user sub-chat)
   POST /v1/privacy/query                 (Query user data - AI only)
   POST /v1/privacy/upload/presigned-url  (Direct uploads)
   GET  /v1/privacy/health                (Privacy API status)
🛡️  Privacy Guarantee: Developers cannot access raw user files or data
```

### 2. Run Automated Tests

```bash
cd backend
python test_privacy_api.py
```

### 3. Manual Testing with curl

#### Test 1: Health Check

```bash
curl -X GET http://localhost:8000/v1/privacy/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "privacy_model": "Complete data isolation - developers cannot access user files or raw data",
  "capabilities": {
    "allowed": ["ask", "upload"],
    "blocked": ["list_files", "download_file", "read_raw_data"]
  }
}
```

#### Test 2: Provision a User (Creates Private Sub-Chat)

```bash
curl -X POST http://localhost:8000/v1/privacy/apps/users/provision \
  -H "Authorization: Bearer as_demo_123_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "end_user_id": "user_alice",
    "capabilities": ["ask", "upload"]
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "end_user_id": "user_alice",
  "scoped_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "capabilities": ["ask", "upload"],
  "is_new_user": true,
  "privacy_guarantee": "This user's data is completely isolated - you cannot access their files or raw data"
}
```

**🔑 Copy the `scoped_token` for the next tests!**

#### Test 3: Query User's Private Data (AI Responses Only)

```bash
curl -X POST http://localhost:8000/v1/privacy/query \
  -H "x-scoped-token: YOUR_SCOPED_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "end_user_id": "user_alice",
    "question": "What can you tell me about my uploaded documents?",
    "include_citations": true
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "answer": "I don't have any information in user user_alice's private chat to answer that question.",
  "end_user_id": "user_alice",
  "privacy_note": "This response contains only AI-generated content based on the user's private data"
}
```

#### Test 4: Test Cross-User Access Prevention 🔒

```bash
# First, provision another user
curl -X POST http://localhost:8000/v1/privacy/apps/users/provision \
  -H "Authorization: Bearer as_demo_123_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "end_user_id": "user_bob",
    "capabilities": ["ask", "upload"]
  }'

# Then try to use user_alice's token to access user_bob's data
curl -X POST http://localhost:8000/v1/privacy/query \
  -H "x-scoped-token: ALICE_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "end_user_id": "user_bob",
    "question": "What files did this user upload?"
  }'
```

**Expected Response (403 Forbidden):**

```json
{
  "detail": "User ID mismatch"
}
```

**✅ This proves users cannot access each other's data!**

#### Test 5: Test Dangerous Capabilities Blocking 🛡️

```bash
curl -X POST http://localhost:8000/v1/privacy/apps/users/provision \
  -H "Authorization: Bearer as_demo_123_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "end_user_id": "user_hacker",
    "capabilities": ["ask", "upload", "list_files", "download_file"]
  }'
```

**Expected Response (400 Bad Request):**

```json
{
  "detail": "Invalid capabilities: ['list_files', 'download_file']. Only 'ask' and 'upload' are allowed."
}
```

**✅ This proves raw file access capabilities are blocked!**

#### Test 6: Test XSS Protection 🔒

```bash
curl -X POST http://localhost:8000/v1/privacy/query \
  -H "x-scoped-token: YOUR_SCOPED_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "end_user_id": "user_alice",
    "question": "<script>alert(\"XSS\")</script>What files did I upload?"
  }'
```

**Expected Response (400 Bad Request):**

```json
{
  "detail": "Invalid or potentially malicious question"
}
```

**✅ This proves XSS protection is working!**

## 🧪 Advanced Testing Scenarios

### Scenario 1: Multi-User App Testing

```bash
# Test script that provisions multiple users and verifies isolation
for user in alice bob charlie; do
  echo "Provisioning user: $user"
  curl -X POST http://localhost:8000/v1/privacy/apps/users/provision \
    -H "Authorization: Bearer as_demo_123_secret" \
    -H "Content-Type: application/json" \
    -d "{\"end_user_id\": \"user_$user\", \"capabilities\": [\"ask\", \"upload\"]}"
  echo -e "\n"
done
```

### Scenario 2: Token Expiry Testing

```bash
# Generate a token and wait 16 minutes (tokens expire in 15 minutes)
# Then try to use it - should fail with "Token expired"
```

### Scenario 3: App Secret vs Scoped Token Testing

```bash
# Try to use app secret for user queries (should fail)
curl -X POST http://localhost:8000/v1/privacy/query \
  -H "Authorization: Bearer as_demo_123_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "end_user_id": "user_alice",
    "question": "What files did I upload?"
  }'
# Expected: 401 Unauthorized (missing scoped token)
```

## 🎯 Testing Checklist

### ✅ Privacy Guarantees

- [ ] Users get isolated sub-chats
- [ ] Cross-user data access is blocked
- [ ] Developers cannot list/download raw files
- [ ] Only AI responses are returned
- [ ] Audit logging works

### ✅ Security Features

- [ ] XSS protection blocks malicious input
- [ ] Dangerous capabilities are rejected
- [ ] Token expiry is enforced
- [ ] Input sanitization works
- [ ] Proper authentication required

### ✅ API Functionality

- [ ] User provisioning works
- [ ] Scoped queries return results
- [ ] Error handling is appropriate
- [ ] Response format is consistent
- [ ] Documentation is accessible

## 🚨 Expected Test Results

### ✅ Success Indicators

- User provisioning returns scoped tokens
- Queries return AI responses (not raw data)
- Cross-user access is blocked (403 errors)
- Dangerous capabilities are rejected (400 errors)
- XSS attempts are blocked (400 errors)

### ❌ Failure Indicators (Critical Issues)

- Users can access other users' data
- Raw file listing/downloading is possible
- Dangerous capabilities are granted
- XSS attacks succeed
- No audit logging occurs

## 🔧 Troubleshooting

### Common Issues

**"Cannot connect to API"**

- Solution: Make sure backend server is running on port 8000

**"Invalid app secret format"**

- Solution: Use a properly formatted app secret (starts with "as\_")

**"Missing scoped token"**

- Solution: Provision a user first to get a scoped token

**"Token expired"**

- Solution: Provision the user again to get a fresh token

### Debug Mode

Add this to your environment to see detailed logs:

```bash
export JWT_SECRET_KEY="your-secret-key"
export LOG_LEVEL="DEBUG"
```

## 🎉 Success Criteria

Your privacy-first API is working correctly if:

1. **✅ Data Isolation**: Users cannot access each other's data
2. **✅ Capability Limits**: Developers cannot list/download raw files
3. **✅ XSS Protection**: Malicious input is blocked
4. **✅ Audit Logging**: All access attempts are recorded
5. **✅ Token Security**: Scoped tokens work and expire properly

When all tests pass, you have a **production-ready privacy-first API** that ensures developers can build powerful apps while users maintain complete control over their data!

## 🚀 Next Steps After Testing

1. **Deploy to production** with proper secrets management
2. **Create developer documentation** for the new API
3. **Build user consent flows** for app authorization
4. **Add real file upload integration** with presigned URLs
5. **Monitor audit logs** for any suspicious activity
