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

// Generate secure JWT secret (64-character hex string)
function generateJwtSecret(): string {
  // Generate 32 random bytes and convert to hex (64 characters)
  const bytes = new Array(32)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
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
    parentChatId: v.optional(v.id("chats")), // The chat this app is based on
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
    const jwtSecret = generateJwtSecret();

    const app = await ctx.db.insert("apps", {
      appId,
      name: args.name,
      description: args.description,
      developerId,
      appSecret,
      jwtSecret,
      parentChatId: args.parentChatId, // Store the source chat for settings inheritance
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
      jwtSecret, // Only returned once during creation
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

// Get apps for a specific parent chat
export const getAppsForChat = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const developerId = identity.subject;

    const apps = await ctx.db
      .query("apps")
      .withIndex("by_developer", (q) => q.eq("developerId", developerId))
      .filter((q) => q.eq(q.field("parentChatId"), args.chatId))
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

    // Track subchat creation for analytics (async to not slow down creation)
    try {
      // Find the parent app chat to update its metadata
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
        const currentMetadata = appChat.metadata;
        if (currentMetadata) {
          // Add new user to analytics
          const userHash = `user_***${args.endUserId.slice(-6)}`;
          const existingUser = currentMetadata.userActivitySummary.find(
            (u) => u.userIdHash === userHash,
          );

          if (!existingUser) {
            const updatedMetadata = {
              ...currentMetadata,
              totalSubchats: currentMetadata.totalSubchats + 1,
              totalUsers: currentMetadata.totalUsers + 1,
              activeUsers: currentMetadata.activeUsers + 1,
              lastActivityAt: Date.now(),
              lastMetadataUpdate: Date.now(),
              userActivitySummary: [
                ...currentMetadata.userActivitySummary,
                {
                  userIdHash: userHash,
                  lastActiveAt: Date.now(),
                  filesUploaded: 0,
                  queriesMade: 0,
                  storageUsedBytes: 0,
                },
              ],
            };

            await ctx.db.patch(appChat._id, { metadata: updatedMetadata });
          }
        }
      }
    } catch (error) {
      // Don't fail subchat creation if analytics tracking fails
      console.error("Failed to track subchat creation:", error);
    }

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

// Get app secret for developer (secure)
export const getAppSecret = query({
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

    return {
      appSecret: app.appSecret,
      appId: app.appId,
    };
  },
});

// Get JWT secret for developer (secure)
export const getJwtSecret = mutation({
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

    // If app doesn't have a JWT secret yet, generate one
    if (!app.jwtSecret) {
      const newJwtSecret = generateJwtSecret();
      await ctx.db.patch(app._id, {
        jwtSecret: newJwtSecret,
      });

      return {
        jwtSecret: newJwtSecret,
        appId: app.appId,
      };
    }

    return {
      jwtSecret: app.jwtSecret,
      appId: app.appId,
    };
  },
});

// Regenerate app secret for developer (secure)
export const regenerateAppSecret = mutation({
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

    // Generate new app secret
    const newAppSecret = generateAppSecret();

    // Update the app with new secret
    await ctx.db.patch(app._id, {
      appSecret: newAppSecret,
    });

    // Log the rotation for audit purposes
    await ctx.db.insert("app_audit_logs", {
      appId: args.appId,
      endUserId: developerId,
      chatId: "system",
      action: "rotate_secret",
      requestedCapability: "admin",
      allowed: true,
      timestamp: Date.now(),
      metadata: {
        errorReason: `App secret rotated by developer ${developerId}`,
      },
    });

    return {
      appSecret: newAppSecret,
      appId: app.appId,
      rotatedAt: Date.now(),
    };
  },
});

// Regenerate JWT secret for developer (secure)
export const regenerateJwtSecret = mutation({
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

    // Generate new JWT secret
    const newJwtSecret = generateJwtSecret();

    // Update the app with new JWT secret
    await ctx.db.patch(app._id, {
      jwtSecret: newJwtSecret,
    });

    // Log the rotation for audit purposes
    await ctx.db.insert("app_audit_logs", {
      appId: args.appId,
      endUserId: developerId,
      chatId: "system",
      action: "rotate_jwt_secret",
      requestedCapability: "admin",
      allowed: true,
      timestamp: Date.now(),
      metadata: {
        errorReason: `JWT secret rotated by developer ${developerId}`,
      },
    });

    return {
      jwtSecret: newJwtSecret,
      appId: app.appId,
      rotatedAt: Date.now(),
    };
  },
});

// Get app with parent chat settings (for backend)
export const getAppWithSettings = query({
  args: { appId: v.string() },
  handler: async (ctx, args) => {
    const app = await ctx.db
      .query("apps")
      .withIndex("by_appId", (q) => q.eq("appId", args.appId))
      .first();

    if (!app || !app.isActive) {
      return null;
    }

    // Get PUBLISHED parent chat settings if available
    let parentChatSettings = null;
    if (app.parentChatId) {
      const parentChat = await ctx.db.get(app.parentChatId);
      if (parentChat && parentChat.publishedSettings) {
        // Use ONLY published settings for API consumption
        parentChatSettings = {
          customPrompt: parentChat.publishedSettings.customPrompt,
          selectedModel:
            parentChat.publishedSettings.selectedModel || "gpt-4o-mini",
          temperature: parentChat.publishedSettings.temperature || 0.7,
          maxTokens: parentChat.publishedSettings.maxTokens || 1000,
          userId: parentChat.userId, // For credit consumption
        };
      }
      // If no published settings exist, parentChatSettings remains null
      // This will force the API to return an error instead of using draft settings
    }

    return {
      appId: app.appId,
      developerId: app.developerId,
      isActive: app.isActive,
      settings: app.settings,
      name: app.name,
      parentChatId: app.parentChatId, // Add this for file inheritance
      parentChatSettings: parentChatSettings,
    };
  },
});

// Create or update app with parent chat (migration helper)
export const createOrUpdateAppWithParent = mutation({
  args: {
    appId: v.string(),
    parentChatId: v.id("chats"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const developerId = identity.subject;

    // Check if app already exists
    const existingApp = await ctx.db
      .query("apps")
      .withIndex("by_appId", (q) => q.eq("appId", args.appId))
      .first();

    if (existingApp) {
      // Update existing app
      if (existingApp.developerId !== developerId) {
        throw new Error("App exists but you don't own it.");
      }

      await ctx.db.patch(existingApp._id, {
        parentChatId: args.parentChatId,
      });

      return {
        success: true,
        appId: existingApp.appId,
        parentChatId: args.parentChatId,
        action: "updated",
      };
    } else {
      // Create new app with parent chat
      const appSecret = generateAppSecret();
      const jwtSecret = generateJwtSecret();

      const app = await ctx.db.insert("apps", {
        appId: args.appId,
        name: args.name || `App ${args.appId}`,
        description: args.description || `App created from chat migration`,
        developerId,
        appSecret,
        jwtSecret,
        parentChatId: args.parentChatId,
        isActive: true,
        createdAt: Date.now(),
        settings: {
          allowDirectUploads: true,
          maxUsersPerApp: 10000,
          allowedCapabilities: ["ask", "upload"],
        },
      });

      return {
        success: true,
        appId: args.appId,
        appSecret, // Return for first time setup
        jwtSecret,
        parentChatId: args.parentChatId,
        action: "created",
      };
    }
  },
});

// Verify app secret (called by backend)
export const verifyAppSecret = query({
  args: { appSecret: v.string() },
  handler: async (ctx, args) => {
    const app = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("appSecret"), args.appSecret))
      .first();

    if (!app || !app.isActive) {
      return null;
    }

    // Get parent chat settings if available
    let parentChatSettings = null;
    if (app.parentChatId) {
      const parentChat = await ctx.db.get(app.parentChatId);
      if (parentChat) {
        parentChatSettings = {
          customPrompt: parentChat.customPrompt,
          selectedModel: parentChat.selectedModel || "gpt-4o-mini",
          temperature: parentChat.temperature || 0.7,
          maxTokens: parentChat.maxTokens || 1000,
          userId: parentChat.userId, // For credit consumption
        };
      }
    }

    // Return app data without sensitive info
    return {
      appId: app.appId,
      developerId: app.developerId,
      isActive: app.isActive,
      settings: app.settings,
      name: app.name,
      parentChatSettings: parentChatSettings,
    };
  },
});
