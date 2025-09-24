import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * 🔧 Metadata Initialization
 *
 * This function initializes metadata for existing chats that don't have it yet.
 * All values start at 0 and increment as real API usage occurs.
 */

const defaultMetadata = {
  // User and subchat statistics
  totalSubchats: 0,
  activeUsers: 0,
  totalUsers: 0,

  // File and storage analytics
  totalFiles: 0,
  totalStorageBytes: 0,
  averageFileSize: 0,

  // API usage statistics
  totalQueries: 0,
  queriesLast7Days: 0,
  lastActivityAt: 0,

  // Privacy-safe user activity (starts empty)
  userActivitySummary: [],

  // File type distribution (all start at 0)
  fileTypeStats: {
    pdf: 0,
    docx: 0,
    txt: 0,
    images: 0,
    other: 0,
  },

  // Performance metrics
  averageResponseTime: 0,
  successRate: 100, // Start at 100%, will adjust as queries come in

  // Compliance and audit info
  privacyMode: "privacy_first",
  lastMetadataUpdate: Date.now(),
  complianceFlags: {
    gdprCompliant: true,
    ccpaCompliant: true,
    auditLogEnabled: true,
  },
};

// Initialize metadata for chats that don't have it
export const initializeAllChatMetadata = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get all user's chats
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let updatedCount = 0;

    for (const chat of chats) {
      if (!chat.metadata) {
        // Initialize metadata with all values at 0
        await ctx.db.patch(chat._id, {
          metadata: {
            ...defaultMetadata,
            lastMetadataUpdate: Date.now(),
          },
        });
        updatedCount++;
      }
    }

    return {
      success: true,
      message: `Initialized metadata for ${updatedCount} chats`,
      note: "All analytics start at 0 and will increment as real API usage occurs",
    };
  },
});

// Initialize metadata for a specific chat
export const initializeChatMetadata = mutation({
  args: {
    chatId: v.id("chats"),
    privacyMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found.");
    }

    if (chat.userId !== identity.subject) {
      throw new Error("Not authorized to initialize metadata for this chat.");
    }

    const metadata = {
      ...defaultMetadata,
      privacyMode: args.privacyMode || "privacy_first",
      lastMetadataUpdate: Date.now(),
    };

    await ctx.db.patch(args.chatId, { metadata });

    return {
      success: true,
      metadata,
      message: "Chat metadata initialized - all values start at 0",
    };
  },
});

// Get real-time analytics for a chat (returns actual data, not mock)
export const getRealChatAnalytics = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found.");
    }

    if (chat.userId !== identity.subject) {
      throw new Error("Not authorized to view analytics for this chat.");
    }

    // Return actual metadata or default zeros
    const metadata = chat.metadata || defaultMetadata;

    // Calculate real-time active users
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeUsersCount = metadata.userActivitySummary.filter(
      (user) => user.lastActiveAt > sevenDaysAgo,
    ).length;

    return {
      realData: true, // Flag to indicate this is real data, not mock
      chatId: chat.chatId,
      title: chat.title,

      // Real analytics data
      stats: {
        totalUsers: metadata.totalUsers,
        activeUsers: activeUsersCount,
        totalSubchats: metadata.totalSubchats,
        totalFiles: metadata.totalFiles,
        totalStorageBytes: metadata.totalStorageBytes,
        totalQueries: metadata.totalQueries,
        queriesLast7Days: metadata.queriesLast7Days,
        successRate: metadata.successRate,
        averageResponseTime: metadata.averageResponseTime,
        lastActivityAt: metadata.lastActivityAt,
      },

      // File type breakdown (real data)
      fileTypes: metadata.fileTypeStats,

      // User activity (privacy-safe, real data)
      topUsers: metadata.userActivitySummary
        .sort((a, b) => b.queriesMade - a.queriesMade)
        .slice(0, 3),

      // Privacy compliance
      privacy: {
        mode: metadata.privacyMode,
        dataIsolationActive: metadata.privacyMode === "privacy_first",
        gdprCompliant: metadata.complianceFlags.gdprCompliant,
        ccpaCompliant: metadata.complianceFlags.ccpaCompliant,
      },

      lastUpdated: metadata.lastMetadataUpdate,
    };
  },
});
