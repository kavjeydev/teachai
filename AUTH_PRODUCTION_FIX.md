# 🔧 Production Authentication Fix Guide

## Problem

Error: `"No auth provider found matching the given token"` after signing in.

**Root Cause:** The JWT issuer domain in your Clerk tokens doesn't match the domain configured in `frontend/convex/auth.config.js`.

---

## Solution Method 1: Use Debug Page (Recommended)

### Step 1: Deploy the Debug Page

The debug page has been created at `frontend/src/app/debug-auth/page.tsx`.

1. **Deploy to Production:**

   ```bash
   cd frontend
   npm run build
   # Deploy using your hosting platform (Vercel, etc.)
   ```

2. **Visit in Production:**
   Go to: `https://your-production-domain.com/debug-auth`

3. **Sign in** and the page will show you:
   - Your exact JWT issuer domain
   - The exact code to copy into `auth.config.js`

### Step 2: Update Convex Auth Config

Copy the issuer domain shown on the debug page and update:

**File:** `frontend/convex/auth.config.js`

```javascript
export default {
  providers: [
    {
      domain: "PASTE_YOUR_ISSUER_HERE", // e.g., "https://clerk.trainlyai.com"
      applicationID: "convex",
    },
  ],
};
```

### Step 3: Deploy to Convex Production

```bash
cd frontend
npx convex deploy --prod
```

### Step 4: Redeploy Frontend

```bash
npm run build
# Then deploy via your hosting platform
```

### Step 5: Clear Cache & Test

1. Clear browser cache and cookies
2. Sign in again
3. Access `/dashboard`

---

## Solution Method 2: Check Clerk Dashboard Directly

### Step 1: Get JWT Issuer from Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your **PRODUCTION** application
3. Navigate to: **API Keys** or **JWT Templates**
4. Look for one of these:
   - **"JWT Issuer"** - This is what you need!
   - **"Frontend API"** - May look like: `clerk.your-domain.com`
   - **"Issuer URL"** in JWT settings

**Common patterns:**

- Development: `https://[app-name].clerk.accounts.dev`
- Production with custom domain: `https://clerk.your-domain.com`
- Production default: `https://[app-name].clerk.accounts.dev` (might be different from dev)

### Step 2-5: Same as Method 1 (Update config, deploy, test)

---

## Solution Method 3: Check Browser Console (If Signed In)

If you can sign in but get the error when accessing dashboard:

1. Open browser DevTools (F12)
2. Go to **Application** tab → **Local Storage**
3. Look for Clerk session data
4. Find the JWT token
5. Copy it to [jwt.io](https://jwt.io)
6. Look at the `iss` (issuer) field - **this is your domain!**

---

## Quick Checklist

- [ ] Found the correct JWT issuer domain
- [ ] Updated `frontend/convex/auth.config.js` with correct domain
- [ ] Deployed to Convex production: `npx convex deploy --prod`
- [ ] Redeployed frontend application
- [ ] Cleared browser cache
- [ ] Tested sign-in and dashboard access

---

## Common Issues

### Issue: Still getting the error after updating

**Solution:**

1. Make sure you deployed to Convex: `npx convex deploy --prod`
2. Verify the change was applied:
   ```bash
   cat frontend/convex/auth.config.js
   ```
3. Clear ALL browser data (cache, cookies, local storage)
4. Sign out completely and sign in again

### Issue: Different domains for dev and production

**Solution:** Use environment-based configuration:

```javascript
// frontend/convex/auth.config.js
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL?.includes("prod")
        ? "https://clerk.trainlyai.com" // Production
        : "https://hardy-firefly-8.clerk.accounts.dev", // Development
      applicationID: "convex",
    },
  ],
};
```

### Issue: Using multiple Clerk instances

**Solution:** Add all domains as separate providers:

```javascript
export default {
  providers: [
    {
      domain: "https://clerk.trainlyai.com",
      applicationID: "convex",
    },
    {
      domain: "https://hardy-firefly-8.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
```

---

## After Fix - Cleanup

Once everything works, you can optionally remove the debug page:

```bash
rm frontend/src/app/debug-auth/page.tsx
```

---

## Need More Help?

If you're still having issues, check:

1. Convex logs: Run `npx convex logs --prod`
2. Browser console for detailed errors
3. Verify all environment variables are set in production
4. Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` matches your production Clerk app

---

## Technical Details

**Why this happens:**

- Clerk issues JWT tokens with an `iss` (issuer) claim
- Convex validates tokens by checking if the `iss` matches a configured domain
- Different Clerk instances (dev vs prod) often have different issuer domains
- The mismatch causes the "No auth provider found" error

**What gets checked:**

```
JWT Token Issuer (from Clerk)  ===  auth.config.js domain
   ❌ https://clerk.example.com  ≠  https://different-domain.com
   ✅ https://clerk.example.com  =  https://clerk.example.com
```
