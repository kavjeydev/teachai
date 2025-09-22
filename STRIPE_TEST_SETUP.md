# 🧪 Stripe Test Mode Setup for Development

## Why Use Test Mode?

- ✅ **Safe testing** - No real money involved
- ✅ **Test cards** - Stripe provides test credit cards
- ✅ **Full functionality** - Everything works exactly like production
- ✅ **Easy debugging** - Clear test vs live separation

## 🔑 Step 1: Get Your Test API Keys

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Toggle to "Test mode"** (switch in top left)
3. **Go to Developers → API keys**
4. **Copy your test keys**:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

## 🛠️ Step 2: Set Up Test Products

1. **Update the test secret key** in `setup-stripe-test-products.js` (line 4)
2. **Run the setup script**:
   ```bash
   node setup-stripe-test-products.js
   ```
3. **Copy the output** to your `.env.local` file

## 📝 Step 3: Update Your Environment

Replace your current `.env.local` with **TEST keys** for development:

```env
# Stripe TEST Configuration (for localhost development)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE

# TEST Subscription Price IDs (get from setup script output)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_test_...
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=price_test_...
NEXT_PUBLIC_STRIPE_STARTUP_PRICE_ID=price_test_...

# TEST Credit Pack Price IDs (get from setup script output)
NEXT_PUBLIC_STRIPE_CREDITS_5K_PRICE_ID=price_test_...
NEXT_PUBLIC_STRIPE_CREDITS_15K_PRICE_ID=price_test_...
NEXT_PUBLIC_STRIPE_CREDITS_50K_PRICE_ID=price_test_...

# TEST Webhook Secret (set up after creating webhook)
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

## 🔗 Step 4: Set Up Test Webhook (Optional for now)

1. **Go to Stripe Dashboard** → Webhooks (in test mode)
2. **Add endpoint**: `http://localhost:3000/api/stripe/webhook`
3. **Select events**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
4. **Copy webhook secret** and add to `.env.local`

## 💳 Step 5: Test with Test Cards

Use these test credit cards in Stripe checkout:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

**Any future date** for expiry, **any 3-digit CVC**

## 🧪 Step 6: Test the Complete Flow

1. **Start your app**: `npm run dev`
2. **Click "Start Pro"** on dashboard
3. **Use test card**: `4242 4242 4242 4242`
4. **Complete checkout**
5. **Verify credits** are added to your account
6. **Test AI chat** to see credit consumption

## 🔄 Development vs Production

### **Development (.env.local)**
```env
STRIPE_SECRET_KEY=sk_test_...  # Test mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### **Production (deployment)**
```env
STRIPE_SECRET_KEY=sk_live_...  # Live mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 🎯 What You'll See in Test Mode

- **Stripe Dashboard** shows test transactions
- **No real money** is charged
- **Full checkout experience** exactly like production
- **Webhook events** work exactly the same
- **Credits system** functions identically

## ⚠️ Important Notes

- **Never mix test and live** keys in the same environment
- **Test webhooks** only work with test events
- **Test data** is completely separate from live data
- **Switch to live keys** only when ready for real customers

## 🚀 Next Steps

1. **Get your test API keys** from Stripe dashboard
2. **Run the test product setup script**
3. **Update your .env.local** with test keys
4. **Test the "Start Pro" button** with test cards
5. **Once working**, switch to live keys for production

This way you can safely test all payment flows without any risk! 🧪✅
