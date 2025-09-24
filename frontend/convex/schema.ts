import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { UserIdentity } from "convex/server";

export default defineSchema({
  // App registration table for developers
  apps: defineTable({
    appId: v.string(), // Unique app identifier (app_xxx)
    name: v.string(),
    description: v.optional(v.string()),
    developerId: v.string(), // The developer who created the app
    appSecret: v.string(), // Server-to-server secret for creating users and tokens
    iconUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    privacyPolicyUrl: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    settings: v.object({
      allowDirectUploads: v.boolean(), // Whether users can upload directly
      maxUsersPerApp: v.optional(v.number()),
      allowedCapabilities: v.array(v.string()), // ["ask", "upload", "export_summaries"]
    }),
  })
    .index("by_developer", ["developerId"])
    .index("by_appId", ["appId"]),

  // User authentication tokens (user-controlled, developers cannot access)
  user_auth_tokens: defineTable({
    userAuthToken: v.string(), // Secure token only the user knows (uat_xxx)
    trainlyUserId: v.string(), // The user's Trainly account ID (from Clerk)
    appId: v.optional(v.string()), // Which app this token is for (if app-specific)
    chatId: v.id("chats"), // Their private chat
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // Optional expiry
    isRevoked: v.boolean(),
    lastUsed: v.optional(v.number()),
    capabilities: v.array(v.string()), // What this token can do
  })
    .index("by_token", ["userAuthToken"])
    .index("by_user", ["trainlyUserId"])
    .index("by_app", ["appId"])
    .index("by_chat", ["chatId"]),

  // User-app relationships (OAuth-style authorization)
  user_app_authorizations: defineTable({
    trainlyUserId: v.string(), // User's Trainly account ID
    appId: v.string(),
    chatId: v.id("chats"),
    userAuthToken: v.string(), // Reference to the user's auth token
    authorizedAt: v.number(),
    isRevoked: v.boolean(),
    capabilities: v.array(v.string()),
    lastActiveAt: v.optional(v.number()),
  })
    .index("by_user", ["trainlyUserId"])
    .index("by_app", ["appId"])
    .index("by_user_app", ["trainlyUserId", "appId"])
    .index("by_token", ["userAuthToken"])
    .index("by_chat", ["chatId"]),

  chats: defineTable({
    chatId: v.string(),
    title: v.string(),
    userId: v.string(), // Still the end-user who owns the data
    chatType: v.string(), // "user_direct" or "app_subchat"
    parentAppId: v.optional(v.string()), // If this is a sub-chat under an app
    isArchived: v.boolean(),

    // Enhanced metadata for privacy-first analytics
    metadata: v.optional(
      v.object({
        // User and subchat statistics
        totalSubchats: v.number(), // Number of user subchats under this app
        activeUsers: v.number(), // Users active in last 7 days
        totalUsers: v.number(), // Total users ever provisioned

        // File and storage analytics
        totalFiles: v.number(), // Total files uploaded across all subchats
        totalStorageBytes: v.number(), // Total storage used in bytes
        averageFileSize: v.number(), // Average file size in bytes

        // API usage statistics
        totalQueries: v.number(), // Total API queries made
        queriesLast7Days: v.number(), // Recent query activity
        lastActivityAt: v.number(), // Last API activity timestamp

        // Privacy-safe user activity (no personal data)
        userActivitySummary: v.array(
          v.object({
            userIdHash: v.string(), // Hashed user ID for privacy
            lastActiveAt: v.number(),
            filesUploaded: v.number(),
            queriesMade: v.number(),
            storageUsedBytes: v.number(),
          }),
        ),

        // File type distribution (helps developers understand usage patterns)
        fileTypeStats: v.object({
          pdf: v.number(),
          docx: v.number(),
          txt: v.number(),
          images: v.number(),
          other: v.number(),
        }),

        // Performance metrics
        averageResponseTime: v.number(), // Average API response time in ms
        successRate: v.number(), // Percentage of successful API calls

        // Compliance and audit info
        privacyMode: v.string(), // "privacy_first" or "legacy"
        lastMetadataUpdate: v.number(),
        complianceFlags: v.object({
          gdprCompliant: v.boolean(),
          ccpaCompliant: v.boolean(),
          auditLogEnabled: v.boolean(),
        }),
      }),
    ),
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
    keyType: v.string(), // "app_secret", "scoped_user", "direct_chat"
    chatId: v.optional(v.id("chats")), // For direct chat keys
    userId: v.string(), // The owner of the key
    appId: v.optional(v.string()), // For app-level keys
    endUserId: v.optional(v.string()), // For scoped user tokens
    capabilities: v.array(v.string()), // ["ask", "upload", "export_summaries", "list_files"]
    allowedOrigins: v.array(v.string()),
    rateLimitRpm: v.number(),
    description: v.string(),
    isRevoked: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // For short-lived scoped tokens
    lastUsed: v.optional(v.number()),
    usageCount: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_chat", ["chatId"])
    .index("by_key_id", ["keyId"])
    .index("by_app", ["appId"])
    .index("by_end_user", ["endUserId"])
    .index("by_type", ["keyType"]),

  // Audit logs for all app->user data access
  app_audit_logs: defineTable({
    appId: v.string(),
    endUserId: v.string(),
    chatId: v.string(),
    action: v.string(), // "ask", "upload", "export", "list_files", "download_file"
    requestedCapability: v.string(),
    allowed: v.boolean(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    usedNodeIds: v.optional(v.array(v.string())), // Which chunks were accessed
    timestamp: v.number(),
    metadata: v.optional(
      v.object({
        question: v.optional(v.string()),
        filename: v.optional(v.string()),
        errorReason: v.optional(v.string()),
      }),
    ),
  })
    .index("by_app", ["appId"])
    .index("by_user", ["endUserId"])
    .index("by_app_user", ["appId", "endUserId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]),

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
  }).index("by_user", ["userId"]),

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

  // File upload queue system
  file_upload_queue: defineTable({
    userId: v.string(),
    chatId: v.id("chats"),
    queueId: v.string(), // Unique identifier for this upload batch
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    filePath: v.optional(v.string()), // For folder uploads, store the relative path
    status: v.string(), // 'pending', 'processing', 'completed', 'failed', 'cancelled'
    progress: v.number(), // 0-100
    error: v.optional(v.string()),
    fileId: v.optional(v.string()), // Generated file ID after processing
    extractedTextLength: v.optional(v.number()),
    nodesCreated: v.optional(v.number()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_chat", ["chatId"])
    .index("by_queue", ["queueId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  upload_queues: defineTable({
    queueId: v.string(),
    userId: v.string(),
    chatId: v.id("chats"),
    name: v.string(), // Display name for the upload batch
    totalFiles: v.number(),
    completedFiles: v.number(),
    failedFiles: v.number(),
    status: v.string(), // 'active', 'completed', 'failed', 'cancelled'
    isFolder: v.boolean(), // True if this was a folder upload
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_chat", ["chatId"])
    .index("by_queue_id", ["queueId"])
    .index("by_status", ["status"]),
});
