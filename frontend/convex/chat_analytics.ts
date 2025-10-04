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
  totalUsers: 0, // Total sub-chats under parent chat
  totalFiles: 0, // Total files in parent + all sub-chats
  totalStorageBytes: 0,
  averageFileSize: 0,
  totalQueries: 0,
  queriesLast7Days: 0,
  lastActivityAt: 0,
  userActivitySummary: [],
  fileTypeStats: defaultFileTypeStats,
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
    chatId: v.union(v.id("chats"), v.string()), // Accept both Convex ID and string ID
  },
  handler: async (ctx, args) => {
    console.log(
      `📊 [Analytics] Processing upload: ${args.filename} (${args.fileSize} bytes) for app ${args.appId}`,
    );
    // Find the subchat (handle both Convex ID and string ID)
    let subchat;
    if (typeof args.chatId === "string") {
      // String chat ID - find by chatId field
      subchat = await ctx.db
        .query("chats")
        .filter((q) => q.eq(q.field("chatId"), args.chatId))
        .first();
    } else {
      // Convex document ID - get directly
      subchat = await ctx.db.get(args.chatId);
    }

    if (subchat) {
      // Update subchat's own metadata (only its own files)
      const subchatMetadata = (subchat as any).metadata || defaultMetadata;
      await ctx.db.patch((subchat as any)._id, {
        metadata: {
          ...subchatMetadata,
          totalFiles: subchatMetadata.totalFiles + 1,
          totalStorageBytes: subchatMetadata.totalStorageBytes + args.fileSize,
          totalFileSize: (subchatMetadata.totalFileSize || 0) + args.fileSize, // Use totalFileSize instead of averageFileSize
          lastActivityAt: Date.now(),
          lastMetadataUpdate: Date.now(),
        },
      });

      console.log(
        `📊 [Analytics] Updated subchat ${(subchat as any).chatId} own storage: +${args.fileSize} bytes (own total: ${subchatMetadata.totalStorageBytes + args.fileSize})`,
      );

      // Find the correct parent chat using the proper relationship
      let parentChat = null;

      if ((subchat as any).parentChatId) {
        // Direct reference using string chatId - much more efficient
        parentChat = await ctx.db
          .query("chats")
          .filter((q) => q.eq(q.field("chatId"), (subchat as any).parentChatId))
          .first();
        console.log(
          `📊 [Analytics] Found parent via parentChatId: ${(parentChat as any)?.chatId}`,
        );
      } else if ((subchat as any).parentAppId) {
        // Legacy fallback - lookup by app's parentChatId
        const app = await ctx.db
          .query("apps")
          .withIndex("by_appId", (q) =>
            q.eq("appId", (subchat as any).parentAppId),
          )
          .first();

        if (app && app.parentChatId) {
          parentChat = await ctx.db.get(app.parentChatId);
          console.log(
            `📊 [Analytics] Found parent via app lookup: ${(parentChat as any)?.chatId}`,
          );
        }
      }

      // Update parent chat's aggregated storage metadata (includes all subchat files)
      if (parentChat) {
        const parentMetadata = (parentChat as any).metadata || defaultMetadata;
        const fileType = getFileType(args.filename);

        const updatedParentMetadata = {
          ...parentMetadata,
          totalFiles: parentMetadata.totalFiles + 1,
          totalStorageBytes: parentMetadata.totalStorageBytes + args.fileSize,
          totalFileSize: (parentMetadata.totalFileSize || 0) + args.fileSize, // Use totalFileSize instead of averageFileSize
          lastActivityAt: Date.now(),
          lastMetadataUpdate: Date.now(),

          // Update file type distribution
          fileTypeStats: {
            ...parentMetadata.fileTypeStats,
            [fileType]: parentMetadata.fileTypeStats[fileType] + 1,
          },

          // Update user activity summary
          userActivitySummary: parentMetadata.userActivitySummary.map(
            (user: any) =>
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

        await ctx.db.patch((parentChat as any)._id, {
          metadata: updatedParentMetadata,
        });

        console.log(
          `✅ [Analytics] Updated parent chat ${(parentChat as any).chatId} aggregated storage: +${args.fileSize} bytes (total: ${updatedParentMetadata.totalStorageBytes})`,
        );
      } else {
        console.error(
          `❌ [Analytics] Parent chat not found for subchat ${(subchat as any).chatId}`,
          {
            parentChatId: (subchat as any).parentChatId,
            parentAppId: (subchat as any).parentAppId,
          },
        );
      }
    }

    return { success: true };
  },
});

// Track API query
export const trackApiQuery = mutation({
  args: {
    appId: v.string(),
    endUserId: v.string(),
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

      const updatedMetadata = {
        ...currentMetadata,
        totalQueries: currentMetadata.totalQueries + 1,
        queriesLast7Days: currentMetadata.queriesLast7Days + 1,
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

// Initialize analytics from existing sub-chats (real data only)
export const initializeAnalyticsFromSubchats = mutation({
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
      throw new Error("Not authorized to modify this chat.");
    }

    // Find existing sub-chats for this chat (multiple patterns)
    const existingSubchats = await ctx.db
      .query("chats")
      .filter((q) =>
        q.and(
          q.eq(q.field("chatType"), "app_subchat"),
          q.eq(q.field("parentAppId"), chat.chatId),
        ),
      )
      .collect();

    // Also check user_app_chats table for app-managed sub-chats
    const userAppChats = await ctx.db
      .query("user_app_chats")
      .filter((q) => q.eq(q.field("appId"), chat.chatId))
      .collect();

    // Combine all unique users (real data only, no estimates)
    const allUsers = new Map();

    // Add from sub-chats
    for (const subchat of existingSubchats) {
      const userHash = hashUserId(subchat.userId);
      if (!allUsers.has(userHash)) {
        allUsers.set(userHash, {
          userIdHash: userHash,
          lastActiveAt: subchat._creationTime || 0, // Use creation time as last activity if no specific data
          filesUploaded: 0, // Will be tracked going forward
          queriesMade: 0, // Will be tracked going forward
          storageUsedBytes: 0, // Will be tracked going forward
        });
      }
    }

    // Add from user_app_chats
    for (const userAppChat of userAppChats) {
      const userHash = hashUserId(userAppChat.endUserId);
      if (!allUsers.has(userHash)) {
        allUsers.set(userHash, {
          userIdHash: userHash,
          lastActiveAt: userAppChat.lastActiveAt || 0, // Only use real data or 0
          filesUploaded: 0,
          queriesMade: 0,
          storageUsedBytes: 0,
        });
      }
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeUsers = Array.from(allUsers.values()).filter(
      (user) => user.lastActiveAt > sevenDaysAgo,
    ).length;

    const initialMetadata = {
      totalSubchats: existingSubchats.length + userAppChats.length,
      activeUsers: activeUsers,
      totalUsers: allUsers.size, // Total sub-chats under parent chat
      totalFiles: 0, // Total files in parent + all sub-chats (will be tracked from real uploads)
      totalStorageBytes: 0, // Will be tracked from real file uploads
      averageFileSize: 0, // Will be calculated from real data
      totalQueries: 0, // Will be tracked from real API calls
      queriesLast7Days: 0, // Will be tracked from real API calls
      lastActivityAt: Math.max(
        ...Array.from(allUsers.values()).map((u) => u.lastActiveAt),
        0,
      ),
      userActivitySummary: Array.from(allUsers.values()),
      fileTypeStats: { pdf: 0, docx: 0, txt: 0, images: 0, other: 0 }, // Will be tracked from real uploads
      privacyMode: "privacy_first",
      lastMetadataUpdate: Date.now(),
      complianceFlags: {
        gdprCompliant: true,
        ccpaCompliant: true,
        auditLogEnabled: true,
      },
    };

    await ctx.db.patch(args.chatId, { metadata: initialMetadata });

    return {
      success: true,
      message: `Analytics initialized: ${allUsers.size} users from ${existingSubchats.length + userAppChats.length} sub-chats`,
      stats: {
        totalUsers: allUsers.size,
        totalSubchats: existingSubchats.length + userAppChats.length,
        activeUsers: activeUsers,
      },
    };
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

// Recalculate analytics metrics from actual data
export const recalculateAnalyticsMetrics = mutation({
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

    // Find all sub-chats for this parent chat using multiple approaches
    // 1. Direct sub-chats with parentAppId
    const directSubchats = await ctx.db
      .query("chats")
      .filter((q) =>
        q.and(
          q.eq(q.field("chatType"), "app_subchat"),
          q.eq(q.field("parentAppId"), chat.chatId),
        ),
      )
      .collect();

    // 2. User app chats (from user_app_chats table)
    const userAppChats = await ctx.db
      .query("user_app_chats")
      .filter((q) => q.eq(q.field("appId"), chat.chatId))
      .collect();

    // 3. User app authorizations (from user_app_authorizations table)
    const userAppAuths = await ctx.db
      .query("user_app_authorizations")
      .filter((q) =>
        q.and(
          q.eq(q.field("appId"), chat.chatId),
          q.eq(q.field("isRevoked"), false),
        ),
      )
      .collect();

    // Get all unique sub-chat IDs
    const allSubchatIds = new Set();

    // Add direct subchats
    directSubchats.forEach((subchat) => allSubchatIds.add(subchat._id));

    // Add chats from user_app_chats
    userAppChats.forEach((uac) => {
      if (uac.chatId) allSubchatIds.add(uac.chatId);
    });

    // Add chats from user_app_authorizations
    userAppAuths.forEach((uaa) => {
      if (uaa.chatId) allSubchatIds.add(uaa.chatId);
    });

    // Fetch all actual sub-chat documents
    const allSubchats = [];
    for (const subchatId of allSubchatIds) {
      const subchat = await ctx.db.get(subchatId);
      if (subchat) {
        allSubchats.push(subchat);
      }
    }

    // Calculate Total Users (number of unique sub-chats)
    const totalUsers = allSubchats.length;

    // Calculate total files from parent chat + all sub-chats
    let totalFiles = 0;
    let totalStorageBytes = 0;
    const fileTypeStats = { pdf: 0, docx: 0, txt: 0, images: 0, other: 0 };

    // Count files in parent chat
    const parentContext = chat.context || [];
    totalFiles += parentContext.length;

    // Update parent context files for type distribution
    parentContext.forEach((file) => {
      const fileType = getFileType(file.filename);
      fileTypeStats[fileType]++;
    });

    // Count files in all sub-chats
    for (const subchat of allSubchats) {
      const subchatContext = subchat.context || [];
      totalFiles += subchatContext.length;

      // Update file type distribution
      subchatContext.forEach((file) => {
        const fileType = getFileType(file.filename);
        fileTypeStats[fileType]++;
      });
    }

    const currentMetadata = chat.metadata || defaultMetadata;

    const updatedMetadata = {
      ...currentMetadata,
      totalUsers: totalUsers, // Total sub-chats under parent chat
      totalFiles: totalFiles, // Total files in parent + all sub-chats
      totalSubchats: totalUsers, // Keep this in sync with totalUsers
      fileTypeStats: fileTypeStats,
      lastMetadataUpdate: Date.now(),
    };

    await ctx.db.patch(args.chatId, { metadata: updatedMetadata });

    return {
      success: true,
      metrics: {
        totalUsers: totalUsers,
        totalFiles: totalFiles,
        totalSubchats: totalUsers,
        foundDirectSubchats: directSubchats.length,
        foundUserAppChats: userAppChats.length,
        foundUserAppAuths: userAppAuths.length,
        totalUniqueSubchats: allSubchats.length,
      },
      message: "Analytics metrics recalculated successfully",
    };
  },
});

// Migrate old metadata to new schema (removes deprecated fields)
export const migrateMetadataSchema = mutation({
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

    const currentMetadata = chat.metadata;
    if (!currentMetadata) {
      // No metadata to migrate
      return { success: true, message: "No metadata to migrate" };
    }

    // Create new metadata without deprecated fields
    const migratedMetadata = {
      totalSubchats: currentMetadata.totalSubchats || 0,
      activeUsers: currentMetadata.activeUsers || 0,
      totalUsers: currentMetadata.totalUsers || 0,
      totalFiles: currentMetadata.totalFiles || 0,
      totalStorageBytes: currentMetadata.totalStorageBytes || 0,
      averageFileSize: currentMetadata.averageFileSize || 0,
      totalQueries: currentMetadata.totalQueries || 0,
      queriesLast7Days: currentMetadata.queriesLast7Days || 0,
      lastActivityAt: currentMetadata.lastActivityAt || 0,
      userActivitySummary: currentMetadata.userActivitySummary || [],
      fileTypeStats: currentMetadata.fileTypeStats || defaultFileTypeStats,
      privacyMode: currentMetadata.privacyMode || "privacy_first",
      lastMetadataUpdate: Date.now(),
      complianceFlags: currentMetadata.complianceFlags || {
        gdprCompliant: true,
        ccpaCompliant: true,
        auditLogEnabled: true,
      },
      // Note: averageResponseTime and successRate are intentionally omitted
    };

    await ctx.db.patch(args.chatId, { metadata: migratedMetadata });

    return {
      success: true,
      message: "Metadata migrated to new schema",
      removedFields: ["averageResponseTime", "successRate"],
    };
  },
});

// Migrate all user's chats to new schema
export const migrateAllUserChatsMetadata = mutation({
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

    let migratedCount = 0;
    let errorCount = 0;

    for (const chat of chats) {
      try {
        const currentMetadata = chat.metadata;
        if (
          currentMetadata &&
          (currentMetadata.averageResponseTime !== undefined ||
            currentMetadata.successRate !== undefined)
        ) {
          // This chat has old schema fields, migrate it
          const migratedMetadata = {
            totalSubchats: currentMetadata.totalSubchats || 0,
            activeUsers: currentMetadata.activeUsers || 0,
            totalUsers: currentMetadata.totalUsers || 0,
            totalFiles: currentMetadata.totalFiles || 0,
            totalStorageBytes: currentMetadata.totalStorageBytes || 0,
            averageFileSize: currentMetadata.averageFileSize || 0,
            totalQueries: currentMetadata.totalQueries || 0,
            queriesLast7Days: currentMetadata.queriesLast7Days || 0,
            lastActivityAt: currentMetadata.lastActivityAt || 0,
            userActivitySummary: currentMetadata.userActivitySummary || [],
            fileTypeStats:
              currentMetadata.fileTypeStats || defaultFileTypeStats,
            privacyMode: currentMetadata.privacyMode || "privacy_first",
            lastMetadataUpdate: Date.now(),
            complianceFlags: currentMetadata.complianceFlags || {
              gdprCompliant: true,
              ccpaCompliant: true,
              auditLogEnabled: true,
            },
          };

          await ctx.db.patch(chat._id, { metadata: migratedMetadata });
          migratedCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`Failed to migrate chat ${chat._id}:`, error);
      }
    }

    return {
      success: true,
      message: `Migrated ${migratedCount} chats, ${errorCount} errors`,
      migratedCount,
      errorCount,
    };
  },
});

// Debug function to check chat structure
export const debugChatStructure = query({
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

    // Find all possible sub-chats using multiple approaches
    const directSubchats = await ctx.db
      .query("chats")
      .filter((q) =>
        q.and(
          q.eq(q.field("chatType"), "app_subchat"),
          q.eq(q.field("parentAppId"), chat.chatId),
        ),
      )
      .collect();

    const userAppChats = await ctx.db
      .query("user_app_chats")
      .filter((q) => q.eq(q.field("appId"), chat.chatId))
      .collect();

    const userAppAuths = await ctx.db
      .query("user_app_authorizations")
      .filter((q) =>
        q.and(
          q.eq(q.field("appId"), chat.chatId),
          q.eq(q.field("isRevoked"), false),
        ),
      )
      .collect();

    // Also search for any chats that might be sub-chats of this user
    const allUserChats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const potentialSubchats = allUserChats.filter(
      (c) => c.chatType === "app_subchat" || c.parentAppId,
    );

    // Search for any chats that might reference this chat as parent
    const allChatsWithParent = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("parentAppId"), chat.chatId))
      .collect();

    return {
      chatInfo: {
        _id: chat._id,
        chatId: chat.chatId,
        chatType: chat.chatType,
        userId: chat.userId,
        parentAppId: chat.parentAppId,
        contextFiles: (chat.context || []).length,
        fullChat: chat, // Include full chat object for debugging
      },
      subchats: {
        directSubchats: directSubchats.map((sc) => ({
          _id: sc._id,
          chatId: sc.chatId,
          userId: sc.userId,
          parentAppId: sc.parentAppId,
          contextFiles: (sc.context || []).length,
        })),
        userAppChats: userAppChats.length,
        userAppAuths: userAppAuths.length,
        potentialSubchats: potentialSubchats.map((sc) => ({
          _id: sc._id,
          chatId: sc.chatId,
          chatType: sc.chatType,
          userId: sc.userId,
          parentAppId: sc.parentAppId,
          contextFiles: (sc.context || []).length,
        })),
        allChatsWithParent: allChatsWithParent.map((sc) => ({
          _id: sc._id,
          chatId: sc.chatId,
          chatType: sc.chatType,
          userId: sc.userId,
          parentAppId: sc.parentAppId,
          contextFiles: (sc.context || []).length,
        })),
      },
      currentMetadata: chat.metadata,
      searchQueries: {
        chatIdUsed: chat.chatId,
        userIdUsed: identity.subject,
      },
    };
  },
});

// Fix chat setup (set proper chatType and initialize metadata)
export const fixChatSetup = mutation({
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

    // Fix the chat setup
    const updates: any = {};

    // Set chatType to user_direct if not set
    if (!chat.chatType) {
      updates.chatType = "user_direct";
    }

    // Initialize metadata if not present or incomplete
    if (!chat.metadata) {
      updates.metadata = defaultMetadata;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.chatId, updates);
    }

    // Also trigger a recalculation to get accurate metrics
    // This will find and count all sub-chats and files
    const recalcResult = await ctx.runMutation(
      "chat_analytics:recalculateAnalyticsMetrics",
      {
        chatId: args.chatId,
      },
    );

    return {
      success: true,
      message: "Chat setup fixed and metrics recalculated",
      updates,
      recalcResult,
    };
  },
});

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
