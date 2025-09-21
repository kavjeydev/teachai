import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

/**
 * Convex functions for managing Chat Integration Keys
 * Integrates with the secure Chat-as-API system
 */

// Create a new integration key for a chat
export const createIntegrationKey = mutation({
  args: {
    chatId: v.id("chats"),
    scopes: v.array(v.string()),
    allowedOrigins: v.optional(v.array(v.string())),
    rateLimitRpm: v.optional(v.number()),
    description: v.optional(v.string()),
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
      throw new Error("Not authorized to create API keys for this chat.");
    }

    // Generate key ID (the actual key generation happens in the backend)
    const keyId = `cik_${Date.now().toString(36)}_${Math.random().toString(36).substr(2)}`;

    // Store integration key metadata in Convex
    const integrationKey = await ctx.db.insert("integration_keys", {
      keyId,
      chatId: args.chatId,
      userId,
      scopes: args.scopes,
      allowedOrigins: args.allowedOrigins || ["*"],
      rateLimitRpm: args.rateLimitRpm || 60,
      description: args.description || "Generated from dashboard",
      isRevoked: false,
      createdAt: Date.now(),
      lastUsed: null,
      usageCount: 0,
    });

    // Update chat to mark it as having API access
    await ctx.db.patch(args.chatId, {
      hasApiAccess: true,
      apiKeyDisabled: false,
    });

    return {
      keyId,
      integrationKeyId: integrationKey,
      scopes: args.scopes,
      allowedOrigins: args.allowedOrigins || ["*"],
      rateLimitRpm: args.rateLimitRpm || 60,
    };
  },
});

// Get all integration keys for a user
export const getUserIntegrationKeys = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const keys = await ctx.db
      .query("integration_keys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isRevoked"), false))
      .order("desc")
      .collect();

    // Get chat titles for each key
    const keysWithChatInfo = await Promise.all(
      keys.map(async (key) => {
        const chat = await ctx.db.get(key.chatId);
        return {
          ...key,
          chatTitle: chat?.title || "Unknown Chat",
          chatVisibility: chat?.visibility || "private",
        };
      })
    );

    return keysWithChatInfo;
  },
});

// Get integration keys for a specific chat
export const getChatIntegrationKeys = query({
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
      throw new Error("Not authorized to view API keys for this chat.");
    }

    const keys = await ctx.db
      .query("integration_keys")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.eq(q.field("isRevoked"), false))
      .order("desc")
      .collect();

    return keys;
  },
});

// Revoke an integration key
export const revokeIntegrationKey = mutation({
  args: {
    integrationKeyId: v.id("integration_keys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get the integration key
    const integrationKey = await ctx.db.get(args.integrationKeyId);
    if (!integrationKey) {
      throw new Error("Integration key not found.");
    }

    if (integrationKey.userId !== userId) {
      throw new Error("Not authorized to revoke this key.");
    }

    // Mark as revoked
    await ctx.db.patch(args.integrationKeyId, {
      isRevoked: true,
      revokedAt: Date.now(),
    });

    // Check if this was the last key for the chat
    const remainingKeys = await ctx.db
      .query("integration_keys")
      .withIndex("by_chat", (q) => q.eq("chatId", integrationKey.chatId))
      .filter((q) => q.eq(q.field("isRevoked"), false))
      .collect();

    // If no more active keys, disable API access for the chat
    if (remainingKeys.length === 0) {
      await ctx.db.patch(integrationKey.chatId, {
        hasApiAccess: false,
        apiKeyDisabled: true,
      });
    }

    return true;
  },
});

// Update integration key settings
export const updateIntegrationKey = mutation({
  args: {
    integrationKeyId: v.id("integration_keys"),
    allowedOrigins: v.optional(v.array(v.string())),
    rateLimitRpm: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get the integration key
    const integrationKey = await ctx.db.get(args.integrationKeyId);
    if (!integrationKey) {
      throw new Error("Integration key not found.");
    }

    if (integrationKey.userId !== userId) {
      throw new Error("Not authorized to update this key.");
    }

    // Update the key
    const updates: any = {};
    if (args.allowedOrigins !== undefined) updates.allowedOrigins = args.allowedOrigins;
    if (args.rateLimitRpm !== undefined) updates.rateLimitRpm = args.rateLimitRpm;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.integrationKeyId, updates);

    return true;
  },
});

// Log API usage (called from the backend)
export const logApiUsage = mutation({
  args: {
    keyId: v.string(),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    tokensUsed: v.optional(v.number()),
    runId: v.optional(v.string()),
    responseTime: v.optional(v.number()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the integration key
    const integrationKey = await ctx.db
      .query("integration_keys")
      .withIndex("by_key_id", (q) => q.eq("keyId", args.keyId))
      .first();

    if (!integrationKey) {
      throw new Error("Integration key not found.");
    }

    // Update usage statistics
    await ctx.db.patch(integrationKey._id, {
      lastUsed: Date.now(),
      usageCount: integrationKey.usageCount + 1,
    });

    // Log the usage
    await ctx.db.insert("api_usage_logs", {
      integrationKeyId: integrationKey._id,
      chatId: integrationKey.chatId,
      userId: integrationKey.userId,
      endpoint: args.endpoint,
      method: args.method,
      statusCode: args.statusCode,
      tokensUsed: args.tokensUsed || 0,
      runId: args.runId,
      responseTime: args.responseTime,
      ipAddress: args.ipAddress,
      timestamp: Date.now(),
    });

    return true;
  },
});

// Get usage statistics for a chat
export const getChatUsageStats = query({
  args: {
    chatId: v.id("chats"),
    timeRange: v.optional(v.string()), // "24h", "7d", "30d"
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
      throw new Error("Not authorized to view usage stats for this chat.");
    }

    // Calculate time range
    const now = Date.now();
    const timeRanges = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    const range = timeRanges[args.timeRange as keyof typeof timeRanges] || timeRanges["7d"];
    const since = now - range;

    // Get usage logs
    const logs = await ctx.db
      .query("api_usage_logs")
      .withIndex("by_chat_timestamp", (q) =>
        q.eq("chatId", args.chatId).gte("timestamp", since)
      )
      .collect();

    // Calculate statistics
    const totalRequests = logs.length;
    const totalTokens = logs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);
    const successfulRequests = logs.filter(log => log.statusCode < 400).length;
    const errorRate = totalRequests > 0 ? (totalRequests - successfulRequests) / totalRequests : 0;
    const avgResponseTime = logs.length > 0
      ? logs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / logs.length
      : 0;

    // Group by endpoint
    const endpointStats = logs.reduce((acc, log) => {
      const endpoint = log.endpoint;
      if (!acc[endpoint]) {
        acc[endpoint] = { count: 0, tokens: 0 };
      }
      acc[endpoint].count++;
      acc[endpoint].tokens += log.tokensUsed || 0;
      return acc;
    }, {} as Record<string, { count: number; tokens: number }>);

    return {
      timeRange: args.timeRange || "7d",
      totalRequests,
      totalTokens,
      successfulRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      endpointStats,
      period: {
        start: new Date(since).toISOString(),
        end: new Date(now).toISOString(),
      },
    };
  },
});

// Get API key health check
export const getKeyHealth = query({
  args: {
    integrationKeyId: v.id("integration_keys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const integrationKey = await ctx.db.get(args.integrationKeyId);
    if (!integrationKey) {
      throw new Error("Integration key not found.");
    }

    if (integrationKey.userId !== userId) {
      throw new Error("Not authorized to view this key.");
    }

    // Get recent usage (last 24 hours)
    const since = Date.now() - (24 * 60 * 60 * 1000);
    const recentLogs = await ctx.db
      .query("api_usage_logs")
      .withIndex("by_key_timestamp", (q) =>
        q.eq("integrationKeyId", args.integrationKeyId).gte("timestamp", since)
      )
      .collect();

    const recentRequests = recentLogs.length;
    const recentErrors = recentLogs.filter(log => log.statusCode >= 400).length;

    return {
      keyId: integrationKey.keyId,
      isActive: !integrationKey.isRevoked,
      createdAt: new Date(integrationKey.createdAt).toISOString(),
      lastUsed: integrationKey.lastUsed
        ? new Date(integrationKey.lastUsed).toISOString()
        : null,
      totalUsage: integrationKey.usageCount,
      recentRequests,
      recentErrors,
      errorRate: recentRequests > 0 ? recentErrors / recentRequests : 0,
      scopes: integrationKey.scopes,
      allowedOrigins: integrationKey.allowedOrigins,
      rateLimitRpm: integrationKey.rateLimitRpm,
    };
  },
});
