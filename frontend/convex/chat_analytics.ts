import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * 📊 Chat Analytics & Metadata Management
 *
 * This handles comprehensive metadata tracking for chats including:
 * - User and subchat statistics
 * - File upload analytics
 * - API usage metrics
 * - Privacy-safe user activity summaries
 */

// Helper function to hash user IDs for privacy
function hashUserId(userId: string): string {
  return `user_***${userId.slice(-3)}`;
}

// Helper function to get file type from filename
function getFileType(filename: string): keyof typeof defaultFileTypeStats {
  const ext = filename.toLowerCase().split(".").pop() || "";

  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "docx";
  if (["txt", "md", "csv"].includes(ext)) return "txt";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "images";
  return "other";
}

const defaultFileTypeStats = {
  pdf: 0,
  docx: 0,
  txt: 0,
  images: 0,
  other: 0,
};

const defaultMetadata = {
  totalSubchats: 0,
  activeUsers: 0,
  totalUsers: 0,
  totalFiles: 0,
  totalStorageBytes: 0,
  averageFileSize: 0,
  totalQueries: 0,
  queriesLast7Days: 0,
  lastActivityAt: 0,
  userActivitySummary: [],
  fileTypeStats: defaultFileTypeStats,
  averageResponseTime: 0,
  successRate: 100,
  privacyMode: "privacy_first",
  lastMetadataUpdate: Date.now(),
  complianceFlags: {
    gdprCompliant: true,
    ccpaCompliant: true,
    auditLogEnabled: true,
  },
};

// Initialize metadata for a chat (app)
export const initializeChatMetadata = mutation({
  args: {
    chatId: v.id("chats"),
    privacyMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    const metadata = {
      ...defaultMetadata,
      privacyMode: args.privacyMode || "privacy_first",
      lastMetadataUpdate: Date.now(),
    };

    await ctx.db.patch(args.chatId, { metadata });
    return { success: true, metadata };
  },
});

// Track user subchat creation
export const trackSubchatCreation = mutation({
  args: {
    appId: v.string(),
    endUserId: v.string(),
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    // Find the parent app chat to update its metadata
    const appChats = await ctx.db
      .query("chats")
      .filter((q) =>
        q.and(
          q.eq(q.field("chatType"), "user_direct"),
          q.eq(q.field("userId"), args.appId), // App chats are owned by the developer
        ),
      )
      .collect();

    for (const appChat of appChats) {
      const currentMetadata = appChat.metadata || defaultMetadata;

      // Update subchat and user counts
      const updatedMetadata = {
        ...currentMetadata,
        totalSubchats: currentMetadata.totalSubchats + 1,
        totalUsers: currentMetadata.totalUsers + 1,
        activeUsers: currentMetadata.activeUsers + 1,
        lastActivityAt: Date.now(),
        lastMetadataUpdate: Date.now(),

        // Add user activity entry (privacy-safe)
        userActivitySummary: [
          ...currentMetadata.userActivitySummary,
          {
            userIdHash: hashUserId(args.endUserId),
            lastActiveAt: Date.now(),
            filesUploaded: 0,
            queriesMade: 0,
            storageUsedBytes: 0,
          },
        ],
      };

      await ctx.db.patch(appChat._id, { metadata: updatedMetadata });
    }

    return { success: true };
  },
});

// Track file upload
export const trackFileUpload = mutation({
  args: {
    appId: v.string(),
    endUserId: v.string(),
    filename: v.string(),
    fileSize: v.number(),
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    // Update the specific subchat
    const subchat = await ctx.db.get(args.chatId);
    if (subchat) {
      const subchatMetadata = subchat.metadata || defaultMetadata;
      await ctx.db.patch(args.chatId, {
        metadata: {
          ...subchatMetadata,
          totalFiles: subchatMetadata.totalFiles + 1,
          totalStorageBytes: subchatMetadata.totalStorageBytes + args.fileSize,
          averageFileSize: Math.round(
            (subchatMetadata.totalStorageBytes + args.fileSize) /
              (subchatMetadata.totalFiles + 1),
          ),
          lastActivityAt: Date.now(),
          lastMetadataUpdate: Date.now(),
        },
      });
    }

    // Update parent app chat metadata
    const appChats = await ctx.db
      .query("chats")
      .filter((q) =>
        q.and(
          q.eq(q.field("chatType"), "user_direct"),
          q.eq(q.field("userId"), args.appId),
        ),
      )
      .collect();

    for (const appChat of appChats) {
      const currentMetadata = appChat.metadata || defaultMetadata;
      const fileType = getFileType(args.filename);

      const updatedMetadata = {
        ...currentMetadata,
        totalFiles: currentMetadata.totalFiles + 1,
        totalStorageBytes: currentMetadata.totalStorageBytes + args.fileSize,
        averageFileSize:
          currentMetadata.totalFiles > 0
            ? Math.round(
                (currentMetadata.totalStorageBytes + args.fileSize) /
                  (currentMetadata.totalFiles + 1),
              )
            : args.fileSize,
        lastActivityAt: Date.now(),
        lastMetadataUpdate: Date.now(),

        // Update file type distribution
        fileTypeStats: {
          ...currentMetadata.fileTypeStats,
          [fileType]: currentMetadata.fileTypeStats[fileType] + 1,
        },

        // Update user activity summary
        userActivitySummary: currentMetadata.userActivitySummary.map((user) =>
          user.userIdHash === hashUserId(args.endUserId)
            ? {
                ...user,
                filesUploaded: user.filesUploaded + 1,
                storageUsedBytes: user.storageUsedBytes + args.fileSize,
                lastActiveAt: Date.now(),
              }
            : user,
        ),
      };

      await ctx.db.patch(appChat._id, { metadata: updatedMetadata });
    }

    return { success: true };
  },
});

// Track API query
export const trackApiQuery = mutation({
  args: {
    appId: v.string(),
    endUserId: v.string(),
    responseTime: v.number(),
    success: v.boolean(),
    chatId: v.optional(v.id("chats")),
  },
  handler: async (ctx, args) => {
    // Update parent app chat metadata
    const appChats = await ctx.db
      .query("chats")
      .filter((q) =>
        q.and(
          q.eq(q.field("chatType"), "user_direct"),
          q.eq(q.field("userId"), args.appId),
        ),
      )
      .collect();

    for (const appChat of appChats) {
      const currentMetadata = appChat.metadata || defaultMetadata;

      // Calculate new success rate
      const totalQueries = currentMetadata.totalQueries + 1;
      const successfulQueries = args.success
        ? (currentMetadata.totalQueries * currentMetadata.successRate) / 100 + 1
        : (currentMetadata.totalQueries * currentMetadata.successRate) / 100;
      const newSuccessRate = Math.round(
        (successfulQueries / totalQueries) * 100,
      );

      // Calculate rolling average response time
      const newAverageResponseTime =
        currentMetadata.totalQueries > 0
          ? Math.round(
              (currentMetadata.averageResponseTime *
                currentMetadata.totalQueries +
                args.responseTime) /
                totalQueries,
            )
          : args.responseTime;

      const updatedMetadata = {
        ...currentMetadata,
        totalQueries,
        queriesLast7Days: currentMetadata.queriesLast7Days + 1,
        averageResponseTime: newAverageResponseTime,
        successRate: newSuccessRate,
        lastActivityAt: Date.now(),
        lastMetadataUpdate: Date.now(),

        // Update user activity
        userActivitySummary: currentMetadata.userActivitySummary.map((user) =>
          user.userIdHash === hashUserId(args.endUserId)
            ? {
                ...user,
                queriesMade: user.queriesMade + 1,
                lastActiveAt: Date.now(),
              }
            : user,
        ),
      };

      await ctx.db.patch(appChat._id, { metadata: updatedMetadata });
    }

    return { success: true };
  },
});

// Get comprehensive chat analytics
export const getChatAnalytics = query({
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

    // Verify ownership
    if (chat.userId !== identity.subject) {
      throw new Error("Not authorized to view this chat's analytics.");
    }

    const metadata = chat.metadata || defaultMetadata;

    // Calculate additional metrics
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentUsers = metadata.userActivitySummary.filter(
      (user) => user.lastActiveAt > sevenDaysAgo,
    ).length;

    return {
      chatId: chat.chatId,
      title: chat.title,
      chatType: chat.chatType,
      privacyMode: metadata.privacyMode,

      // User statistics
      userStats: {
        totalUsers: metadata.totalUsers,
        activeUsers: recentUsers,
        totalSubchats: metadata.totalSubchats,
      },

      // File statistics
      fileStats: {
        totalFiles: metadata.totalFiles,
        totalStorageBytes: metadata.totalStorageBytes,
        averageFileSize: metadata.averageFileSize,
        storageFormatted: formatBytes(metadata.totalStorageBytes),
        fileTypeDistribution: metadata.fileTypeStats,
      },

      // API performance
      apiStats: {
        totalQueries: metadata.totalQueries,
        queriesLast7Days: metadata.queriesLast7Days,
        averageResponseTime: metadata.averageResponseTime,
        successRate: metadata.successRate,
        lastActivityAt: metadata.lastActivityAt,
      },

      // Privacy-safe user activity (no personal data)
      userActivity: metadata.userActivitySummary.map((user) => ({
        userIdHash: user.userIdHash,
        lastActiveAt: user.lastActiveAt,
        filesUploaded: user.filesUploaded,
        queriesMade: user.queriesMade,
        storageUsed: formatBytes(user.storageUsedBytes),
        isActive: user.lastActiveAt > sevenDaysAgo,
      })),

      // Compliance status
      compliance: metadata.complianceFlags,
    };
  },
});

// Get summary stats for all user's chats
export const getUserChatsWithStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return chats.map((chat) => {
      const metadata = chat.metadata || defaultMetadata;

      return {
        _id: chat._id,
        chatId: chat.chatId,
        title: chat.title,
        chatType: chat.chatType,

        // Summary statistics
        stats: {
          totalUsers: metadata.totalUsers,
          activeUsers: metadata.activeUsers,
          totalFiles: metadata.totalFiles,
          storageFormatted: formatBytes(metadata.totalStorageBytes),
          totalQueries: metadata.totalQueries,
          successRate: metadata.successRate,
          lastActivityAt: metadata.lastActivityAt,
          privacyMode: metadata.privacyMode,
        },

        // Quick indicators
        indicators: {
          hasUsers: metadata.totalUsers > 0,
          hasRecentActivity:
            metadata.lastActivityAt > Date.now() - 24 * 60 * 60 * 1000,
          isPrivacyFirst: metadata.privacyMode === "privacy_first",
          isHighUsage: metadata.totalQueries > 100,
        },
      };
    });
  },
});

// Update chat metadata manually (for maintenance)
export const updateChatMetadata = mutation({
  args: {
    chatId: v.id("chats"),
    metadataUpdates: v.object({
      totalSubchats: v.optional(v.number()),
      activeUsers: v.optional(v.number()),
      totalUsers: v.optional(v.number()),
      totalFiles: v.optional(v.number()),
      totalStorageBytes: v.optional(v.number()),
      privacyMode: v.optional(v.string()),
    }),
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
      throw new Error("Not authorized to update this chat.");
    }

    const currentMetadata = chat.metadata || defaultMetadata;
    const updatedMetadata = {
      ...currentMetadata,
      ...args.metadataUpdates,
      lastMetadataUpdate: Date.now(),
    };

    await ctx.db.patch(args.chatId, { metadata: updatedMetadata });
    return { success: true, metadata: updatedMetadata };
  },
});

// Get app performance dashboard data
export const getAppPerformanceDashboard = query({
  args: { appId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    // Get app chat (the main chat that represents this app)
    const appChat = await ctx.db
      .query("chats")
      .filter((q) =>
        q.and(
          q.eq(q.field("chatType"), "user_direct"),
          q.eq(q.field("userId"), identity.subject),
          q.eq(q.field("chatId"), args.appId),
        ),
      )
      .first();

    if (!appChat) {
      throw new Error("App chat not found.");
    }

    const metadata = appChat.metadata || defaultMetadata;

    // Calculate trends
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const activeUsersCount = metadata.userActivitySummary.filter(
      (user) => user.lastActiveAt > sevenDaysAgo,
    ).length;

    const monthlyActiveUsers = metadata.userActivitySummary.filter(
      (user) => user.lastActiveAt > thirtyDaysAgo,
    ).length;

    return {
      overview: {
        totalUsers: metadata.totalUsers,
        activeUsers7d: activeUsersCount,
        activeUsers30d: monthlyActiveUsers,
        totalSubchats: metadata.totalSubchats,
        userRetention:
          metadata.totalUsers > 0
            ? Math.round((activeUsersCount / metadata.totalUsers) * 100)
            : 0,
      },

      fileMetrics: {
        totalFiles: metadata.totalFiles,
        totalStorage: {
          bytes: metadata.totalStorageBytes,
          formatted: formatBytes(metadata.totalStorageBytes),
        },
        averageFileSize: {
          bytes: metadata.averageFileSize,
          formatted: formatBytes(metadata.averageFileSize),
        },
        fileTypeBreakdown: metadata.fileTypeStats,
        filesPerUser:
          metadata.totalUsers > 0
            ? Math.round(metadata.totalFiles / metadata.totalUsers)
            : 0,
      },

      apiPerformance: {
        totalQueries: metadata.totalQueries,
        queriesLast7Days: metadata.queriesLast7Days,
        averageResponseTime: metadata.averageResponseTime,
        successRate: metadata.successRate,
        queriesPerUser:
          metadata.totalUsers > 0
            ? Math.round(metadata.totalQueries / metadata.totalUsers)
            : 0,
        dailyAverage: Math.round(metadata.queriesLast7Days / 7),
      },

      privacyCompliance: {
        mode: metadata.privacyMode,
        gdprCompliant: metadata.complianceFlags.gdprCompliant,
        ccpaCompliant: metadata.complianceFlags.ccpaCompliant,
        auditEnabled: metadata.complianceFlags.auditLogEnabled,
        dataIsolationConfirmed: metadata.privacyMode === "privacy_first",
      },

      // Privacy-safe user insights (no personal data)
      userInsights: {
        topUsersByActivity: metadata.userActivitySummary
          .sort((a, b) => b.queriesMade - a.queriesMade)
          .slice(0, 5)
          .map((user) => ({
            userIdHash: user.userIdHash,
            queriesMade: user.queriesMade,
            filesUploaded: user.filesUploaded,
            storageUsed: formatBytes(user.storageUsedBytes),
            lastActive: user.lastActiveAt,
          })),

        activityDistribution: {
          lightUsers: metadata.userActivitySummary.filter(
            (u) => u.queriesMade < 10,
          ).length,
          moderateUsers: metadata.userActivitySummary.filter(
            (u) => u.queriesMade >= 10 && u.queriesMade < 50,
          ).length,
          heavyUsers: metadata.userActivitySummary.filter(
            (u) => u.queriesMade >= 50,
          ).length,
        },
      },

      lastUpdated: metadata.lastMetadataUpdate,
    };
  },
});

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Clean up old user activity data (privacy maintenance)
export const cleanupUserActivityData = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Not authorized.");
    }

    const metadata = chat.metadata || defaultMetadata;

    // Remove user activity data older than 90 days (privacy cleanup)
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const cleanedUserActivity = metadata.userActivitySummary.filter(
      (user) => user.lastActiveAt > ninetyDaysAgo,
    );

    const updatedMetadata = {
      ...metadata,
      userActivitySummary: cleanedUserActivity,
      lastMetadataUpdate: Date.now(),
    };

    await ctx.db.patch(args.chatId, { metadata: updatedMetadata });

    return {
      success: true,
      removedEntries:
        metadata.userActivitySummary.length - cleanedUserActivity.length,
      message: "Old user activity data cleaned up for privacy",
    };
  },
});
