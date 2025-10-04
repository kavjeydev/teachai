import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * 🔐 Secure User Authentication System
 *
 * This implements OAuth-style authentication where:
 * 1. Users authenticate directly with Trainly (not through developers)
 * 2. Users get secure auth tokens that developers never see
 * 3. Users control access to their own data
 * 4. Developers can only facilitate the connection, not control it
 */

// Generate secure user auth token (only user knows this)
function generateUserAuthToken(): string {
  return `uat_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 16)}`;
}

// User initiates app authorization (OAuth-style)
export const authorizeAppAccess = mutation({
  args: {
    appId: v.string(),
    requestedCapabilities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(
        "User must be authenticated with Trainly to authorize app access.",
      );
    }

    const trainlyUserId = identity.subject;

    // Verify app exists and is active
    const app = await ctx.db
      .query("apps")
      .withIndex("by_appId", (q) => q.eq("appId", args.appId))
      .first();

    if (!app || !app.isActive) {
      throw new Error("App not found or inactive.");
    }

    // Check if user already authorized this app
    const existingAuth = await ctx.db
      .query("user_app_authorizations")
      .withIndex("by_user_app", (q) =>
        q.eq("trainlyUserId", trainlyUserId).eq("appId", args.appId),
      )
      .first();

    if (existingAuth && !existingAuth.isRevoked) {
      // Return existing authorization
      const userToken = await ctx.db
        .query("user_auth_tokens")
        .withIndex("by_token", (q) =>
          q.eq("userAuthToken", existingAuth.userAuthToken),
        )
        .first();

      return {
        success: true,
        userAuthToken: existingAuth.userAuthToken,
        chatId: existingAuth.chatId,
        capabilities: existingAuth.capabilities,
        isExisting: true,
        privacy_note:
          "You control this token - the app developer cannot see it",
      };
    }

    // Get the parent chat from the app's parentChatId
    let parentChat = null;
    if (app.parentChatId) {
      parentChat = await ctx.db.get(app.parentChatId);
    }

    // If no parent chat is set for this app, that's okay - some apps might not have parent chats
    if (!parentChat) {
      console.log(
        `ℹ️ App ${args.appId} has no parent chat - subchat will be created without parent metadata updates`,
      );
    }

    // Create new private chat for user
    const chatId = `user_${trainlyUserId}_app_${args.appId}_${Date.now()}`;

    const chat = await ctx.db.insert("chats", {
      chatId,
      title: `${app.name} - Private Chat`,
      userId: trainlyUserId, // User owns their data
      chatType: "app_subchat",
      parentAppId: args.appId, // Keep for backward compatibility
      parentChatId: parentChat?.chatId, // Parent chat's string chatId (only if parent exists)
      isArchived: false,
      content: [],
      apiInfo: {
        visibility: "private",
      },
      apiKey: "user_controlled",
      apiKeyDisabled: false,
      visibility: "private",
    });

    if (parentChat) {
      const currentMetadata = parentChat.metadata || {
        totalSubchats: 0,
        activeUsers: 0,
        totalUsers: 0,
        totalFiles: 0,
        totalStorageBytes: 0,
        averageFileSize: 0,
        totalQueries: 0,
        queriesLast7Days: 0,
        lastActivityAt: Date.now(),
        userActivitySummary: [],
        fileTypeStats: {
          pdf: 0,
          docx: 0,
          txt: 0,
          images: 0,
          other: 0,
        },
        privacyMode: "privacy_first",
        lastMetadataUpdate: Date.now(),
        complianceFlags: {
          gdprCompliant: true,
          ccpaCompliant: true,
          auditLogEnabled: false,
        },
      };

      const updatedMetadata = {
        ...currentMetadata,
        totalSubchats: currentMetadata.totalSubchats + 1,
        activeUsers: currentMetadata.activeUsers + 1, // Increment active users when subchat created
        lastActivityAt: Date.now(),
        lastMetadataUpdate: Date.now(),
      };

      await ctx.db.patch(parentChat._id, {
        metadata: updatedMetadata,
      });

      console.log(
        `📊 Updated parent chat ${args.appId} subchat count: ${updatedMetadata.totalSubchats}`,
      );
    }

    // Generate secure user auth token (ONLY the user knows this)
    const userAuthToken = generateUserAuthToken();

    // Create user auth token
    const authToken = await ctx.db.insert("user_auth_tokens", {
      userAuthToken,
      trainlyUserId,
      appId: args.appId,
      chatId: chat,
      createdAt: Date.now(),
      isRevoked: false,
      capabilities: args.requestedCapabilities,
    });

    // Create authorization record
    const authorization = await ctx.db.insert("user_app_authorizations", {
      trainlyUserId,
      appId: args.appId,
      chatId: chat,
      userAuthToken,
      authorizedAt: Date.now(),
      isRevoked: false,
      capabilities: args.requestedCapabilities,
      lastActiveAt: Date.now(),
    });

    return {
      success: true,
      userAuthToken, // CRITICAL: Only the user gets this token
      chatId: chat,
      capabilities: args.requestedCapabilities,
      isExisting: false,
      app: {
        name: app.name,
        description: app.description,
      },
      privacy_note:
        "This token is yours alone - keep it secure. The app developer cannot see it.",
    };
  },
});

// Verify user auth token (used by API endpoints)
export const verifyUserAuthToken = query({
  args: { userAuthToken: v.string() },
  handler: async (ctx, args) => {
    const authToken = await ctx.db
      .query("user_auth_tokens")
      .withIndex("by_token", (q) => q.eq("userAuthToken", args.userAuthToken))
      .first();

    if (!authToken || authToken.isRevoked) {
      return null;
    }

    // Check expiry if set
    if (authToken.expiresAt && authToken.expiresAt < Date.now()) {
      return null;
    }

    // Update last used
    await ctx.db.patch(authToken._id, { lastUsed: Date.now() });

    return {
      trainlyUserId: authToken.trainlyUserId,
      appId: authToken.appId,
      chatId: authToken.chatId,
      capabilities: authToken.capabilities,
      isValid: true,
    };
  },
});

// Get user's authorized apps
export const getUserAuthorizedApps = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const trainlyUserId = identity.subject;

    const authorizations = await ctx.db
      .query("user_app_authorizations")
      .withIndex("by_user", (q) => q.eq("trainlyUserId", trainlyUserId))
      .filter((q) => q.eq(q.field("isRevoked"), false))
      .collect();

    // Get app details for each authorization
    const authsWithApps = await Promise.all(
      authorizations.map(async (auth) => {
        const app = await ctx.db
          .query("apps")
          .withIndex("by_appId", (q) => q.eq("appId", auth.appId))
          .first();

        const chat = await ctx.db.get(auth.chatId);

        return {
          ...auth,
          app: app
            ? {
                name: app.name,
                description: app.description,
                iconUrl: app.iconUrl,
              }
            : null,
          chat: chat
            ? {
                title: chat.title,
                chatId: chat.chatId,
              }
            : null,
        };
      }),
    );

    return authsWithApps.filter((auth) => auth.app && auth.chat);
  },
});

// Revoke app authorization (user-controlled)
export const revokeAppAuthorization = mutation({
  args: {
    appId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const trainlyUserId = identity.subject;

    // Find the authorization
    const authorization = await ctx.db
      .query("user_app_authorizations")
      .withIndex("by_user_app", (q) =>
        q.eq("trainlyUserId", trainlyUserId).eq("appId", args.appId),
      )
      .first();

    if (!authorization) {
      throw new Error("No authorization found for this app.");
    }

    // Revoke the authorization
    await ctx.db.patch(authorization._id, {
      isRevoked: true,
    });

    // Revoke the user auth token
    const authToken = await ctx.db
      .query("user_auth_tokens")
      .withIndex("by_token", (q) =>
        q.eq("userAuthToken", authorization.userAuthToken),
      )
      .first();

    if (authToken) {
      await ctx.db.patch(authToken._id, {
        isRevoked: true,
      });
    }

    // Archive the chat
    const chat = await ctx.db.get(authorization.chatId);
    if (chat) {
      await ctx.db.patch(authorization.chatId, {
        isArchived: true,
      });
    }

    return {
      success: true,
      message: `Access revoked for app ${args.appId}. Your auth token has been invalidated.`,
    };
  },
});

// Generate app authorization URL (for OAuth-style flow)
export const generateAppAuthUrl = mutation({
  args: {
    appId: v.string(),
    redirectUrl: v.optional(v.string()),
    requestedCapabilities: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Verify app exists
    const app = await ctx.db
      .query("apps")
      .withIndex("by_appId", (q) => q.eq("appId", args.appId))
      .first();

    if (!app || !app.isActive) {
      throw new Error("App not found or inactive.");
    }

    // Generate authorization URL
    const authUrl =
      `https://trainly.com/auth/app-authorize?` +
      `app_id=${args.appId}&` +
      `capabilities=${encodeURIComponent(JSON.stringify(args.requestedCapabilities || ["ask"]))}` +
      (args.redirectUrl
        ? `&redirect_url=${encodeURIComponent(args.redirectUrl)}`
        : "");

    return {
      authUrl,
      app: {
        name: app.name,
        description: app.description,
        iconUrl: app.iconUrl,
      },
      requestedCapabilities: args.requestedCapabilities || ["ask"],
      message:
        "User must visit this URL to authorize your app and get their private auth token",
    };
  },
});
