import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

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
        tier: "free",
        status: "active",
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
      };
    }

    return subscription;
  },
});

// Get subscription by userId (for server-side API calls without auth context)
export const getSubscriptionByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      return {
        tier: "free",
        status: "active",
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
      };
    }

    return subscription;
  },
});

// Get subscription by Stripe subscription ID (for webhook processing)
export const getSubscriptionByStripeId = query({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();

    return subscription || null;
  },
});

// Get user credits (backend-safe, no auth required)
export const getUserCreditsBackend = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!credits) {
      // Return default free tier values
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
      totalCredits: credits.totalCredits,
      usedCredits: credits.usedCredits,
      remainingCredits: credits.totalCredits - credits.usedCredits,
      periodStart: credits.periodStart,
      periodEnd: credits.periodEnd,
    };
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
      // Return default free tier values - initialization will happen in consumeCredits
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
        throw new Error("Not authenticated and no userId provided");
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
        periodEnd: args.periodEnd || now + 30 * 24 * 60 * 60 * 1000,
        lastResetAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      totalCredits: args.totalCredits,
      resetUsage: args.resetUsage,
    };
  },
});

// Add credits to user balance (for one-time credit purchases)
export const addUserCredits = mutation({
  args: {
    userId: v.string(),
    creditsToAdd: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Add to existing balance
      await ctx.db.patch(existing._id, {
        totalCredits: existing.totalCredits + args.creditsToAdd,
        updatedAt: now,
      });
    } else {
      // Create new credit record
      await ctx.db.insert("user_credits", {
        userId: args.userId,
        totalCredits: args.creditsToAdd,
        usedCredits: 0,
        periodStart: now,
        periodEnd: now + 30 * 24 * 60 * 60 * 1000,
        lastResetAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      creditsAdded: args.creditsToAdd,
      newTotal: existing
        ? existing.totalCredits + args.creditsToAdd
        : args.creditsToAdd,
    };
  },
});

// Log credit transaction
export const logCreditTransaction = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    amount: v.number(),
    description: v.string(),
    stripeSessionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("credit_transactions", {
      userId: args.userId,
      type: args.type,
      amount: args.amount,
      description: args.description,
      // Note: stripeSessionId and stripePriceId are not in the current schema
      // but we'll store them in the description for now
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Manual credit addition (for testing/emergency use)
export const manuallyAddCredits = mutation({
  args: {
    creditsToAdd: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const existing = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Add to existing balance
      await ctx.db.patch(existing._id, {
        totalCredits: existing.totalCredits + args.creditsToAdd,
        updatedAt: now,
      });

      // Log the transaction
      await ctx.db.insert("credit_transactions", {
        userId: userId,
        type: "manual_addition",
        amount: args.creditsToAdd,
        description: `Manual credit addition: ${args.reason}`,
        timestamp: now,
      });

      return {
        success: true,
        creditsAdded: args.creditsToAdd,
        newTotal: existing.totalCredits + args.creditsToAdd,
        previousTotal: existing.totalCredits,
      };
    } else {
      throw new Error("No existing credit record found");
    }
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
    let userCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userCredits) {
      // Auto-initialize credits for users who don't have them yet
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

      userCredits = await ctx.db.get(creditId);
      if (!userCredits) {
        throw new Error("Failed to initialize credit balance");
      }
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

    // If no userId provided, try to get from auth context (for client calls)
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated and no userId provided");
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
  args: {
    shadowUserId: v.optional(v.string()), // Optional shadow account userId to migrate
    email: v.optional(v.string()), // Optional email to check for shadow account
  },
  handler: async (ctx, args) => {
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

    // Try to get email from identity if not provided
    // Clerk JWT may include email in claims
    let emailToCheck = args.email;
    if (!emailToCheck && (identity as any).email) {
      emailToCheck = (identity as any).email;
    }
    // Also try emailAddresses array if available
    if (
      !emailToCheck &&
      (identity as any).emailAddresses &&
      Array.isArray((identity as any).emailAddresses) &&
      (identity as any).emailAddresses.length > 0
    ) {
      emailToCheck = (identity as any).emailAddresses[0].emailAddress;
    }

    // Try to migrate shadow account by email first (if we have an email and no existing credits)
    if (emailToCheck && !existing) {
      try {
        // Find shadow account by email
        const shadowAccount = await ctx.db
          .query("shadow_accounts")
          .withIndex("by_email", (q) =>
            q.eq("email", emailToCheck!.toLowerCase()),
          )
          .filter((q) => q.eq(q.field("migrated"), false))
          .first();

        if (shadowAccount) {
          // Call migration function
          const migrationResult = await (ctx as any).runMutation(
            "shadow_accounts/migrateShadowAccountToUser",
            {
              shadowUserId: shadowAccount.shadowUserId,
            },
          );

          if (migrationResult?.success) {
            // Re-fetch credits after migration
            const migratedCredits = await ctx.db
              .query("user_credits")
              .withIndex("by_user", (q) => q.eq("userId", userId))
              .first();
            if (migratedCredits) {
              return migratedCredits;
            }
          }
        }
      } catch (error) {
        // Migration failed, continue with normal initialization
        console.error("Failed to migrate shadow account by email:", error);
      }
    }

    if (existing) {
      // If shadowUserId is provided, try to migrate shadow account
      if (args.shadowUserId) {
        try {
          await (ctx as any).runMutation(
            "shadow_accounts/migrateShadowAccountToUser",
            {
              shadowUserId: args.shadowUserId,
            },
          );
          // Re-fetch credits after migration
          const updatedCredits = await ctx.db
            .query("user_credits")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
          return updatedCredits || existing;
        } catch (error) {
          // Migration failed, return existing credits
          console.error("Failed to migrate shadow account:", error);
          return existing;
        }
      }
      return existing; // Already initialized
    }

    // If shadowUserId is provided, try to migrate shadow account first
    if (args.shadowUserId) {
      try {
        await (ctx as any).runMutation(
          "shadow_accounts/migrateShadowAccountToUser",
          {
            shadowUserId: args.shadowUserId,
          },
        );
        // Re-fetch credits after migration
        const migratedCredits = await ctx.db
          .query("user_credits")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
        if (migratedCredits) {
          return migratedCredits;
        }
      } catch (error) {
        // Migration failed, continue with normal initialization
        console.error("Failed to migrate shadow account:", error);
      }
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

// Update customer ID for existing subscription
export const updateCustomerId = mutation({
  args: {
    userId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        stripeCustomerId: args.stripeCustomerId,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Create subscription record for free users who access billing portal
export const createFreeUserRecord = mutation({
  args: {
    userId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already has a subscription record
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        updatedAt: Date.now(),
      });
    } else {
      // Create new free tier record
      await ctx.db.insert("subscriptions", {
        userId: args.userId,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: "", // No subscription yet
        stripePriceId: "", // No price yet
        tier: "free",
        status: "active",
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        cancelAtPeriodEnd: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Clean up test subscription (removes test subscription data)
export const cleanupTestSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Find and remove test subscriptions
    const testSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.or(
          q.eq(q.field("stripeCustomerId"), "test_customer"),
          q.eq(q.field("stripeSubscriptionId"), "test_subscription"),
        ),
      )
      .first();

    if (testSubscription) {
      await ctx.db.delete(testSubscription._id);
      return { success: true, message: "Test subscription removed" };
    }

    return { success: false, message: "No test subscription found" };
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
        tier: "pro",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: userId,
        stripeCustomerId: "test_customer",
        stripeSubscriptionId: "test_subscription",
        stripePriceId: "test_price",
        tier: "pro",
        status: "active",
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

    return { success: true, tier: "pro", credits: 10000 };
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
        tier: "free",
        status: "active",
        hasPendingChange: false,
      };
    }

    return {
      ...subscription,
      hasPendingChange: !!subscription.pendingTier,
      daysUntilChange: subscription.planChangeEffectiveDate
        ? Math.ceil(
            (subscription.planChangeEffectiveDate - Date.now()) /
              (1000 * 60 * 60 * 24),
          )
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
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.subscriptionId),
      )
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
    case "pro":
      return 10000;
    case "scale":
      return 100000;
    case "enterprise":
      return 1000000; // 1M credits for enterprise
    case "free":
    default:
      return 500;
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
        status: "active",
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
        status: "active",
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

// Cancel subscription
export const cancelSubscription = mutation({
  args: {
    userId: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        status: "canceled",
        cancelAtPeriodEnd: true,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Update subscription status
export const updateSubscriptionStatus = mutation({
  args: {
    userId: v.string(),
    stripeSubscriptionId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (
      subscription &&
      subscription.stripeSubscriptionId === args.stripeSubscriptionId
    ) {
      await ctx.db.patch(subscription._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Debug function to check subscription status
export const debugUserSubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Get all subscriptions for debugging
    const allSubscriptions = await ctx.db.query("subscriptions").collect();

    const userSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      userId,
      userSubscription,
      totalSubscriptions: allSubscriptions.length,
      allUserIds: allSubscriptions.map((s) => s.userId).slice(0, 5), // First 5 user IDs for comparison
    };
  },
});

// Force create Pro subscription (for fixing missing subscriptions)
export const forceCreateProSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    // Delete any existing subscription first
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Create new Pro subscription
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: userId,
      stripeCustomerId: "manual_pro_customer",
      stripeSubscriptionId: "manual_pro_subscription",
      stripePriceId: "manual_pro_price",
      tier: "pro",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });

    // Create/update Pro credits
    const existingCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingCredits) {
      await ctx.db.patch(existingCredits._id, {
        totalCredits: 10000,
        usedCredits: existingCredits.usedCredits, // Keep existing usage
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

    return {
      success: true,
      subscriptionId,
      message: "Pro subscription created successfully",
    };
  },
});

// Server-side subscription update (for API routes without auth context)
export const updateSubscriptionForUser = mutation({
  args: {
    userId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    tier: v.string(),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    // This function doesn't require authentication since it's called from server-side API routes
    // Find the user's subscription
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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
        userId: args.userId,
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
