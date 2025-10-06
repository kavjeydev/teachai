# 🔧 Convex Authentication Troubleshooting Checklist

## The Error

`"No auth provider found matching the given token", check your server auth config`

## You Already Have:

- ✅ JWT Template for Convex in Clerk
- ✅ auth.config.js file with domain configured

## Most Likely Issue: Config Not Deployed to Convex Production

### Step 1: Verify and Deploy to Convex Production

```bash
cd frontend

# Deploy to production (THIS IS CRITICAL!)
npx convex deploy --prod

# Or if you're using a specific deployment
npx convex deploy --prod --project your-project-name
```

**Why this matters:**
Changes to `convex/auth.config.js` are NOT automatically deployed when you deploy your Next.js app. You must explicitly deploy to Convex.

---

## Step 2: Verify the Configuration is Live

After deploying, check Convex dashboard:

1. Go to https://dashboard.convex.dev
2. Select your production deployment
3. Click on **"Settings"** → **"Authentication"**
4. Verify you see your auth provider listed with domain: `https://clerk.trainlyai.com`

---

## Step 3: Check Your Production Clerk Publishable Key

**CRITICAL CHECK:** Are you using the correct Clerk publishable key in production?

1. In your hosting platform (Vercel, etc.), check environment variables
2. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is for your **PRODUCTION** Clerk instance
3. Common mistake: Using dev key (`pk_test_...`) in production instead of prod key (`pk_live_...`)

### How to check:

**In your Clerk Dashboard:**

- Go to https://dashboard.clerk.com
- **Important:** Make sure you're looking at the PRODUCTION instance (check top-left dropdown)
- Go to "API Keys"
- Copy the **Publishable key**
- Compare it with what's in your production environment variables

**Format check:**

- Development keys start with: `pk_test_`
- Production keys start with: `pk_live_`

If you're using `pk_test_` in production, that's likely your problem!

---

## Step 4: Verify the JWT Issuer Matches

The most common mismatch happens when:

- Development Clerk instance uses: `https://hardy-firefly-8.clerk.accounts.dev`
- Production Clerk instance uses: `https://clerk.trainlyai.com` (custom domain)

### Solution: Support BOTH domains

Update your `frontend/convex/auth.config.js`:

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

Then deploy:

```bash
npx convex deploy --prod
```

This allows both domains to work, so it doesn't matter which Clerk instance you're using.

---

## Step 5: Use the Debug Page to Identify the Real Issue

1. Deploy your app with the `/debug-auth` page
2. Visit: `https://your-production-domain.com/debug-auth`
3. Sign in with your production credentials
4. The page will show you:
   - ✅ or ❌ if `aud` is correct
   - The actual `iss` (issuer) from your token
   - Exactly what needs to be in auth.config.js

If the issuer shown doesn't match what's in your auth.config.js, that's your problem!

---

## Step 6: Clear Everything and Test

After deploying the fix:

1. **Clear browser cache completely**
2. **Clear cookies** (especially Clerk cookies)
3. **Sign out completely**
4. **Close all browser tabs**
5. **Open a fresh browser tab or incognito window**
6. **Sign in again**
7. **Try accessing /dashboard**

---

## Common Scenarios and Solutions

### Scenario A: "I have separate dev and prod Clerk instances"

**Solution:** Add BOTH domains to auth.config.js

```javascript
export default {
  providers: [
    // Production custom domain
    {
      domain: "https://clerk.trainlyai.com",
      applicationID: "convex",
    },
    // Development default domain
    {
      domain: "https://hardy-firefly-8.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
```

### Scenario B: "I'm using the same Clerk instance for dev and prod"

**Check which domain your JWT is using:**

1. Go to your Clerk Dashboard (production instance)
2. Navigate to "Domains" or "Customization"
3. Check if you have a custom domain set up
4. The JWT will use whichever domain is configured

**Solution:** Make sure auth.config.js matches that domain exactly.

### Scenario C: "My domain is definitely correct but it still doesn't work"

**Possible causes:**

1. ❌ Auth config not deployed: Run `npx convex deploy --prod`
2. ❌ Wrong Clerk instance: Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in production
3. ❌ Cached tokens: Clear ALL browser data and sign in fresh
4. ❌ JWT template not applied: Check Clerk Sessions settings

---

## Quick Diagnostic Commands

### Check if Convex is using the right config:

```bash
cd frontend
npx convex env ls --prod
```

### Check your local auth.config.js:

```bash
cat convex/auth.config.js
```

### Deploy with verbose logging:

```bash
npx convex deploy --prod --debug
```

---

## Step-by-Step Fix (Do This Now)

1. **Add both domains to auth.config.js:**

   ```javascript
   export default {
     providers: [
       { domain: "https://clerk.trainlyai.com", applicationID: "convex" },
       {
         domain: "https://hardy-firefly-8.clerk.accounts.dev",
         applicationID: "convex",
       },
     ],
   };
   ```

2. **Deploy to Convex:**

   ```bash
   cd frontend
   npx convex deploy --prod
   ```

3. **Verify in Convex Dashboard:**
   - Go to https://dashboard.convex.dev
   - Check Settings → Authentication
   - Should see both providers listed

4. **Check production environment variables:**
   - Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Should start with `pk_live_` for production (not `pk_test_`)

5. **Test with debug page:**
   - Deploy your frontend
   - Visit `/debug-auth`
   - Check if issuer matches one of your configured domains

6. **Clear and test:**
   - Clear browser cache/cookies
   - Sign out
   - Sign in fresh
   - Try `/dashboard`

---

## Still Not Working?

If you've done all of the above and it still doesn't work, run the debug page and share:

1. What does it show for `iss` (issuer)?
2. What does it show for `aud` (audience)?
3. What does your auth.config.js currently have?
4. What is the output of `npx convex logs --prod`?

The debug page at `/debug-auth` will tell you exactly what's wrong.
