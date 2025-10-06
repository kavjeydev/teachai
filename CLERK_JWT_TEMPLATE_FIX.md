# 🔐 Clerk JWT Template Configuration for Convex

## The Real Problem

The error `"No auth provider found matching the given token"` is happening because **Clerk's JWT template is not configured correctly for Convex**.

Even if your domain is correct in `auth.config.js`, Convex also requires:

1. ✅ The JWT **audience (`aud`)** claim must be set to `"convex"`
2. ✅ The JWT **issuer (`iss`)** must match your auth.config.js domain

---

## 🛠️ Fix: Configure Clerk JWT Template

### Step 1: Access Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. **Select your PRODUCTION application** (not development)
3. In the left sidebar, find **"JWT Templates"** under the Configure section

### Step 2: Create or Edit Convex JWT Template

**Option A: Create New Template (if none exists)**

1. Click **"+ New template"**
2. Select **"Convex"** from the template list (Clerk has a preset for this!)
3. Click **"Create"**

**Option B: Edit Existing Template**

1. Look for a template named "Convex" or similar
2. Click to edit it

### Step 3: Verify/Set Template Configuration

Make sure your JWT template has these key settings:

**Template Name:** `convex` (or any name you prefer)

**Claims:**

```json
{
  "aud": "convex",
  "iss": "{{ org.issuer }}",
  "sub": "{{ user.id }}",
  "iat": {{ date.now }},
  "exp": {{ date.now_plus_3600 }},
  "email": "{{ user.primary_email_address }}",
  "name": "{{ user.full_name }}",
  "given_name": "{{ user.first_name }}",
  "family_name": "{{ user.last_name }}"
}
```

**⚠️ CRITICAL:** The `"aud": "convex"` line is REQUIRED!

### Step 4: Apply Template

1. **Save** the template
2. If this is a new template, you need to **apply it as the default** for your application

### Step 5: Set Default JWT Template (Important!)

1. Still in Clerk Dashboard, go to **"Sessions"** (in the Configure section)
2. Look for **"JWT Templates"** or **"Customize session token"**
3. Set the default JWT template to the "convex" template you just created/edited

---

## 🧪 Testing the Fix

### Method 1: Use the Debug Page

1. Deploy your app with the changes
2. Visit: `https://your-production-domain.com/debug-auth`
3. Sign in
4. Check the JWT payload - you should now see:
   ```json
   {
     "iss": "https://clerk.trainlyai.com",
     "aud": "convex",  // ← This should now be present!
     "sub": "user_...",
     ...
   }
   ```

### Method 2: Manual Token Check

1. Sign in to your production app
2. Open Browser DevTools (F12)
3. Go to **Application** → **Local Storage**
4. Find Clerk's session token
5. Copy the token and paste it into [jwt.io](https://jwt.io)
6. Verify the decoded payload has `"aud": "convex"`

---

## 📋 Complete Checklist

- [ ] Accessed Clerk Dashboard (production app)
- [ ] Created or edited JWT template for Convex
- [ ] Verified `"aud": "convex"` is in the template
- [ ] Verified `"iss"` matches your auth.config.js domain
- [ ] Saved the template
- [ ] Set it as the default JWT template in Sessions settings
- [ ] Cleared browser cache and cookies
- [ ] Signed out completely
- [ ] Signed in again
- [ ] Tested access to `/dashboard`

---

## 🔍 Additional Debugging

### Check Current Token (Browser Console)

Add this to your browser console after signing in:

```javascript
// Get Clerk session
const session = window.Clerk?.session;
if (session) {
  session.getToken().then((token) => {
    console.log("Token:", token);
    // Decode JWT
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1]));
    console.log("Payload:", payload);
    console.log("Audience:", payload.aud); // Should be "convex"
    console.log("Issuer:", payload.iss); // Should match auth.config.js
  });
}
```

### Check Convex Logs

```bash
cd frontend
npx convex logs --prod
```

Look for errors mentioning "auth provider" or "token validation"

---

## 🆘 Still Not Working?

### Issue: Token has no `aud` claim

**Solution:** The JWT template isn't being applied. Make sure:

1. You set it as the **default** template in Sessions settings
2. You completely signed out and signed back in
3. Clear all browser storage (not just cache)

### Issue: Token has wrong `aud` value

**Solution:** Edit the template and ensure `"aud": "convex"` (exactly)

### Issue: Token issuer doesn't match

**Solution:** Two options:

**Option 1:** Update auth.config.js to match the actual issuer

```javascript
export default {
  providers: [
    {
      domain: "YOUR_ACTUAL_ISSUER_FROM_TOKEN",
      applicationID: "convex",
    },
  ],
};
```

**Option 2:** Support multiple domains (if you have dev + prod)

```javascript
export default {
  providers: [
    {
      domain: "https://hardy-firefly-8.clerk.accounts.dev",
      applicationID: "convex",
    },
    {
      domain: "https://clerk.trainlyai.com",
      applicationID: "convex",
    },
  ],
};
```

Then deploy: `npx convex deploy --prod`

---

## 📚 Reference Documentation

- [Convex Authentication Docs](https://docs.convex.dev/auth)
- [Clerk JWT Templates](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Debugging Convex Auth](https://docs.convex.dev/auth/debug)

---

## Summary of the Fix

The issue is that **Clerk is issuing JWT tokens without the correct audience claim**. Convex requires:

- **Audience (`aud`)**: Must be `"convex"`
- **Issuer (`iss`)**: Must match the domain in `frontend/convex/auth.config.js`

Once you configure the JWT template in Clerk with these settings, the authentication will work.
