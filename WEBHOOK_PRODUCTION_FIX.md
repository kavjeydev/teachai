# Webhook Production Fix Guide

## Problem Diagnosed

Your billing worked locally but not in production because of **hardcoded Convex deployment URLs** in your codebase. You had 3 different Convex URLs:

1. `agile-ermine-199.convex.cloud` - hardcoded in `queryai/route.ts`
2. `colorless-finch-681.convex.cloud` - hardcoded in `convexClient.js`
3. Your actual production Convex URL in `NEXT_PUBLIC_CONVEX_URL`

This meant:

- **Local**: Everything pointed to the same dev database ✅
- **Production**: Webhook wrote to one database, frontend read from another ❌

## Changes Made

### ✅ Fixed Files

1. **`frontend/src/app/api/queryai/route.ts`**
   - Removed hardcoded `agile-ermine-199.convex.cloud`
   - Now uses `process.env.NEXT_PUBLIC_CONVEX_URL`

2. **`frontend/convex/convexClient.js`**
   - Removed hardcoded `colorless-finch-681.convex.cloud`
   - Now uses `process.env.NEXT_PUBLIC_CONVEX_URL`

3. **`frontend/src/app/api/stripe/webhook/route.ts`**
   - Added debug logging to see which Convex URL is being used
   - Logs environment info on every webhook call

4. **`frontend/src/app/api/debug-env/route.ts`** (NEW)
   - Debug endpoint to check environment variables in production

## Next Steps

### Step 1: Verify Vercel Environment Variable

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Make sure `NEXT_PUBLIC_CONVEX_URL` is set to your **production** Convex deployment URL:

```
NEXT_PUBLIC_CONVEX_URL=https://YOUR-PRODUCTION-DEPLOYMENT.convex.cloud
```

**NOT** one of these old ones:

- ❌ `https://agile-ermine-199.convex.cloud`
- ❌ `https://colorless-finch-681.convex.cloud`

### Step 2: Deploy the Changes

```bash
cd /Users/kavin_jey/Desktop/teachai/frontend
git add .
git commit -m "Fix: Replace all hardcoded Convex URLs with environment variable"
git push
```

Then redeploy on Vercel:

```bash
vercel --prod
```

### Step 3: Test the Debug Endpoint

After deploying, visit:

```
https://www.trainlyai.com/api/debug-env
```

You should see:

```json
{
  "hasConvexUrl": true,
  "convexUrlPrefix": "https://your-production-deploy...",
  "hasStripeSecret": true,
  "stripeKeyType": "LIVE",
  "hasWebhookSecret": true,
  "hasPriceIds": {
    "pro": true,
    "scale": true,
    "credits5k": true,
    "credits15k": true,
    "credits50k": true,
    "credits100k": true
  }
}
```

Verify:

- ✅ `stripeKeyType` should be **"LIVE"** (not "TEST")
- ✅ `convexUrlPrefix` should match your production Convex URL
- ✅ All `hasPriceIds` should be `true`

### Step 4: Test a Subscription Upgrade

1. **Go to your site**: https://www.trainlyai.com
2. **Click to upgrade** to Pro plan
3. **Use Stripe test card** (if still in test mode):
   - Card: `4242 4242 4242 4242`
   - Exp: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

### Step 5: Check Vercel Logs

While testing, monitor the logs:

```bash
vercel logs --follow
```

You should see:

```
🎯 Webhook called - Environment check: {
  hasStripeKey: true,
  stripeKeyType: 'LIVE',
  hasWebhookSecret: true,
  convexUrl: 'https://your-production-deploy...',
  timestamp: '2025-10-07T...'
}
✅ Webhook signature verified successfully
🔔 Webhook received: checkout.session.completed
🔄 Calling Convex mutation: subscriptions/updateSubscriptionForUser
✅ Convex mutation success: subscriptions/updateSubscriptionForUser
```

### Step 6: Verify in Stripe Dashboard

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your production webhook
3. Go to **"Recent deliveries"**
4. You should see events with **200** status (success)
5. If you see errors, click on them to see the details

## Why It Works Locally But Not in Production

### Local Development:

- You likely had `.env.local` pointing to a dev Convex deployment
- All hardcoded URLs might have been pointing to the same dev database
- So even with hardcoded URLs, everything worked

### Production:

- Vercel environment variables set to production Convex
- Hardcoded URLs still pointed to old dev databases
- **Result**: Webhook wrote to dev DB, frontend read from prod DB
- User upgrades but sees no changes!

## Environment Variables Checklist

Make sure these are all set in **Vercel Production** environment:

```env
# Convex (CRITICAL - Must match everywhere!)
NEXT_PUBLIC_CONVEX_URL=https://your-production.convex.cloud

# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (from production webhook)

# Stripe Price IDs (Live mode)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_1S9smGRPRDKRfk2f7ARUAVcJ
NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_CREDITS_5K_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_CREDITS_15K_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_CREDITS_50K_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_CREDITS_100K_PRICE_ID=price_...

# Clerk (if using)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

## Troubleshooting

### If subscription still doesn't update:

1. **Check the debug endpoint**: Make sure Convex URL is correct
2. **Check Vercel logs**: Look for Convex mutation errors
3. **Check Stripe webhook logs**: Look for failed deliveries
4. **Verify webhook events**: Make sure all 6 events are selected:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### If you see Convex errors in logs:

- Make sure the Convex deployment is running
- Verify the functions exist: `subscriptions/updateSubscriptionForUser`
- Check Convex dashboard for function errors

### If webhook signature verification fails:

- Make sure `STRIPE_WEBHOOK_SECRET` matches the production webhook secret
- Verify you created a separate webhook endpoint for production
- Check that the endpoint URL is exactly: `https://www.trainlyai.com/api/stripe/webhook`

## Prevention: Never Hardcode URLs Again!

**Always use environment variables:**

✅ Good:

```typescript
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

❌ Bad:

```typescript
const convexUrl = "https://my-deployment.convex.cloud";
const stripe = new Stripe("sk_live_abc123...");
```

## Summary

The root cause was **hardcoded Convex URLs** pointing to old/different deployments. Now everything uses `process.env.NEXT_PUBLIC_CONVEX_URL` which ensures your webhook and frontend talk to the same database!

After deploying, your billing should work perfectly in production! 🚀
