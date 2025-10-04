# Production Stripe Integration Checklist

## 🚨 **Critical Production Issues to Prevent**

This checklist ensures your Stripe integration works reliably in production and prevents the sync issues you experienced in development.

## ✅ **Pre-Production Checklist**

### 1. **Stripe Configuration**

- [ ] **Switch to Live Mode** in Stripe Dashboard
- [ ] **Update all environment variables** to live keys:
  ```env
  STRIPE_SECRET_KEY=sk_live_...  # NOT sk_test_
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # NOT pk_test_
  STRIPE_WEBHOOK_SECRET=whsec_...  # Live webhook secret
  ```
- [ ] **Create live products and prices** (copy from test mode)
- [ ] **Update all price ID environment variables** to live price IDs

### 2. **Webhook Configuration**

- [ ] **Set up live webhook endpoint**: `https://yourdomain.com/api/stripe/webhook`
- [ ] **Configure required events**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `checkout.session.completed`
- [ ] **Test webhook delivery** using Stripe CLI or Dashboard
- [ ] **Monitor webhook failures** in production

### 3. **Customer Portal Configuration**

- [ ] **Enable plan switching** in [Customer Portal Settings](https://dashboard.stripe.com/settings/billing/portal)
- [ ] **Add all available plans** (Pro, Scale, Enterprise)
- [ ] **Configure update timing** (immediate vs next billing cycle)
- [ ] **Test portal functionality** with a test customer

### 4. **Monitoring & Alerting**

#### A. **Subscription Health Monitoring**

```typescript
// Add to your admin dashboard
const healthCheck = useQuery(api.subscriptions.checkSubscriptionHealth);
```

#### B. **Webhook Monitoring**

- [ ] **Log all webhook events** (already implemented)
- [ ] **Alert on webhook failures**
- [ ] **Monitor webhook processing time**
- [ ] **Set up retry mechanisms** for failed webhooks

#### C. **Sync Issue Detection**

- [ ] **Daily health checks** for all paid subscribers
- [ ] **Alert when subscriptions are out of sync**
- [ ] **Automated sync attempts** for detected issues

### 5. **Fallback Mechanisms**

#### A. **Manual Sync Tools** (Already Implemented ✅)

- Sync button in user profiles
- Admin sync API endpoint
- Migration tools for manual subscriptions

#### B. **Webhook Backup**

```typescript
// Scheduled function to catch missed webhooks
export const detectMissedWebhooks = internalMutation({
  handler: async (ctx) => {
    // Check for subscriptions that haven't been updated recently
    // Compare with Stripe data and flag discrepancies
  },
});
```

## 🔧 **Production Reliability Improvements**

### 1. **Webhook Reliability**

```typescript
// Add to webhook handler
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function processWebhookWithRetry(event: Stripe.Event, retryCount = 0) {
  try {
    await processWebhook(event);
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY * (retryCount + 1)),
      );
      return processWebhookWithRetry(event, retryCount + 1);
    }
    throw error;
  }
}
```

### 2. **Subscription Validation**

```typescript
// Add validation before critical operations
const validateSubscriptionSync = async (userId: string) => {
  const dbSub = await getSubscriptionFromDB(userId);
  const stripeSub = await getSubscriptionFromStripe(dbSub.stripeCustomerId);

  if (dbSub.tier !== mapPriceToTier(stripeSub.priceId)) {
    // Trigger automatic sync
    await syncSubscriptionFromStripe(userId);
  }
};
```

### 3. **Error Recovery**

```typescript
// Graceful degradation when Stripe is unavailable
const getSubscriptionWithFallback = async (userId: string) => {
  try {
    return await getSubscriptionFromStripe(userId);
  } catch (stripeError) {
    console.warn("Stripe unavailable, using cached data:", stripeError);
    return await getSubscriptionFromDB(userId);
  }
};
```

## 📊 **Production Monitoring Dashboard**

### Key Metrics to Track:

- **Webhook Success Rate** (should be >99%)
- **Subscription Sync Health** (% of users with healthy subscriptions)
- **Payment Failure Rate**
- **Customer Portal Usage**
- **Manual Sync Frequency** (should decrease over time)

### Alerts to Set Up:

- **Webhook failure rate >1%**
- **Subscription out of sync >5 minutes**
- **Payment failures**
- **Manual sync requests >10/day**

## 🎯 **Immediate Actions for Your Case**

1. **Test webhook delivery** in your development environment
2. **Set up monitoring** for subscription health
3. **Create backup sync mechanisms**
4. **Document troubleshooting procedures**

## 🔒 **Production Deployment Steps**

1. **Audit current subscriptions** for sync issues
2. **Migrate all manual subscriptions** to real Stripe subscriptions
3. **Test webhook delivery** end-to-end
4. **Set up monitoring and alerting**
5. **Deploy with health checks enabled**
6. **Monitor closely for first 48 hours**

This checklist ensures your Stripe integration is production-ready and prevents the sync issues you experienced!
