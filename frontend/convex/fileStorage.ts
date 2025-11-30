import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper function to calculate tokens from text (same approximation as used elsewhere)
// Formula: tokens = Math.ceil(text.length / 4)
// This approximates OpenAI's tokenizer where ~4 characters = 1 token
// Example: "Hello world" (11 chars) = Math.ceil(11/4) = 3 tokens
function calculateTokensFromText(text: string): number {
  return Math.ceil(text.length / 4);
}

// Helper function to convert tokens to Knowledge Units (1 KU = ~500 tokens)
// Formula: KU = Math.ceil(tokens / 500)
// Example: 1000 tokens = Math.ceil(1000/500) = 2 KU
// Example: 250 tokens = Math.ceil(250/500) = 1 KU
function tokensToKnowledgeUnits(tokens: number): number {
  return Math.ceil(tokens / 500);
}

// Helper function to convert Knowledge Units to tokens
function knowledgeUnitsToTokens(ku: number): number {
  return ku * 500;
}

// Helper function to format Knowledge Units for display
function formatKnowledgeUnits(ku: number): string {
  if (ku >= 1000000) {
    return `${(ku / 1000000).toFixed(1)}M KU`;
  } else if (ku >= 1000) {
    return `${(ku / 1000).toFixed(1)}K KU`;
  }
  return `${ku} KU`;
}

// Helper function to get current month-year string (e.g., "2024-01")
function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Helper function to get period start/end timestamps for current month
function getCurrentMonthPeriod(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return {
    start: start.getTime(),
    end: end.getTime(),
  };
}

// Get user's current file storage usage
export const getUserFileStorage = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const storage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!storage) {
      // Return default values if no storage record exists
      return {
        totalFileSizeBytes: 0,
        fileCount: 0,
        lastUpdated: Date.now(),
        chatFileSizes: {},
      };
    }

    return storage;
  },
});

// Add file size to user's storage tracking
export const addFileSize = mutation({
  args: {
    chatId: v.string(), // Chat ID as string
    fileSize: v.number(),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get current storage or create new one
    let storage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!storage) {
      // Create new storage record
      const storageId = await ctx.db.insert("user_file_storage", {
        userId,
        totalFileSizeBytes: args.fileSize,
        fileCount: 1,
        lastUpdated: Date.now(),
        chatFileSizes: { [args.chatId]: args.fileSize },
      });

      return {
        totalFileSizeBytes: args.fileSize,
        fileCount: 1,
        newRecord: true,
      };
    }

    // Update existing storage record
    const chatFileSizes = storage.chatFileSizes || {};
    const currentChatSize = chatFileSizes[args.chatId] || 0;
    const newChatSize = currentChatSize + args.fileSize;
    const newChatFileSizes = {
      ...chatFileSizes,
      [args.chatId]: newChatSize,
    };

    await ctx.db.patch(storage._id, {
      totalFileSizeBytes: storage.totalFileSizeBytes + args.fileSize,
      fileCount: storage.fileCount + 1,
      lastUpdated: Date.now(),
      chatFileSizes: newChatFileSizes,
    });

    return {
      totalFileSizeBytes: storage.totalFileSizeBytes + args.fileSize,
      fileCount: storage.fileCount + 1,
      newRecord: false,
    };
  },
});

// Remove file size from user's storage tracking
// IMPORTANT: This does NOT refund ingestion tokens - tokens are consumed when content is ingested,
// and deleting a file does not undo the processing work. Tokens are only refunded if upload fails.
export const removeFileSize = mutation({
  args: {
    chatId: v.string(), // Chat ID as string
    fileSize: v.number(),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const storage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!storage) {
      // No storage record found, nothing to remove
      return {
        totalFileSizeBytes: 0,
        fileCount: 0,
        error: "No storage record found",
      };
    }

    // Calculate new values
    const newTotalSize = Math.max(
      0,
      storage.totalFileSizeBytes - args.fileSize,
    );
    const newFileCount = Math.max(0, storage.fileCount - 1);

    // Update chat-specific size tracking
    const chatFileSizes = storage.chatFileSizes || {};
    const currentChatSize = chatFileSizes[args.chatId] || 0;
    const newChatSize = Math.max(0, currentChatSize - args.fileSize);
    const newChatFileSizes = {
      ...chatFileSizes,
      [args.chatId]: newChatSize,
    };

    // Remove chat entry if size is 0
    if (newChatSize === 0) {
      delete newChatFileSizes[args.chatId];
    }

    await ctx.db.patch(storage._id, {
      totalFileSizeBytes: newTotalSize,
      fileCount: newFileCount,
      lastUpdated: Date.now(),
      chatFileSizes: newChatFileSizes,
    });

    return {
      totalFileSizeBytes: newTotalSize,
      fileCount: newFileCount,
      removed: true,
    };
  },
});

// Add tokens to monthly ingestion tracking
export const addTokenIngestion = mutation({
  args: {
    userId: v.string(),
    tokens: v.number(),
  },
  handler: async (ctx, args) => {
    const monthYear = getCurrentMonthYear();
    const period = getCurrentMonthPeriod();

    // Find or create token ingestion record for this month
    let ingestion = await ctx.db
      .query("token_ingestion")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", args.userId).eq("monthYear", monthYear),
      )
      .first();

    if (!ingestion) {
      // Create new record for this month
      await ctx.db.insert("token_ingestion", {
        userId: args.userId,
        monthYear,
        tokensIngested: args.tokens,
        periodStart: period.start,
        periodEnd: period.end,
        lastUpdated: Date.now(),
      });
    } else {
      // Update existing record
      await ctx.db.patch(ingestion._id, {
        tokensIngested: ingestion.tokensIngested + args.tokens,
        lastUpdated: Date.now(),
      });
    }

    return { success: true };
  },
});

// Refund tokens from monthly ingestion tracking
// IMPORTANT: Only call this when a file upload FAILS, NOT when a file is deleted
// Deletion should NOT refund tokens - once content is ingested, tokens are consumed
export const refundTokenIngestion = mutation({
  args: {
    userId: v.string(),
    tokens: v.number(),
  },
  handler: async (ctx, args) => {
    const monthYear = getCurrentMonthYear();

    // Find token ingestion record for this month
    const ingestion = await ctx.db
      .query("token_ingestion")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", args.userId).eq("monthYear", monthYear),
      )
      .first();

    if (!ingestion) {
      // No ingestion record found - nothing to refund
      return {
        success: false,
        reason: "No ingestion record found for this month",
      };
    }

    // Refund tokens (subtract from total, but don't go below 0)
    const newTokensIngested = Math.max(
      0,
      ingestion.tokensIngested - args.tokens,
    );

    await ctx.db.patch(ingestion._id, {
      tokensIngested: newTokensIngested,
      lastUpdated: Date.now(),
    });

    return {
      success: true,
      tokensRefunded: args.tokens,
      previousTokens: ingestion.tokensIngested,
      newTokens: newTokensIngested,
    };
  },
});

// Get current month's token ingestion for a user
export const getCurrentTokenIngestion = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const monthYear = getCurrentMonthYear();

    const ingestion = await ctx.db
      .query("token_ingestion")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", args.userId).eq("monthYear", monthYear),
      )
      .first();

    // Ensure we always have a valid number, defaulting to 0 for new users
    const tokensIngested =
      (typeof ingestion?.tokensIngested === 'number' && !isNaN(ingestion.tokensIngested))
        ? ingestion.tokensIngested
        : 0;
    const knowledgeUnitsIngested = tokensToKnowledgeUnits(tokensIngested);

    return {
      tokensIngested,
      knowledgeUnitsIngested, // Add Knowledge Units for display
      knowledgeUnitsFormatted: formatKnowledgeUnits(knowledgeUnitsIngested), // Formatted string
      monthYear,
      periodStart: ingestion?.periodStart || getCurrentMonthPeriod().start,
      periodEnd: ingestion?.periodEnd || getCurrentMonthPeriod().end,
    };
  },
});

// Check if user can upload based on actual tokens (called after text extraction)
export const checkUploadLimitsWithTokens = mutation({
  args: {
    chatId: v.id("chats"),
    actualTokens: v.number(), // Actual tokens from extracted text
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get the chat to determine storage tracking
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found.");
    }

    // Determine which chat's storage to check for limits
    let targetChat = chat;
    let targetUserId = userId;
    let parentChat = null;

    // If this is a subchat, we need to check against the parent chat's aggregated limits
    if (chat.chatType === "app_subchat") {
      if (chat.parentChatId) {
        parentChat = await ctx.db
          .query("chats")
          .filter((q) => q.eq(q.field("chatId"), chat.parentChatId))
          .first();
      } else if (chat.parentAppId) {
        parentChat = await ctx.db
          .query("chats")
          .filter((q) => q.eq(q.field("chatId"), chat.parentAppId))
          .first();
      }

      if (parentChat) {
        targetChat = parentChat;
        targetUserId = parentChat.userId;
      }
    }

    // Get user's subscription to determine tier
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .first();

    // Determine tier limits
    let maxMonthlyTokens = 100000; // Free: 100k tokens/month = 200 KU
    let tierName = "free";

    if (subscription && subscription.status === "active") {
      tierName = subscription.tier;
      switch (subscription.tier) {
        case "pro":
          maxMonthlyTokens = 2000000; // Pro: 2M tokens/month = 4K KU
          break;
        case "scale":
          maxMonthlyTokens = 10000000; // Scale: 10M tokens/month = 20K KU
          break;
        case "enterprise":
          maxMonthlyTokens = 50000000; // Enterprise: 50M tokens/month = 100K KU
          break;
      }
    }

    // Get current month's token ingestion
    const monthYear = getCurrentMonthYear();
    const currentIngestion = await ctx.db
      .query("token_ingestion")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", targetUserId).eq("monthYear", monthYear),
      )
      .first();

    const currentTokensIngested = currentIngestion?.tokensIngested || 0;
    const actualKU = tokensToKnowledgeUnits(args.actualTokens);
    const currentKU = tokensToKnowledgeUnits(currentTokensIngested);
    const maxMonthlyKU = tokensToKnowledgeUnits(maxMonthlyTokens);

    // Check if adding these tokens would exceed limit
    const wouldExceedLimit =
      currentTokensIngested + args.actualTokens > maxMonthlyTokens;

    return {
      canUpload: !wouldExceedLimit,
      error: wouldExceedLimit
        ? `Upload would exceed monthly ingestion limit of ${formatKnowledgeUnits(maxMonthlyKU)} for ${tierName} tier. Current usage: ${formatKnowledgeUnits(currentKU)}, this file: ${formatKnowledgeUnits(actualKU)}`
        : null,
      currentTokensIngested,
      actualTokens: args.actualTokens,
      maxMonthlyTokens,
    };
  },
});

// Check if user can upload a file based on their tier limits
// Now uses token-based ingestion limits instead of storage size
export const checkUploadLimits = query({
  args: {
    fileSize: v.number(),
    fileName: v.string(),
    chatId: v.id("chats"),
    estimatedTokens: v.optional(v.number()), // Optional: estimated tokens from extracted text
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get the chat to determine storage tracking
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found.");
    }

    // Determine which chat's storage to check for limits
    let targetChat = chat;
    let targetUserId = userId;
    let parentChat = null;

    // If this is a subchat, we need to check against the parent chat's aggregated limits
    if (chat.chatType === "app_subchat") {
      // Try parentChatId first (more efficient), then fallback to parentAppId
      if (chat.parentChatId) {
        parentChat = await ctx.db
          .query("chats")
          .filter((q) => q.eq(q.field("chatId"), chat.parentChatId))
          .first();
      } else if (chat.parentAppId) {
        parentChat = await ctx.db
          .query("chats")
          .filter((q) => q.eq(q.field("chatId"), chat.parentAppId))
          .first();
      }

      if (parentChat) {
        targetChat = parentChat;
        targetUserId = parentChat.userId; // Use parent chat owner's limits
      }
    }

    // Get user's subscription to determine tier
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .first();

    // Determine tier limits
    // File size limits are now hard caps (safety limits only)
    let maxFileSizeMB = 50; // Free tier: 50MB hard cap
    let maxFiles = 50;
    let maxMonthlyTokens = 100000; // Free: 100k tokens/month = 200 KU
    let tierName = "free";

    if (subscription && subscription.status === "active") {
      tierName = subscription.tier;
      switch (subscription.tier) {
        case "pro":
          maxFileSizeMB = 200; // Pro: 200MB hard cap
          maxFiles = 200;
          maxMonthlyTokens = 2000000; // Pro: 2M tokens/month = 4K KU
          break;
        case "scale":
          maxFileSizeMB = 500; // Scale: 500MB hard cap
          maxFiles = 1000;
          maxMonthlyTokens = 10000000; // Scale: 10M tokens/month = 20K KU
          break;
        case "enterprise":
          maxFileSizeMB = 500; // Enterprise: 500MB+ hard cap
          maxFiles = 5000;
          maxMonthlyTokens = 50000000; // Enterprise: 50M tokens/month = 100K KU
          break;
      }
    }

    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    // Get current month's token ingestion
    const monthYear = getCurrentMonthYear();
    const currentIngestion = await ctx.db
      .query("token_ingestion")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", targetUserId).eq("monthYear", monthYear),
      )
      .first();

    const currentTokensIngested = currentIngestion?.tokensIngested || 0;

    // Estimate tokens from file if not provided
    // For now, we'll use a conservative estimate: assume 1 token per 4 characters
    // This will be updated with actual extracted text tokens after processing
    const estimatedTokens =
      args.estimatedTokens || Math.ceil(args.fileSize / 4); // Rough estimate: 1 token per 4 bytes

    // Convert to Knowledge Units for display
    const maxMonthlyKU = tokensToKnowledgeUnits(maxMonthlyTokens);
    const currentKU = tokensToKnowledgeUnits(currentTokensIngested);
    const estimatedKU = tokensToKnowledgeUnits(estimatedTokens);
    const remainingKU = tokensToKnowledgeUnits(
      Math.max(0, maxMonthlyTokens - currentTokensIngested),
    );

    // Check limits
    const checks = {
      fileSizeOk: args.fileSize <= maxFileSizeBytes, // Hard cap check
      tokenIngestionOk:
        currentTokensIngested + estimatedTokens <= maxMonthlyTokens, // Token quota check
      fileCountOk: true, // File count check removed - not a limiting factor anymore
    };

    const canUpload = checks.fileSizeOk && checks.tokenIngestionOk;

    return {
      canUpload,
      checks,
      limits: {
        maxFileSizeMB,
        maxMonthlyTokens,
        maxMonthlyKU, // Add Knowledge Units for display
        maxFiles,
        tierName,
      },
      current: {
        tokensIngested: currentTokensIngested,
        tokensRemaining: Math.max(0, maxMonthlyTokens - currentTokensIngested),
        knowledgeUnitsIngested: currentKU, // Add Knowledge Units for display
        knowledgeUnitsRemaining: remainingKU, // Add Knowledge Units for display
        fileSizeMB: Math.round((args.fileSize / (1024 * 1024)) * 100) / 100,
      },
      errors: {
        fileSizeError: !checks.fileSizeOk
          ? `File size (${Math.round((args.fileSize / (1024 * 1024)) * 100) / 100}MB) exceeds hard cap of ${maxFileSizeMB}MB for ${tierName} tier`
          : null,
        tokenIngestionError: !checks.tokenIngestionOk
          ? `Upload would exceed monthly ingestion limit of ${formatKnowledgeUnits(maxMonthlyKU)} for ${tierName} tier. Current usage: ${formatKnowledgeUnits(currentKU)}, estimated: ${formatKnowledgeUnits(estimatedKU)}`
          : null,
      },
    };
  },
});

// Get storage usage statistics for a user (now returns Knowledge Units instead of storage MB)
export const getStorageStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get user's subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get current month's token ingestion
    // This query is reactive - it will automatically update when token_ingestion table changes
    // The backend calls addTokenIngestion mutation after file processing completes
    const monthYear = getCurrentMonthYear();
    const currentIngestion = await ctx.db
      .query("token_ingestion")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", userId).eq("monthYear", monthYear),
      )
      .first();

    // Ensure we always have a valid number, defaulting to 0 for new users
    const currentTokensIngested =
      (typeof currentIngestion?.tokensIngested === 'number' && !isNaN(currentIngestion.tokensIngested))
        ? currentIngestion.tokensIngested
        : 0;
    const currentKnowledgeUnits = tokensToKnowledgeUnits(currentTokensIngested);

    // Debug logging (can be removed in production)
    console.log(
      `[getStorageStats] User ${userId.substring(0, 8)}... | Tokens: ${currentTokensIngested.toLocaleString()} | KU: ${currentKnowledgeUnits} | Month: ${monthYear}`,
    );

    // Determine tier limits (in Knowledge Units)
    let maxMonthlyTokens = 100000; // Free: 100k tokens/month = 200 KU
    let maxKnowledgeUnits = 200;
    let tierName = "free";

    if (subscription && subscription.status === "active") {
      tierName = subscription.tier;
      switch (subscription.tier) {
        case "pro":
          maxMonthlyTokens = 2000000; // Pro: 2M tokens/month = 4K KU
          maxKnowledgeUnits = 4000;
          break;
        case "scale":
          maxMonthlyTokens = 10000000; // Scale: 10M tokens/month = 20K KU
          maxKnowledgeUnits = 20000;
          break;
        case "enterprise":
          maxMonthlyTokens = 50000000; // Enterprise: 50M tokens/month = 100K KU
          maxKnowledgeUnits = 100000;
          break;
      }
    }

    const usagePercentage =
      maxKnowledgeUnits > 0
        ? Math.round((currentKnowledgeUnits / maxKnowledgeUnits) * 100)
        : 0;

    // Get all user's chats for file count
    const userChats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isArchived"), false),
          q.neq(q.field("chatType"), "app_subchat"), // Exclude subchats
        ),
      )
      .collect();

    // Aggregate file count from all parent chats
    let totalFileCount = 0;
    for (const chat of userChats) {
      const metadata = chat.metadata || { totalFiles: 0 };
      totalFileCount += metadata.totalFiles || 0;
    }

    // Ensure all values are valid numbers
    const validCurrentKnowledgeUnits =
      (typeof currentKnowledgeUnits === 'number' && !isNaN(currentKnowledgeUnits))
        ? currentKnowledgeUnits
        : 0;
    const validUsagePercentage =
      (typeof usagePercentage === 'number' && !isNaN(usagePercentage))
        ? usagePercentage
        : 0;

    return {
      currentKnowledgeUnits: validCurrentKnowledgeUnits,
      maxKnowledgeUnits,
      currentTokensIngested,
      maxMonthlyTokens,
      fileCount: totalFileCount,
      usagePercentage: validUsagePercentage,
      tierName,
      totalChats: userChats.length,
      // Keep legacy fields for backward compatibility (deprecated)
      currentStorageMB: 0,
      maxStorageMB: 0,
      currentStorageBytes: 0,
    };
  },
});

// Clean up storage tracking for a deleted chat
export const cleanupChatStorage = mutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const storage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!storage || !storage.chatFileSizes) {
      return {
        cleaned: false,
        reason: "No storage record or chat sizes found",
      };
    }

    const chatSize = (storage.chatFileSizes as any)[args.chatId] || 0;

    if (chatSize === 0) {
      return { cleaned: false, reason: "No storage used by this chat" };
    }

    // Remove chat from tracking and update totals
    const newChatFileSizes = { ...(storage.chatFileSizes || {}) };
    delete newChatFileSizes[args.chatId];

    // Get file count for this chat (we'll need to estimate this)
    // For now, we'll assume 1 file per chat cleanup - this could be improved
    // by tracking file counts per chat in the future
    const estimatedFileCount = 1;

    await ctx.db.patch(storage._id, {
      totalFileSizeBytes: Math.max(0, storage.totalFileSizeBytes - chatSize),
      fileCount: Math.max(0, storage.fileCount - estimatedFileCount),
      lastUpdated: Date.now(),
      chatFileSizes: newChatFileSizes,
    });

    return {
      cleaned: true,
      removedBytes: chatSize,
      removedFiles: estimatedFileCount,
    };
  },
});
