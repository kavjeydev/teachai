import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

export const getChats = query({
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

    return chats;
  },
});

export const createChat = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const document = await ctx.db.insert("chats", {
      chatId: "chat-" + 1,
      title: args.title,
      userId: userId,
      isArchived: false,
      content: [],
      apiInfo: {
        visibility: "protected",
      },
      apiKey: "undefined",
      apiKeyDisabled: true,
      visibility: "private",
    });

    return document;
  },
});

export const uploadContext = mutation({
  args: {
    id: v.id("chats"),
    context: v.object({
      filename: v.string(),
      fileId: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    let existingContext = existingDocument.context;

    if (existingContext) {
      existingContext.push(args.context);
    } else {
      existingContext = [args.context];
    }

    const document = await ctx.db.patch(args.id, {
      context: existingContext,
    });

    return document;
  },
});

export const eraseContext = mutation({
  args: {
    id: v.id("chats"),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const existingChat = await ctx.db.get(args.id);

    const currentContext = existingChat?.context;

    const filteredContext = currentContext?.filter(
      (objs) => objs.fileId != args.fileId,
    );

    const chat = await ctx.db.patch(args.id, {
      context: filteredContext,
    });
  },
});

export const getContext = query({
  args: {
    id: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (
      existingDocument.userId !== userId &&
      existingDocument.visibility === "private"
    ) {
      throw new Error("Unauthorized");
    }

    return existingDocument.context;
  },
});

export const writeContent = mutation({
  args: {
    id: v.id("chats"),
    chat: v.object({
      sender: v.string(),
      text: v.string(),
      user: v.string(),
      reasoningContext: v.optional(
        v.array(
          v.object({
            chunk_id: v.string(),
            chunk_text: v.string(),
            score: v.number(),
          }),
        ),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (
      existingDocument.userId !== userId &&
      existingDocument.visibility === "private"
    ) {
      throw new Error("Unauthorized");
    }

    let currContent = existingDocument.content;
    currContent?.push(args.chat);

    const document = await ctx.db.patch(args.id, {
      content: currContent,
    });

    return document;
  },
});

export const getChatById = query({
  args: {
    id: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const existingChat = await ctx.db.get(args.id);

    if (!existingChat) {
      throw new Error("Not found");
    }

    if (
      existingChat.userId !== userId &&
      existingChat.visibility === "private"
    ) {
      throw new Error("Unauthorized");
    }

    return existingChat;
  },
});

export const getChatContent = query({
  args: {
    id: v.id("chats"), // Chat ID
  },
  handler: async (ctx, args) => {
    // 1. Authenticate the User
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject; // Authenticated user's ID

    const chatDocument = await ctx.db.get(args.id);

    if (
      chatDocument?.userId !== userId &&
      chatDocument?.visibility === "private"
    ) {
      throw new Error("Unauthorized");
    }

    if (!chatDocument) {
      throw new Error("Chat not found.");
    }

    const userContent = chatDocument?.content?.filter(
      (message) => message.user === userId,
    );

    return userContent;
  },
});

export const archive = mutation({
  args: {
    id: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Document not found.");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized to modify.");
    }

    const document = await ctx.db.patch(args.id, {
      isArchived: true,
    });

    return document;
  },
});

export const changeVisibility = mutation({
  args: {
    id: v.id("chats"),
    visibility: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const userId = identity.subject;

    const existingChat = await ctx.db.get(args.id);

    if (!existingChat) {
      throw new Error("Document not found.");
    }

    if (existingChat.userId !== userId) {
      throw new Error("Unauthorized to modify.");
    }

    const chat = await ctx.db.patch(args.id, {
      apiInfo: {
        visibility: args.visibility,
      },
      apiKeyDisabled: args.visibility === "protected" ? true : false,
    });

    return chat;
  },
});

export const rename = mutation({
  args: {
    id: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Document not found.");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized to modify.");
    }

    const document = await ctx.db.patch(args.id, {
      title: args.title,
    });

    return document;
  },
});

export const setApiKey = mutation({
  args: {
    id: v.id("chats"),
    newApiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const userId = identity.subject;

    const existingChat = await ctx.db.get(args.id);

    if (!existingChat) {
      throw new Error("Document not found.");
    }

    if (existingChat.userId !== userId) {
      throw new Error("Unauthorized to modify.");
    }

    const chat = await ctx.db.patch(args.id, {
      apiKey: args.newApiKey,
    });

    return chat;
  },
});

export const getChatByIdExposed = query({
  args: {
    id: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const existingChat = await ctx.db.get(args.id);

    // Return null instead of throwing error for API compatibility
    if (!existingChat) {
      return null;
    }

    return existingChat;
  },
});

export const remove = mutation({
  args: {
    id: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const existingChat = await ctx.db.get(args.id);

    if (!existingChat) {
      throw new Error("Document does not exist");
    }
    if (existingChat.userId !== userId) {
      throw new Error("Not authorized");
    }

    const chat = await ctx.db.delete(args.id);
    return chat;
  },
});

export const getArchivedChats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return chats;
  },
});

export const unArchive = mutation({
  args: {
    id: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Document not found.");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized to modify.");
    }

    const document = await ctx.db.patch(args.id, {
      isArchived: false,
    });

    return document;
  },
});

export const changeChatVisibility = mutation({
  args: {
    id: v.id("chats"),
    visibility: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Document not found.");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized to modify.");
    }

    const document = await ctx.db.patch(args.id, {
      visibility: args.visibility,
    });

    return document;
  },
});

export const getPublicChats = query({
  handler: async (ctx) => {
    const chats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("visibility"), "public"))
      .collect();

    return chats;
  },
});

// Folder management functions
export const getFolders = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return folders;
  },
});

export const createFolder = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const folder = await ctx.db.insert("folders", {
      name: args.name,
      userId: userId,
      color: args.color,
      createdAt: Date.now(),
    });

    return folder;
  },
});

export const moveToFolder = mutation({
  args: {
    chatId: v.id("chats"),
    folderId: v.optional(v.string()),
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
      throw new Error("Not authorized to move this chat.");
    }

    await ctx.db.patch(args.chatId, {
      folderId: args.folderId,
    });

    return true;
  },
});

export const deleteFolder = mutation({
  args: {
    folderId: v.id("folders"),
    deleteChats: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error("Folder not found.");
    }

    if (folder.userId !== identity.subject) {
      throw new Error("Not authorized to delete this folder.");
    }

    // Get all chats in this folder
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .collect();

    if (args.deleteChats) {
      // Delete all chats in the folder (this will also remove their context)
      for (const chat of chats) {
        await ctx.db.delete(chat._id);
      }
    } else {
      // Move all chats in this folder back to uncategorized
      for (const chat of chats) {
        await ctx.db.patch(chat._id, { folderId: undefined });
      }
    }

    // Delete the folder
    await ctx.db.delete(args.folderId);
    return { deletedChats: args.deleteChats ? chats.length : 0 };
  },
});

export const getFolderChatCount = query({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    return chats.length;
  },
});

// Favoriting functionality
export const toggleFavorite = mutation({
  args: {
    chatId: v.id("chats"),
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
      throw new Error("Not authorized to favorite this chat.");
    }

    // Check current favorite count to enforce limit of 3
    if (!chat.isFavorited) {
      const favoriteCount = await ctx.db
        .query("chats")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .filter((q) => q.eq(q.field("isFavorited"), true))
        .collect();

      if (favoriteCount.length >= 3) {
        throw new Error(
          "You can only favorite up to 3 chats. Please unfavorite another chat first.",
        );
      }
    }

    const newFavoriteStatus = !chat.isFavorited;
    await ctx.db.patch(args.chatId, {
      isFavorited: newFavoriteStatus,
    });

    return newFavoriteStatus;
  },
});

export const getFavoriteChats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const favoriteChats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isArchived"), false),
          q.eq(q.field("isFavorited"), true),
        ),
      )
      .order("desc")
      .collect();

    return favoriteChats;
  },
});

// Update AI model for a chat
export const updateChatModel = mutation({
  args: {
    chatId: v.id("chats"),
    selectedModel: v.string(),
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

    await ctx.db.patch(args.chatId, {
      selectedModel: args.selectedModel,
    });

    return true;
  },
});

// Update custom prompt for a chat
export const updateChatPrompt = mutation({
  args: {
    chatId: v.id("chats"),
    customPrompt: v.optional(v.string()),
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

    await ctx.db.patch(args.chatId, {
      customPrompt: args.customPrompt,
    });

    return true;
  },
});

// Update temperature for a chat
export const updateChatTemperature = mutation({
  args: {
    chatId: v.id("chats"),
    temperature: v.number(),
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

    await ctx.db.patch(args.chatId, {
      temperature: args.temperature,
    });

    return true;
  },
});

// Update max tokens for a chat
export const updateChatMaxTokens = mutation({
  args: {
    chatId: v.id("chats"),
    maxTokens: v.number(),
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

    await ctx.db.patch(args.chatId, {
      maxTokens: args.maxTokens,
    });

    return true;
  },
});

// Update conversation history limit for a chat
export const updateChatConversationHistoryLimit = mutation({
  args: {
    chatId: v.id("chats"),
    conversationHistoryLimit: v.number(),
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

    await ctx.db.patch(args.chatId, {
      conversationHistoryLimit: args.conversationHistoryLimit,
    });

    return true;
  },
});
