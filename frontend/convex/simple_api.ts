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

    // Update chat with new API key and enable API access
    await ctx.db.patch(args.chatId, {
      apiKey: apiKey,
      apiKeyDisabled: false,
      hasApiAccess: true,
    });

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
      apiKey: chat.apiKey
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
