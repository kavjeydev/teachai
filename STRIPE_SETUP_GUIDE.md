# Trainly Stripe Integration Setup Guide

## Overview

This guide will help you set up Stripe integration for Trainly's subscription and credit system.

## 1. Environment Variables Setup

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret

# Stripe Price IDs (create these in Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_... # Pro tier ($39/month)
NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID=price_... # Scale tier ($199/month)
# Note: Enterprise is contact-only, no Stripe price ID needed

# Credit Pack Price IDs
NEXT_PUBLIC_STRIPE_CREDITS_5K_PRICE_ID=price_... # 5K credits ($20)
NEXT_PUBLIC_STRIPE_CREDITS_15K_PRICE_ID=price_... # 15K credits ($50)
NEXT_PUBLIC_STRIPE_CREDITS_50K_PRICE_ID=price_... # 50K credits ($100)
```

## 2. Stripe Dashboard Setup

### Step 1: Create Products

1. Go to Stripe Dashboard → Products
2. Create these products:

**Trainly Pro**

- Name: "Trainly Pro"
- Description: "Professional AI development with 10M tokens included"
- Price: $39.00 USD/month, recurring

**Trainly Scale**

- Name: "Trainly Scale"
- Description: "For startups in production with hundreds–thousands of users"
- Price: $199.00 USD/month, recurring

**Trainly Enterprise**

- Name: "Trainly Enterprise"
- Description: "For large organizations with custom needs"
- Price: Contact sales (no Stripe product needed)

### Step 2: Create Credit Packs

**5K Credits**

- Name: "5K AI Credits"
- Description: "~5M tokens on GPT-4o-mini"
- Price: $20.00 USD, one-time

**15K Credits**

- Name: "15K AI Credits"
- Description: "~15M tokens on GPT-4o-mini"
- Price: $50.00 USD, one-time

**50K Credits**

- Name: "50K AI Credits"
- Description: "~50M tokens on GPT-4o-mini"
- Price: $100.00 USD, one-time

### Step 3: Configure Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your env vars

## 3. Credit System Logic

### Model Multipliers

- **GPT-4o-mini**: 1x (1 credit = 1K tokens)
- **GPT-4o**: 15x (15 credits = 1K tokens)
- **Claude Haiku**: 1x (1 credit = 1K tokens)
- **Claude Sonnet**: 8x (8 credits = 1K tokens)
- **Claude Opus**: 20x (20 credits = 1K tokens)

### Tier Limits

- **Free**: 500 credits (~500K tokens on mini)
- **Pro**: 10,000 credits (~10M tokens on mini)
- **Scale**: 100,000 credits (~100M tokens on mini)
- **Enterprise**: Custom (typically 1M+ credits)

## 4. Integration Points

### Frontend Components

- `SubscriptionManager` - Shows current plan and usage
- `PricingPage` - Public pricing with Stripe checkout
- `CreditMonitor` - Usage tracking in chat interface

### Backend Integration

- `convex/subscriptions.ts` - Subscription and credit management
- `api/stripe/webhook` - Handles Stripe events
- `api/stripe/checkout` - Creates checkout sessions

### Database Schema

- `subscriptions` - User subscription data
- `user_credits` - Credit balances and usage
- `credit_transactions` - Usage history
- `billing_events` - Stripe event logs

## 5. Testing

### Test Mode Setup

1. Use Stripe test keys (sk*test*, pk*test*)
2. Use test webhook endpoint
3. Test with Stripe test cards:
   - Success: 4242 4242 4242 4242
   - Decline: 4000 0000 0000 0002

### Production Checklist

- [ ] Replace test keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Test subscription flows end-to-end
- [ ] Verify credit consumption tracking
- [ ] Test webhook event handling

## 6. Next Steps

1. **Set up Stripe account** and get API keys
2. **Create products and prices** in Stripe Dashboard
3. **Configure webhook endpoint**
4. **Add environment variables** to your deployment
5. **Test the full subscription flow**

The system is designed to be production-ready with proper error handling, webhook processing, and credit tracking!
