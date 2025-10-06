# 🔧 Apply Clerk JWT Template to Sessions

## The Problem

You have a JWT template named "convex" with correct settings:

- ✅ Template name: "convex"
- ✅ Issuer: `https://clerk.trainlyai.com`
- ✅ JWKS: `https://clerk.trainlyai.com/.well-known/jwks.json`
- ✅ Claims include `"aud": "convex"`

BUT: The template exists but **isn't being applied** to your session tokens!

---

## ⚡ The Fix: Apply Template to Sessions

### Step 1: Go to Clerk Dashboard Sessions Settings

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. **Make sure you're in your PRODUCTION instance** (check top-left dropdown)
3. In the left sidebar, click **"Sessions"** (under "Configure")

### Step 2: Customize Session Token

Look for one of these sections:

- **"Customize session token"**
- **"Session token customization"**
- **"JWT Templates"**

### Step 3: Select Your Convex Template

You should see options like:

- **"Default"** (currently selected - this is the problem!)
- **"convex"** (your template - select this!)
- Maybe other custom templates

**Action:** Change from "Default" to **"convex"**

### Step 4: Save Changes

Click **"Save"** or **"Apply"**

---

## 🔄 Alternative Method: Set Template in Clerk Provider

If you don't see the option above, you can also specify the template in your code:

Update your Convex Provider:

**File:** `frontend/src/app/components/providers/convex-provider.tsx`

```typescript
"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const ConvexClientProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      signInForceRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <ConvexProviderWithClerk
        useAuth={useAuth}
        client={convex}
        // Add this line to specify the JWT template
        jwtTemplate="convex"
      >
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
```

**Key addition:** The `jwtTemplate="convex"` prop tells Clerk to use your custom template!

---

## 🧪 Testing the Fix

### After applying the template:

1. **Clear ALL browser data** (cache, cookies, local storage)
2. **Sign out completely** from your app
3. **Close all browser tabs**
4. **Open a fresh browser tab** (or incognito window)
5. **Sign in again** to your production app
6. **Visit** `https://your-production-domain.com/debug-auth`
7. **Check:** The `aud` should now show "convex" (green) ✅

---

## 🔍 Verify Token Claims

After signing in with the new configuration, the debug page should show:

```json
{
  "iss": "https://clerk.trainlyai.com",
  "aud": "convex",  // ✅ Should now be present!
  "sub": "user_...",
  "email": "your-email@example.com",
  "name": "Your Name",
  ...
}
```

---

## 📋 Quick Checklist

- [ ] Go to Clerk Dashboard (production instance)
- [ ] Navigate to "Sessions" settings
- [ ] Change session token template from "Default" to "convex"
- [ ] Save changes
- [ ] OR add `jwtTemplate="convex"` prop to ConvexProviderWithClerk
- [ ] Deploy frontend if you made code changes
- [ ] Clear browser cache and cookies completely
- [ ] Sign out and sign in again
- [ ] Visit `/debug-auth` to verify `aud: "convex"` is present
- [ ] Test accessing `/dashboard`

---

## 🆘 Still Not Working?

If you've done the above and the debug page still shows the wrong `aud`:

1. **Double check you're editing the PRODUCTION Clerk instance**
   - In Clerk dashboard, look at the top-left corner
   - Should say the production project name, not "Development"

2. **Verify the template is applied**
   - Go back to Sessions settings
   - Confirm "convex" template is selected (not "Default")

3. **Try the code-based approach**
   - Add `jwtTemplate="convex"` to your ConvexProviderWithClerk
   - Deploy the frontend
   - Clear cache and sign in fresh

4. **Check Clerk logs**
   - In Clerk Dashboard, go to "Logs"
   - Sign in again and check for any errors related to JWT generation

---

## 🎯 Why This Happens

Clerk separates:

1. **Creating JWT templates** (what you did ✅)
2. **Applying templates to sessions** (what's missing ❌)

Even though your template exists, Clerk defaults to using the "Default" template for session tokens unless you explicitly tell it to use your custom "convex" template.

The `jwtTemplate` prop or Sessions settings tells Clerk: "Use THIS template when generating tokens for this app."

---

## References

- [Clerk JWT Templates Documentation](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [ConvexProviderWithClerk Props](https://docs.convex.dev/auth/clerk#convexprovider-with-clerk)
- Your JWKS endpoint: https://clerk.trainlyai.com/.well-known/jwks.json ✅ (confirmed working)
