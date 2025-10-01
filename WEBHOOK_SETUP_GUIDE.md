# Stripe Webhook Setup Guide

## Quick Setup for Development & Production

### Step 1: Add Environment Variables

Add this to your `.env.local` file:

```bash
# Webhook Admin Key (create a secure random string)
WEBHOOK_ADMIN_KEY=your_secure_random_key_here_make_it_long_and_complex

# Your existing Stripe keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_stripe_dashboard

# Credit Pack Price IDs
NEXT_PUBLIC_STRIPE_CREDITS_5K_PRICE_ID=price_your_5k_credits_price_id
NEXT_PUBLIC_STRIPE_CREDITS_15K_PRICE_ID=price_your_15k_credits_price_id
NEXT_PUBLIC_STRIPE_CREDITS_50K_PRICE_ID=price_your_50k_credits_price_id
NEXT_PUBLIC_STRIPE_CREDITS_100K_PRICE_ID=price_your_100k_credits_price_id
```

### Step 2: Set Up Stripe Dashboard Webhook

1. **Go to Stripe Dashboard** → [Webhooks](https://dashboard.stripe.com/webhooks)

2. **Click "Add endpoint"**

3. **For Development:**
   - Endpoint URL: `https://your-ngrok-url.ngrok.io/api/stripe/webhook`
   - Or use: `http://localhost:3001/api/stripe/webhook` (if publicly accessible)

4. **For Production:**
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`

5. **Select Events to Send:**

   ```
   ✅ checkout.session.completed
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.payment_succeeded
   ✅ invoice.payment_failed
   ```

6. **Copy the Webhook Signing Secret** and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 3: Test the Setup

#### Option A: Manual Testing Interface

1. Go to: `http://localhost:3001/admin/webhook-test`
2. Enter your admin key and credit amount
3. Click "Add Credits"

#### Option B: API Testing

```bash
curl -X POST http://localhost:3001/api/stripe/manual-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your_user_id",
    "creditsToAdd": 5000,
    "reason": "Test credit addition",
    "adminKey": "your_webhook_admin_key"
  }'
```

#### Option C: Browser Console

```javascript
// In your app's browser console
fetch("/api/stripe/manual-webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "your_user_id",
    creditsToAdd: 5000,
    reason: "Browser test",
    adminKey: "your_webhook_admin_key",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

### Step 4: Verify Webhook Logs

When webhooks work, you should see in your terminal:

```
🔔 Webhook received: checkout.session.completed
✅ Processing checkout session completed
Session details: { id: 'cs_...', mode: 'payment', ... }
Adding 5000 credits for user user_...
```

### Step 5: Production Deployment

For production, you'll need:

1. **Public HTTPS endpoint** for your webhook
2. **Same webhook events** configured in Stripe Dashboard
3. **Live Stripe keys** instead of test keys
4. **Secure admin key** for manual operations

### Troubleshooting

#### Webhooks Not Received:

- Check Stripe Dashboard → Webhooks → Your endpoint → "Recent deliveries"
- Verify your endpoint URL is publicly accessible
- Check webhook signing secret matches your `.env.local`

#### Credits Not Added:

- Check terminal logs for webhook processing
- Verify price IDs match your Stripe products
- Use the manual webhook endpoint to test credit addition

#### Manual Webhook for Emergency:

If webhooks are broken and you need to add credits immediately:

```bash
# Quick credit addition for current user
curl -X POST https://yourdomain.com/api/stripe/manual-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_2qV6s91gKmSP36myLQgL56rFSvz",
    "creditsToAdd": 50000,
    "reason": "Emergency credit addition - webhook broken",
    "adminKey": "your_admin_key"
  }'
```

### Security Notes

- Keep your `WEBHOOK_ADMIN_KEY` secure and complex
- Don't commit it to version control
- Use different keys for development and production
- Consider IP whitelisting for production manual webhook endpoint

### Development with ngrok

If testing locally with external webhooks:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3001

# Use the https URL in Stripe Dashboard
https://abc123.ngrok.io/api/stripe/webhook
```

## Summary

You now have:

- ✅ Manual webhook endpoint for testing
- ✅ Admin interface at `/admin/webhook-test`
- ✅ Proper Stripe webhook configuration
- ✅ Emergency credit addition capability
- ✅ Comprehensive logging and debugging

The system will now properly add credits when purchases are made! 🚀

