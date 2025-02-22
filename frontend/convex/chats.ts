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

    if (!existingChat) {
      throw new Error("Not found");
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
