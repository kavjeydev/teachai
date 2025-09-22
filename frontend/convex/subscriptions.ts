import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user's current subscription
export const getUserSubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      // Return free tier as default
      return {
        tier: 'free',
        status: 'active',
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
      };
    }

    return subscription;
  },
});

// Get user's credit balance
export const getUserCredits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const credits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!credits) {
      // Return default free tier values - initialization will happen in a mutation
      const now = Date.now();
      const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days

      return {
        totalCredits: 500,
        usedCredits: 0,
        remainingCredits: 500,
        periodStart: now,
        periodEnd: periodEnd,
      };
    }

    return {
      ...credits,
      remainingCredits: credits.totalCredits - credits.usedCredits,
    };
  },
});

// Create or update subscription
export const createSubscription = mutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    tier: v.string(),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Check if subscription already exists
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        tier: args.tier,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      });

      return existing._id;
    } else {
      // Create new subscription
      return await ctx.db.insert("subscriptions", {
        userId: userId,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        tier: args.tier,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update credit balance (for subscription renewals or credit purchases)
export const updateUserCredits = mutation({
  args: {
    userId: v.optional(v.string()), // Allow external calls to specify userId
    totalCredits: v.number(),
    resetUsage: v.optional(v.boolean()),
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
      userId = identity.subject;
    }

    const existing = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalCredits: args.totalCredits,
        usedCredits: args.resetUsage ? 0 : existing.usedCredits,
        periodStart: args.periodStart || existing.periodStart,
        periodEnd: args.periodEnd || existing.periodEnd,
        lastResetAt: args.resetUsage ? now : existing.lastResetAt,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("user_credits", {
        userId: userId,
        totalCredits: args.totalCredits,
        usedCredits: 0,
        periodStart: args.periodStart || now,
        periodEnd: args.periodEnd || (now + 30 * 24 * 60 * 60 * 1000),
        lastResetAt: now,
        updatedAt: now,
      });
    }

    return { success: true, totalCredits: args.totalCredits, resetUsage: args.resetUsage };
  },
});

// Consume credits (called when AI models are used)
export const consumeCredits = mutation({
  args: {
    credits: v.number(),
    model: v.string(),
    tokensUsed: v.number(),
    chatId: v.optional(v.id("chats")),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Get current credit balance
    const userCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userCredits) {
      throw new Error("No credit balance found");
    }

    // Check if user has enough credits
    const remainingCredits = userCredits.totalCredits - userCredits.usedCredits;
    if (remainingCredits < args.credits) {
      throw new Error("Insufficient credits");
    }

    // Update credit usage
    await ctx.db.patch(userCredits._id, {
      usedCredits: userCredits.usedCredits + args.credits,
      updatedAt: Date.now(),
    });

    // Log the transaction
    await ctx.db.insert("credit_transactions", {
      userId: identity.subject,
      type: "usage",
      amount: -args.credits, // Negative for usage
      description: args.description,
      model: args.model,
      tokensUsed: args.tokensUsed,
      relatedChatId: args.chatId,
      timestamp: Date.now(),
    });

    return {
      creditsUsed: args.credits,
      remainingCredits: remainingCredits - args.credits,
    };
  },
});

// Get credit usage history
export const getCreditHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const transactions = await ctx.db
      .query("credit_transactions")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);

    return transactions;
  },
});

// Log billing events from Stripe webhooks
export const logBillingEvent = mutation({
  args: {
    userId: v.optional(v.string()),
    eventType: v.string(),
    stripeEventId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
      userId = identity.subject;
    }

    await ctx.db.insert("billing_events", {
      userId: userId,
      eventType: args.eventType,
      stripeEventId: args.stripeEventId,
      data: args.data,
      processed: true,
      timestamp: Date.now(),
    });
  },
});

// Initialize user credits (called when user first uses the app)
export const initializeUserCredits = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Check if credits already exist
    const existing = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing; // Already initialized
    }

    // Initialize free tier credits
    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    const creditId = await ctx.db.insert("user_credits", {
      userId: userId,
      totalCredits: 500, // Free tier: 500 credits
      usedCredits: 0,
      periodStart: now,
      periodEnd: periodEnd,
      lastResetAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(creditId);
  },
});

// Manual function to give user Pro subscription (for testing)
export const giveUserProSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days from now

    // Create Pro subscription
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tier: 'pro',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: userId,
        stripeCustomerId: 'test_customer',
        stripeSubscriptionId: 'test_subscription',
        stripePriceId: 'test_price',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Give Pro credits (10,000)
    const existingCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingCredits) {
      await ctx.db.patch(existingCredits._id, {
        totalCredits: 10000,
        usedCredits: 0,
        periodStart: now,
        periodEnd: periodEnd,
        lastResetAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("user_credits", {
        userId: userId,
        totalCredits: 10000,
        usedCredits: 0,
        periodStart: now,
        periodEnd: periodEnd,
        lastResetAt: now,
        updatedAt: now,
      });
    }

    return { success: true, tier: 'pro', credits: 10000 };
  },
});

// Schedule plan change for next billing cycle
export const schedulePlanChange = mutation({
  args: {
    newTier: v.string(),
    newPriceId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Get current subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    const now = Date.now();

    // Update subscription with pending plan change
    await ctx.db.patch(subscription._id, {
      pendingTier: args.newTier,
      pendingPriceId: args.newPriceId,
      planChangeEffectiveDate: subscription.currentPeriodEnd,
      updatedAt: now,
    });

    return {
      success: true,
      currentTier: subscription.tier,
      pendingTier: args.newTier,
      effectiveDate: subscription.currentPeriodEnd,
    };
  },
});

// Cancel pending plan change (user changed their mind)
export const cancelPendingPlanChange = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Get current subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    const now = Date.now();

    // Remove pending plan change
    await ctx.db.patch(subscription._id, {
      pendingTier: undefined,
      pendingPriceId: undefined,
      planChangeEffectiveDate: undefined,
      updatedAt: now,
    });

    return {
      success: true,
      message: "Pending plan change has been canceled",
    };
  },
});

// Get detailed subscription info including pending changes
export const getDetailedSubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const userId = identity.subject;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      return {
        tier: 'free',
        status: 'active',
        hasPendingChange: false,
      };
    }

    return {
      ...subscription,
      hasPendingChange: !!subscription.pendingTier,
      daysUntilChange: subscription.planChangeEffectiveDate
        ? Math.ceil((subscription.planChangeEffectiveDate - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
    };
  },
});

// Apply pending plan changes (called by webhook or cron job)
export const applyPendingPlanChanges = mutation({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find subscription by Stripe subscription ID
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) => q.eq("stripeSubscriptionId", args.subscriptionId))
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Check if there's a pending change and if it's time to apply it
    if (!subscription.pendingTier || !subscription.planChangeEffectiveDate) {
      return { success: false, message: "No pending plan change" };
    }

    const now = Date.now();
    if (now < subscription.planChangeEffectiveDate) {
      return { success: false, message: "Plan change not yet effective" };
    }

    // Apply the plan change
    await ctx.db.patch(subscription._id, {
      tier: subscription.pendingTier,
      stripePriceId: subscription.pendingPriceId || subscription.stripePriceId,
      pendingTier: undefined,
      pendingPriceId: undefined,
      planChangeEffectiveDate: undefined,
      updatedAt: now,
    });

    // Update user credits based on new tier
    const creditsForTier = getTierCredits(subscription.pendingTier);

    const userCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", subscription.userId))
      .first();

    if (userCredits) {
      await ctx.db.patch(userCredits._id, {
        totalCredits: creditsForTier,
        // Keep current usage, don't reset on plan change
        updatedAt: now,
      });
    }

    return {
      success: true,
      newTier: subscription.pendingTier,
      newCredits: creditsForTier,
    };
  },
});

// Helper function to get credits for each tier
function getTierCredits(tier: string): number {
  switch (tier) {
    case 'pro': return 10000;
    case 'team': return 30000;
    case 'startup': return 100000;
    case 'free':
    default: return 500;
  }
}

// Manual subscription activation for testing (when webhooks aren't working)
export const manuallyActivateSubscription = mutation({
  args: {
    tier: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    const tierCredits = getTierCredits(args.tier);

    // Get or create subscription
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        tier: args.tier,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      });
    } else {
      // Create new subscription
      await ctx.db.insert("subscriptions", {
        userId: userId,
        stripeCustomerId: `manual_${args.tier}_customer`,
        stripeSubscriptionId: `manual_${args.tier}_${now}`,
        stripePriceId: `manual_${args.tier}_price`,
        tier: args.tier,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Get or create user credits
    const existingCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingCredits) {
      // Update existing credits - reset to full plan amount
      await ctx.db.patch(existingCredits._id, {
        totalCredits: tierCredits,
        usedCredits: 0, // Reset usage to 0
        periodStart: now,
        periodEnd: periodEnd,
        lastResetAt: now,
        updatedAt: now,
      });
    } else {
      // Create new credit record
      await ctx.db.insert("user_credits", {
        userId: userId,
        totalCredits: tierCredits,
        usedCredits: 0,
        periodStart: now,
        periodEnd: periodEnd,
        lastResetAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      tier: args.tier,
      credits: tierCredits,
      message: `Successfully activated ${args.tier} subscription with ${tierCredits} credits`,
    };
  },
});
