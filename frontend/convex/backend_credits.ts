import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Backend-safe function to check developer credits (no auth required)
export const checkDeveloperCredits = query({
  args: { developerId: v.string() },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", args.developerId))
      .first();

    if (!credits) {
      return {
        found: false,
        remainingCredits: 0,
        totalCredits: 0,
        usedCredits: 0,
      };
    }

    return {
      found: true,
      remainingCredits: credits.totalCredits - credits.usedCredits,
      totalCredits: credits.totalCredits,
      usedCredits: credits.usedCredits,
    };
  },
});

// Backend-safe function to consume developer credits (no auth required)
export const consumeDeveloperCredits = mutation({
  args: {
    developerId: v.string(),
    credits: v.number(),
    model: v.string(),
    tokensUsed: v.number(),
    description: v.string(),
    chatId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current credit balance
    const userCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", args.developerId))
      .first();

    if (!userCredits) {
      // Initialize developer with credits if they don't exist
      const now = Date.now();
      const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days

      const creditId = await ctx.db.insert("user_credits", {
        userId: args.developerId,
        totalCredits: 100000, // Give developers plenty of credits
        usedCredits: args.credits,
        periodStart: now,
        periodEnd: periodEnd,
        lastResetAt: now,
        updatedAt: now,
      });

      // Log the transaction
      await ctx.db.insert("credit_transactions", {
        userId: args.developerId,
        type: "usage",
        amount: -args.credits,
        description: args.description,
        model: args.model,
        tokensUsed: args.tokensUsed,
        relatedChatId: args.chatId,
        timestamp: now,
      });

      return {
        success: true,
        creditsUsed: args.credits,
        remainingCredits: 100000 - args.credits,
        wasInitialized: true,
      };
    }

    // Check if developer has enough credits
    const remainingCredits = userCredits.totalCredits - userCredits.usedCredits;
    if (remainingCredits < args.credits) {
      return {
        success: false,
        error: "Insufficient credits",
        creditsUsed: 0,
        remainingCredits: remainingCredits,
        required: args.credits,
      };
    }

    // Update credit usage
    await ctx.db.patch(userCredits._id, {
      usedCredits: userCredits.usedCredits + args.credits,
      updatedAt: Date.now(),
    });

    // Log the transaction
    await ctx.db.insert("credit_transactions", {
      userId: args.developerId,
      type: "usage",
      amount: -args.credits,
      description: args.description,
      model: args.model,
      tokensUsed: args.tokensUsed,
      relatedChatId: args.chatId,
      timestamp: Date.now(),
    });

    return {
      success: true,
      creditsUsed: args.credits,
      remainingCredits: remainingCredits - args.credits,
      wasInitialized: false,
    };
  },
});

// Get chat data along with app information (backend-safe)
export const getChatWithApp = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    // Find chat by chatId string field
    const chat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .first();

    if (!chat) {
      return null;
    }

    return {
      _id: chat._id,
      chatId: chat.chatId,
      userId: chat.userId,
      parentAppId: chat.parentAppId,
      chatType: chat.chatType,
    };
  },
});

// Get apps that have a specific parent chat (backend-safe)
export const getAppsForParentChat = query({
  args: { parentChatId: v.string() },
  handler: async (ctx, args) => {
    // First get the chat by its string ID to get the document ID
    const chat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("chatId"), args.parentChatId))
      .first();

    if (!chat) {
      return [];
    }

    // Now find apps with this chat as parent
    const apps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("parentChatId"), chat._id))
      .collect();

    return apps.map((app) => ({
      appId: app.appId,
      developerId: app.developerId,
      name: app.name,
      isActive: app.isActive,
    }));
  },
});

// Test function to create a sample chat for testing (backend-safe)
export const createTestChat = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if chat already exists
    const existingChat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .first();

    if (existingChat) {
      return {
        success: true,
        message: "Chat already exists",
        chatId: args.chatId,
        alreadyExists: true,
      };
    }

    // Create the test chat
    const chatDocId = await ctx.db.insert("chats", {
      chatId: args.chatId,
      title: args.title || "Test Chat for Credit Testing",
      userId: args.userId,
      chatType: "user_direct",
      isArchived: false,
      content: [],
      apiInfo: {
        visibility: "public",
      },
      apiKey: "test_api_key",
      apiKeyDisabled: false,
      visibility: "public",
    });

    return {
      success: true,
      message: "Test chat created successfully",
      chatId: args.chatId,
      docId: chatDocId,
      alreadyExists: false,
    };
  },
});
