import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Simple API key management for TeachAI chats
 * Each chat gets one API key that can be used to access the chat via API
 */

// Generate a new API key for a chat
export const generateApiKey = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Verify user owns the chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found.");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized to generate API key for this chat.");
    }

    // Generate a secure API key
    const apiKey = `tk_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 16)}`;

    // Initialize chat metadata if it doesn't exist
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
      fileTypeStats: {
        pdf: 0,
        docx: 0,
        txt: 0,
        images: 0,
        other: 0,
      },
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

    // Update chat with new API key, enable API access, and initialize metadata
    await ctx.db.patch(args.chatId, {
      apiKey: apiKey,
      apiKeyDisabled: false,
      hasApiAccess: true,
      metadata: chat.metadata || defaultMetadata,
    });

    // If this is the first time enabling API access, initialize analytics from existing sub-chats
    if (!chat.metadata) {
      try {
        // Find existing sub-chats for this chat
        const existingSubchats = await ctx.db
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

        const totalSubchats = existingSubchats.length + userAppChats.length;

        if (totalSubchats > 0) {
          // Initialize with real data from existing sub-chats (no estimates or random data)
          const allUsers = new Map();

          // Add from sub-chats
          for (const subchat of existingSubchats) {
            const userHash = `user_***${subchat.userId.slice(-6)}`;
            if (!allUsers.has(userHash)) {
              allUsers.set(userHash, {
                userIdHash: userHash,
                lastActiveAt: subchat._creationTime || 0, // Use creation time as last activity
                filesUploaded: 0, // Will be tracked from real uploads
                queriesMade: 0, // Will be tracked from real API calls
                storageUsedBytes: 0, // Will be tracked from real uploads
              });
            }
          }

          // Add from user_app_chats
          for (const userAppChat of userAppChats) {
            const userHash = `user_***${userAppChat.endUserId.slice(-6)}`;
            if (!allUsers.has(userHash)) {
              allUsers.set(userHash, {
                userIdHash: userHash,
                lastActiveAt: userAppChat.lastActiveAt || 0, // Only real data or 0
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

          const initializedMetadata = {
            ...defaultMetadata,
            totalSubchats: totalSubchats,
            totalUsers: allUsers.size,
            activeUsers: activeUsers,
            userActivitySummary: Array.from(allUsers.values()),
            // All other metrics start at 0 and will be tracked from real usage
            totalQueries: 0,
            queriesLast7Days: 0,
            totalFiles: 0,
            totalStorageBytes: 0,
            averageFileSize: 0,
            averageResponseTime: 0,
            lastActivityAt: Math.max(
              ...Array.from(allUsers.values()).map((u) => u.lastActiveAt),
              0,
            ),
          };

          await ctx.db.patch(args.chatId, { metadata: initializedMetadata });
        }
      } catch (error) {
        // Don't fail API key generation if initialization fails
        console.error("Failed to initialize analytics:", error);
      }
    }

    return {
      apiKey,
      chatId: args.chatId,
      enabled: true,
    };
  },
});

// Disable API access for a chat
export const disableApiAccess = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Verify user owns the chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found.");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized to modify API access for this chat.");
    }

    // Disable API access
    await ctx.db.patch(args.chatId, {
      apiKeyDisabled: true,
      hasApiAccess: false,
    });

    return { success: true };
  },
});

// Enable API access for a chat (reuses existing key)
export const enableApiAccess = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Verify user owns the chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found.");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized to modify API access for this chat.");
    }

    // Check if chat has an API key
    if (!chat.apiKey || chat.apiKey === "undefined") {
      throw new Error("No API key exists. Please generate a new one.");
    }

    // Enable API access
    await ctx.db.patch(args.chatId, {
      apiKeyDisabled: false,
      hasApiAccess: true,
    });

    return {
      success: true,
      apiKey: chat.apiKey,
    };
  },
});

// Get API key status for a chat
export const getApiKeyStatus = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Verify user owns the chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found.");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized to view API status for this chat.");
    }

    const hasApiKey = chat.apiKey && chat.apiKey !== "undefined";
    const isEnabled = !chat.apiKeyDisabled && hasApiKey;

    return {
      hasApiKey,
      isEnabled,
      apiKey: hasApiKey ? chat.apiKey : null,
      chatId: args.chatId,
      chatTitle: chat.title,
    };
  },
});

// Regenerate API key for a chat
export const regenerateApiKey = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Verify user owns the chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found.");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized to regenerate API key for this chat.");
    }

    // Generate a new API key
    const newApiKey = `tk_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 16)}`;

    // Update chat with new API key
    await ctx.db.patch(args.chatId, {
      apiKey: newApiKey,
      apiKeyDisabled: false,
      hasApiAccess: true,
    });

    return {
      apiKey: newApiKey,
      chatId: args.chatId,
      regenerated: true,
    };
  },
});
