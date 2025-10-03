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

    // Check user's subscription and chat limits
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get current chat count (non-archived chats only)
    const currentChats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    // Determine chat limit based on subscription tier
    let chatLimit = 1; // Default free tier limit

    if (subscription && subscription.status === "active") {
      switch (subscription.tier) {
        case "pro":
          chatLimit = 3;
          break;
        case "scale":
          chatLimit = 25;
          break;
        case "enterprise":
          chatLimit = -1; // Unlimited
          break;
        default:
          chatLimit = 1; // Free tier
      }
    }

    // Check if user has reached their chat limit
    if (chatLimit !== -1 && currentChats.length >= chatLimit) {
      const tierName = subscription?.tier || "free";
      throw new Error(
        `You've reached your chat limit of ${chatLimit} chat${chatLimit > 1 ? "s" : ""} for the ${tierName} tier. Please upgrade your plan or archive existing chats to create new ones.`,
      );
    }

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

    let existingContext = existingDocument.context || [];

    // Check if file already exists in context to prevent duplicates
    // Check both by fileId and filename to handle different scenarios
    const fileExists = existingContext.some(
      (contextItem) =>
        contextItem.fileId === args.context.fileId ||
        contextItem.filename === args.context.filename,
    );

    if (fileExists) {
      console.log(
        `File ${args.context.filename} (ID: ${args.context.fileId}) already exists in context, skipping duplicate`,
      );
      return existingDocument; // Return without adding duplicate
    }

    // Add the new context item
    existingContext.push(args.context);

    const document = await ctx.db.patch(args.id, {
      context: existingContext,
      hasUnpublishedChanges: true,
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

    if (!existingChat || existingChat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    const currentContext = existingChat?.context;

    // Find the file being removed to get its information
    const fileToRemove = currentContext?.find(
      (objs) => objs.fileId === args.fileId,
    );

    const filteredContext = currentContext?.filter(
      (objs) => objs.fileId != args.fileId,
    );

    // Update chat context
    const chat = await ctx.db.patch(args.id, {
      context: filteredContext,
      hasUnpublishedChanges: true,
    });

    // Find the file in upload queue to get its size for storage tracking
    if (fileToRemove) {
      // Try to find the file in the upload queue to get its size
      const uploadedFile = await ctx.db
        .query("file_upload_queue")
        .withIndex("by_chat", (q) => q.eq("chatId", args.id))
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("fileName"), fileToRemove.filename),
            q.eq(q.field("status"), "completed"),
          ),
        )
        .first();

      if (uploadedFile) {
        // Update storage tracking by removing this file's size
        const storage = await ctx.db
          .query("user_file_storage")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        if (storage) {
          // Calculate new values
          const newTotalSize = Math.max(
            0,
            storage.totalFileSizeBytes - uploadedFile.fileSize,
          );
          const newFileCount = Math.max(0, storage.fileCount - 1);

          // Update chat-specific size tracking
          const chatIdStr = args.id.toString();
          const chatFileSizes = storage.chatFileSizes || {};
          const currentChatSize = chatFileSizes[chatIdStr] || 0;
          const newChatSize = Math.max(
            0,
            currentChatSize - uploadedFile.fileSize,
          );
          const newChatFileSizes = {
            ...chatFileSizes,
            [chatIdStr]: newChatSize,
          };

          // Remove chat entry if size is 0
          if (newChatSize === 0) {
            delete newChatFileSizes[chatIdStr];
          }

          await ctx.db.patch(storage._id, {
            totalFileSizeBytes: newTotalSize,
            fileCount: newFileCount,
            lastUpdated: Date.now(),
            chatFileSizes: newChatFileSizes,
          });
        }
      }
    }

    return chat;
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

    // Clean up storage tracking for this chat before deleting
    const storage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (storage && storage.chatFileSizes) {
      const chatIdStr = args.id.toString();
      const chatFileSizes = storage.chatFileSizes || {};
      const chatSize = chatFileSizes[chatIdStr] || 0;

      if (chatSize > 0) {
        // Remove chat from tracking and update totals
        const newChatFileSizes = { ...chatFileSizes };
        delete newChatFileSizes[chatIdStr];

        // Get files count for this chat to update file count
        const chatFiles = await ctx.db
          .query("file_upload_queue")
          .withIndex("by_chat", (q) => q.eq("chatId", args.id))
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), userId),
              q.eq(q.field("status"), "completed"),
            ),
          )
          .collect();

        await ctx.db.patch(storage._id, {
          totalFileSizeBytes: Math.max(
            0,
            storage.totalFileSizeBytes - chatSize,
          ),
          fileCount: Math.max(0, storage.fileCount - chatFiles.length),
          lastUpdated: Date.now(),
          chatFileSizes: newChatFileSizes,
        });
      }
    }

    // Clean up file upload queue entries for this chat
    const chatFiles = await ctx.db
      .query("file_upload_queue")
      .withIndex("by_chat", (q) => q.eq("chatId", args.id))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    for (const file of chatFiles) {
      await ctx.db.delete(file._id);
    }

    // Delete the chat
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
      hasUnpublishedChanges: true,
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
      hasUnpublishedChanges: true,
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
      hasUnpublishedChanges: true,
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
      hasUnpublishedChanges: true,
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
      hasUnpublishedChanges: true,
    });

    return true;
  },
});

// Publish chat settings to make them live for API
export const publishChatSettings = mutation({
  args: {
    chatId: v.id("chats"),
    description: v.optional(v.string()), // Optional description for this version
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
      throw new Error("Not authorized to publish this chat.");
    }

    const now = Date.now();
    const versionId = `v${now}_${Math.random().toString(36).substr(2, 9)}`;

    // Create published settings from current draft settings
    const publishedSettings = {
      selectedModel: chat.selectedModel,
      customPrompt: chat.customPrompt,
      temperature: chat.temperature,
      maxTokens: chat.maxTokens,
      conversationHistoryLimit: chat.conversationHistoryLimit,
      context: chat.context,
      publishedAt: now,
      publishedBy: identity.subject,
    };

    // Create version entry for history
    const newVersion = {
      versionId,
      selectedModel: chat.selectedModel,
      customPrompt: chat.customPrompt,
      temperature: chat.temperature,
      maxTokens: chat.maxTokens,
      conversationHistoryLimit: chat.conversationHistoryLimit,
      context: chat.context,
      publishedAt: now,
      publishedBy: identity.subject,
      description: args.description,
    };

    // Add to version history (keep last 10 versions)
    const existingVersions = chat.publishedVersions || [];
    const updatedVersions = [newVersion, ...existingVersions].slice(0, 10);

    await ctx.db.patch(args.chatId, {
      publishedSettings,
      publishedVersions: updatedVersions,
      hasUnpublishedChanges: false,
    });

    return publishedSettings;
  },
});

// Rollback to published settings (discard draft changes)
export const rollbackChatSettings = mutation({
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
      throw new Error("Not authorized to rollback this chat.");
    }

    if (!chat.publishedSettings) {
      throw new Error("No published settings to rollback to.");
    }

    // Restore draft settings from published settings
    await ctx.db.patch(args.chatId, {
      selectedModel: chat.publishedSettings.selectedModel,
      customPrompt: chat.publishedSettings.customPrompt,
      temperature: chat.publishedSettings.temperature,
      maxTokens: chat.publishedSettings.maxTokens,
      conversationHistoryLimit: chat.publishedSettings.conversationHistoryLimit,
      context: chat.publishedSettings.context,
      hasUnpublishedChanges: false,
    });

    return true;
  },
});

// Rollback to a specific version from history
export const rollbackToVersion = mutation({
  args: {
    chatId: v.id("chats"),
    versionId: v.string(),
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
      throw new Error("Not authorized to rollback this chat.");
    }

    // Find the version to rollback to
    const version = chat.publishedVersions?.find(
      (v) => v.versionId === args.versionId,
    );
    if (!version) {
      throw new Error("Version not found in history.");
    }

    // Restore settings from the selected version
    await ctx.db.patch(args.chatId, {
      selectedModel: version.selectedModel,
      customPrompt: version.customPrompt,
      temperature: version.temperature,
      maxTokens: version.maxTokens,
      conversationHistoryLimit: version.conversationHistoryLimit,
      context: version.context,
      publishedSettings: {
        selectedModel: version.selectedModel,
        customPrompt: version.customPrompt,
        temperature: version.temperature,
        maxTokens: version.maxTokens,
        conversationHistoryLimit: version.conversationHistoryLimit,
        context: version.context,
        publishedAt: version.publishedAt,
        publishedBy: version.publishedBy,
      },
      hasUnpublishedChanges: false,
    });

    return version;
  },
});

// Get version history for a chat
export const getVersionHistory = query({
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
      return null;
    }

    if (chat.userId !== identity.subject) {
      throw new Error("Not authorized to view this chat's history.");
    }

    return chat.publishedVersions || [];
  },
});

// Get published settings for API consumption
export const getPublishedSettings = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return null;
    }

    // ONLY return published settings - no fallback to current settings
    // The API should only work with explicitly published settings
    return chat.publishedSettings || null;
  },
});

// Get user's chat limits and current usage
export const getUserChatLimits = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Check user's subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get current chat count (non-archived chats only)
    const currentChats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    // Determine chat limit based on subscription tier
    let chatLimit = 1; // Default free tier limit
    let tierName = "free";

    if (subscription && subscription.status === "active") {
      tierName = subscription.tier;
      switch (subscription.tier) {
        case "pro":
          chatLimit = 3;
          break;
        case "scale":
          chatLimit = 25;
          break;
        case "enterprise":
          chatLimit = -1; // Unlimited
          break;
        default:
          chatLimit = 1; // Free tier
      }
    }

    return {
      currentChatCount: currentChats.length,
      chatLimit: chatLimit,
      tierName: tierName,
      canCreateMore: chatLimit === -1 || currentChats.length < chatLimit,
      remainingChats:
        chatLimit === -1 ? -1 : Math.max(0, chatLimit - currentChats.length),
    };
  },
});
