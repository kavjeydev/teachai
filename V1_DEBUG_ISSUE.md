# V1 Authentication Debug Issue

## 🐛 **Problem Identified**

The V1 endpoints are partially working:

- ✅ `/v1/health` works (returns 200)
- ❌ `/v1/me/profile` returns 404
- ❌ `/v1/console/apps/register` returns 404

This suggests there's an error in the V1 endpoint definitions that prevents some routes from being registered.

## 🔍 **Likely Causes**

1. **Import Error**: The V1 authentication functions (`authenticate_v1_user`) have dependency issues
2. **JWT Library**: PyJWT might not be working properly in the virtual environment
3. **Function Definition Error**: There might be an error in the V1 auth functions that prevents endpoint registration

## 🚀 **Quick Fix: Simplified V1 Implementation**

Since the complex JWT validation is causing issues, let's create a simplified V1 version that works for testing:

### **Step 1: Test with Simplified Auth**

Replace the complex V1 auth with a simple version for testing:

```python
# Simplified V1 auth for testing (add to read_files.py)
async def authenticate_v1_user_simple(authorization: str, app_id: str) -> Dict[str, str]:
    """Simplified V1 authentication for testing"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token = authorization[7:]  # Remove "Bearer " prefix

    # For testing: extract user info from token without full JWT validation
    # In production, this would do full OIDC validation
    try:
        # Simple token parsing for testing
        import base64
        import json

        # Decode JWT payload (without signature verification for testing)
        parts = token.split('.')
        if len(parts) != 3:
            raise HTTPException(status_code=401, detail="Invalid token format")

        # Decode payload
        payload = parts[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload)
        claims = json.loads(decoded)

        external_user_id = claims.get('sub') or claims.get('user_id') or 'test_user'

        # Generate deterministic IDs
        import hashlib
        user_id_input = f"{app_id}::{external_user_id}"
        user_id = f"user_v1_{hashlib.sha256(user_id_input.encode()).hexdigest()[:16]}"
        chat_id = f"chat_v1_{hashlib.sha256(user_id_input.encode()).hexdigest()[:16]}"

        return {
            "app_id": app_id,
            "external_user_id": external_user_id,
            "user_id": user_id,
            "chat_id": chat_id,
            "iss": claims.get('iss', 'test_issuer'),
            "aud": claims.get('aud', 'test_audience')
        }

    except Exception as e:
        logger.error(f"Token parsing failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
```

### **Step 2: Replace authenticate_v1_user calls**

Replace all calls to `authenticate_v1_user` with `authenticate_v1_user_simple` temporarily.

### **Step 3: Test with Real Clerk Token**

Once the simplified version works, you can get a real Clerk token and test:

```javascript
// In your frontend console
const token = await window.Clerk.session.getToken();
console.log("Clerk token:", token);

// Then test the endpoint
fetch("/v1/me/profile", {
  headers: {
    Authorization: `Bearer ${token}`,
    "X-App-ID": "test_app",
  },
})
  .then((r) => r.json())
  .then(console.log);
```

## 🔧 **Clerk Configuration Check**

Make sure your Clerk setup has:

1. **JWT Template**: Configured to issue JWT tokens (not opaque tokens)
2. **Audience**: Set correctly in your Clerk dashboard
3. **Issuer URL**: Should be `https://your-domain.clerk.accounts.dev`
4. **Algorithm**: Should be RS256

The issue is likely that the complex JWT validation is preventing the endpoints from being registered. Let's start with the simplified version and then add back the full validation once it's working!
