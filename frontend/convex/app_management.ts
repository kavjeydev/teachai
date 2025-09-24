import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * 🔒 Privacy-First App Management
 *
 * This implements the per-user sub-chat system where:
 * - Each end-user gets their own private chat under an app
 * - Developers can only access responses through scoped tokens
 * - No raw file access for developers - complete data isolation
 */

// Generate secure app secret
function generateAppSecret(): string {
  return `as_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 16)}`;
}

// Generate app ID
function generateAppId(): string {
  return `app_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
}

// Create a new app for a developer
export const createApp = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    privacyPolicyUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const developerId = identity.subject;
    const appId = generateAppId();
    const appSecret = generateAppSecret();

    const app = await ctx.db.insert("apps", {
      appId,
      name: args.name,
      description: args.description,
      developerId,
      appSecret,
      iconUrl: args.iconUrl,
      websiteUrl: args.websiteUrl,
      privacyPolicyUrl: args.privacyPolicyUrl,
      isActive: true,
      createdAt: Date.now(),
      settings: {
        allowDirectUploads: true,
        maxUsersPerApp: 10000, // Default limit
        allowedCapabilities: ["ask", "upload"], // Default safe capabilities
      },
    });

    return {
      appId,
      appSecret, // Only returned once during creation
      app: app,
    };
  },
});

// Get developer's apps (without secrets)
export const getDeveloperApps = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const developerId = identity.subject;

    const apps = await ctx.db
      .query("apps")
      .withIndex("by_developer", (q) => q.eq("developerId", developerId))
      .collect();

    // Return apps without secrets for security
    return apps.map((app) => ({
      _id: app._id,
      appId: app.appId,
      name: app.name,
      description: app.description,
      iconUrl: app.iconUrl,
      websiteUrl: app.websiteUrl,
      privacyPolicyUrl: app.privacyPolicyUrl,
      isActive: app.isActive,
      createdAt: app.createdAt,
      settings: app.settings,
    }));
  },
});

// Create or get user sub-chat for an app
export const createUserSubChat = mutation({
  args: {
    appId: v.string(),
    endUserId: v.string(), // The user ID from the app's perspective
    capabilities: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // This would typically be called with app authentication
    // For now, we'll validate the app exists and is active

    const app = await ctx.db
      .query("apps")
      .withIndex("by_appId", (q) => q.eq("appId", args.appId))
      .first();

    if (!app || !app.isActive) {
      throw new Error("App not found or inactive.");
    }

    // Check if user already has a sub-chat for this app
    const existingUserChat = await ctx.db
      .query("user_app_chats")
      .withIndex("by_app_user", (q) =>
        q.eq("appId", args.appId).eq("endUserId", args.endUserId),
      )
      .first();

    if (existingUserChat && !existingUserChat.isRevoked) {
      // Return existing chat
      const chat = await ctx.db.get(existingUserChat.chatId);
      return {
        userChatId: existingUserChat._id,
        chatId: chat?._id,
        chatStringId: chat?.chatId,
        isNew: false,
        capabilities: existingUserChat.capabilities,
      };
    }

    // Create new private chat for this user
    const chatStringId = `subchat_${args.appId}_${args.endUserId}_${Date.now()}`;

    const chat = await ctx.db.insert("chats", {
      chatId: chatStringId,
      title: `${app.name} - Private Chat`,
      userId: args.endUserId, // The end-user owns this data
      chatType: "app_subchat",
      parentAppId: args.appId,
      isArchived: false,
      content: [],
      apiInfo: {
        visibility: "private", // Always private for sub-chats
      },
      apiKey: "app_managed", // Managed through app tokens
      apiKeyDisabled: false,
      visibility: "private",
    });

    // Create user-app-chat relationship
    const defaultCapabilities = args.capabilities || ["ask", "upload"];

    const userAppChat = await ctx.db.insert("user_app_chats", {
      appId: args.appId,
      endUserId: args.endUserId,
      chatId: chat,
      authorizedAt: Date.now(),
      isRevoked: false,
      capabilities: defaultCapabilities,
      lastActiveAt: Date.now(),
    });

    return {
      userChatId: userAppChat,
      chatId: chat,
      chatStringId: chatStringId,
      isNew: true,
      capabilities: defaultCapabilities,
    };
  },
});

// Get user's sub-chat for an app (used by API)
export const getUserSubChat = query({
  args: {
    appId: v.string(),
    endUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const userChat = await ctx.db
      .query("user_app_chats")
      .withIndex("by_app_user", (q) =>
        q.eq("appId", args.appId).eq("endUserId", args.endUserId),
      )
      .first();

    if (!userChat || userChat.isRevoked) {
      return null;
    }

    const chat = await ctx.db.get(userChat.chatId);
    if (!chat || chat.isArchived) {
      return null;
    }

    return {
      userChatId: userChat._id,
      chatId: chat._id,
      chatStringId: chat.chatId,
      capabilities: userChat.capabilities,
      lastActiveAt: userChat.lastActiveAt,
    };
  },
});

// Log app access for audit trail
export const logAppAccess = mutation({
  args: {
    appId: v.string(),
    endUserId: v.string(),
    chatId: v.string(),
    action: v.string(),
    requestedCapability: v.string(),
    allowed: v.boolean(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    usedNodeIds: v.optional(v.array(v.string())),
    metadata: v.optional(
      v.object({
        question: v.optional(v.string()),
        filename: v.optional(v.string()),
        errorReason: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("app_audit_logs", {
      appId: args.appId,
      endUserId: args.endUserId,
      chatId: args.chatId,
      action: args.action,
      requestedCapability: args.requestedCapability,
      allowed: args.allowed,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      usedNodeIds: args.usedNodeIds,
      timestamp: Date.now(),
      metadata: args.metadata,
    });
  },
});

// Get app statistics for developer
export const getAppStats = query({
  args: { appId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const developerId = identity.subject;

    // Verify app ownership
    const app = await ctx.db
      .query("apps")
      .withIndex("by_appId", (q) => q.eq("appId", args.appId))
      .first();

    if (!app || app.developerId !== developerId) {
      throw new Error("App not found or unauthorized.");
    }

    // Get user count
    const userChats = await ctx.db
      .query("user_app_chats")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .filter((q) => q.eq(q.field("isRevoked"), false))
      .collect();

    // Get audit logs (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const auditLogs = await ctx.db
      .query("app_audit_logs")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .filter((q) => q.gte(q.field("timestamp"), thirtyDaysAgo))
      .collect();

    return {
      totalUsers: userChats.length,
      activeUsers: userChats.filter((chat) => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return chat.lastActiveAt && chat.lastActiveAt > sevenDaysAgo;
      }).length,
      totalApiCalls: auditLogs.length,
      successfulCalls: auditLogs.filter((log) => log.allowed).length,
      blockedCalls: auditLogs.filter((log) => !log.allowed).length,
      topActions: auditLogs.reduce(
        (acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  },
});

// Revoke user access to app
export const revokeUserAccess = mutation({
  args: {
    appId: v.string(),
    endUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const developerId = identity.subject;

    // Verify app ownership OR user ownership
    const app = await ctx.db
      .query("apps")
      .withIndex("by_appId", (q) => q.eq("appId", args.appId))
      .first();

    const userChat = await ctx.db
      .query("user_app_chats")
      .withIndex("by_app_user", (q) =>
        q.eq("appId", args.appId).eq("endUserId", args.endUserId),
      )
      .first();

    if (!app || !userChat) {
      throw new Error("App or user chat not found.");
    }

    // Allow if developer owns app OR user owns the data
    const isAuthorized =
      app.developerId === developerId || args.endUserId === identity.subject;

    if (!isAuthorized) {
      throw new Error("Not authorized to revoke this access.");
    }

    // Revoke access
    await ctx.db.patch(userChat._id, {
      isRevoked: true,
    });

    // Archive the chat
    const chat = await ctx.db.get(userChat.chatId);
    if (chat) {
      await ctx.db.patch(userChat.chatId, {
        isArchived: true,
      });
    }

    // Log the revocation
    await ctx.db.insert("app_audit_logs", {
      appId: args.appId,
      endUserId: args.endUserId,
      chatId: chat?.chatId || "unknown",
      action: "revoke_access",
      requestedCapability: "admin",
      allowed: true,
      timestamp: Date.now(),
      metadata: {
        errorReason: `Access revoked by ${developerId === identity.subject ? "developer" : "user"}`,
      },
    });

    return { success: true };
  },
});

// Update app capabilities
export const updateAppCapabilities = mutation({
  args: {
    appId: v.string(),
    allowedCapabilities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const developerId = identity.subject;

    const app = await ctx.db
      .query("apps")
      .withIndex("by_appId", (q) => q.eq("appId", args.appId))
      .first();

    if (!app || app.developerId !== developerId) {
      throw new Error("App not found or unauthorized.");
    }

    // Validate capabilities
    const validCapabilities = ["ask", "upload", "export_summaries"];
    const invalidCapabilities = args.allowedCapabilities.filter(
      (cap) => !validCapabilities.includes(cap),
    );

    if (invalidCapabilities.length > 0) {
      throw new Error(
        `Invalid capabilities: ${invalidCapabilities.join(", ")}`,
      );
    }

    // Note: "list_files" and "download_file" are intentionally not allowed
    // to maintain privacy-first architecture

    await ctx.db.patch(app._id, {
      settings: {
        ...app.settings,
        allowedCapabilities: args.allowedCapabilities,
      },
    });

    return { success: true };
  },
});
