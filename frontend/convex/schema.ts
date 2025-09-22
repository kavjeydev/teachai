import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { UserIdentity } from "convex/server";

export default defineSchema({
  chats: defineTable({
    chatId: v.string(),
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    isFavorited: v.optional(v.boolean()),
    folderId: v.optional(v.string()),
    // AI model selection for this chat
    selectedModel: v.optional(v.string()), // Default to gpt-4o-mini if not set
    // Custom prompt for this chat
    customPrompt: v.optional(v.string()), // If not set, use default system prompt
    // AI temperature setting (0.0 to 1.0)
    temperature: v.optional(v.number()), // Default to 0.7 if not set
    // Response length setting (max tokens)
    maxTokens: v.optional(v.number()), // Default to 1000 if not set
    content: v.optional(
      v.array(
        v.object({
          user: v.string(),
          sender: v.string(),
          text: v.string(),
          reasoningContext: v.optional(
            v.array(
              v.object({
                chunk_id: v.string(),
                chunk_text: v.string(),
                score: v.number(),
              }),
            ),
          ),
        }),
      ),
    ),
    context: v.optional(
      v.array(
        v.object({
          filename: v.string(),
          fileId: v.string(),
        }),
      ),
    ),
    apiInfo: v.object({
      visibility: v.string(),
    }),
    apiKey: v.string(),
    apiKeyDisabled: v.boolean(),
    hasApiAccess: v.optional(v.boolean()),
    visibility: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_title", ["title"])
    .index("by_fileId", ["context"])
    .index("by_folder", ["folderId"]),

  folders: defineTable({
    name: v.string(),
    userId: v.string(),
    color: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  integration_keys: defineTable({
    keyId: v.string(),
    chatId: v.id("chats"),
    userId: v.string(),
    scopes: v.array(v.string()),
    allowedOrigins: v.array(v.string()),
    rateLimitRpm: v.number(),
    description: v.string(),
    isRevoked: v.boolean(),
    createdAt: v.number(),
    lastUsed: v.optional(v.number()),
    usageCount: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_chat", ["chatId"])
    .index("by_key_id", ["keyId"]),

  api_usage_logs: defineTable({
    integrationKeyId: v.id("integration_keys"),
    chatId: v.id("chats"),
    userId: v.string(),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    tokensUsed: v.number(),
    runId: v.optional(v.string()),
    responseTime: v.optional(v.number()),
    ipAddress: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_key_timestamp", ["integrationKeyId", "timestamp"])
    .index("by_chat_timestamp", ["chatId", "timestamp"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  // Subscription and billing tables
  subscriptions: defineTable({
    userId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    tier: v.string(), // 'free', 'pro', 'team', 'startup'
    status: v.string(), // 'active', 'canceled', 'past_due', 'trialing'
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    // Plan change management
    pendingTier: v.optional(v.string()), // Tier to change to at next billing cycle
    pendingPriceId: v.optional(v.string()), // Price ID for pending tier
    planChangeEffectiveDate: v.optional(v.number()), // When plan change takes effect
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),

  user_credits: defineTable({
    userId: v.string(),
    totalCredits: v.number(), // Total credits available (stored as float)
    usedCredits: v.number(), // Credits used this billing period (stored as float)
    periodStart: v.number(), // When current billing period started
    periodEnd: v.number(), // When current billing period ends
    lastResetAt: v.number(), // When credits were last reset
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  credit_transactions: defineTable({
    userId: v.string(),
    type: v.string(), // 'subscription', 'purchase', 'usage', 'refund'
    amount: v.number(), // Positive for additions, negative for usage (stored as float)
    description: v.string(),
    model: v.optional(v.string()), // Model used for usage transactions
    tokensUsed: v.optional(v.number()), // Actual tokens consumed for usage transactions
    stripePaymentIntentId: v.optional(v.string()), // For purchase transactions
    relatedChatId: v.optional(v.id("chats")), // For usage transactions
    timestamp: v.number(),
  })
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_type", ["type"])
    .index("by_stripe_payment", ["stripePaymentIntentId"]),

  billing_events: defineTable({
    userId: v.string(),
    eventType: v.string(), // 'subscription_created', 'payment_succeeded', 'subscription_canceled', etc.
    stripeEventId: v.string(),
    data: v.any(), // Store the full Stripe event data
    processed: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_event", ["stripeEventId"])
    .index("by_processed", ["processed"]),
});
