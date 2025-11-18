import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

export const getChats = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // If organizationId is provided, verify it exists and user owns it
    if (args.organizationId) {
      const organization = await ctx.db.get(args.organizationId as any);
    if (!organization) {
      throw new Error("Organization not found.");
    }
      if ((organization as any).userId !== userId) {
      throw new Error("Unauthorized to view chats in this organization.");
    }

    const chats = await ctx.db
      .query("chats")
        .withIndex("by_user_organization" as any, (q: any) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId),
      )
        .filter((q) => q.eq(q.field("isArchived"), false))
        .order("desc")
        .collect();

      return chats;
    }

    // If no organizationId provided, return all user's chats (for backward compatibility)
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
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Verify organization exists and user owns it
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found.");
    }
    if (organization.userId !== userId) {
      throw new Error("Unauthorized to create chats in this organization.");
    }

    // Generate unique chat ID
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 8);
    const uniqueChatId = `chat_${timestamp}_${randomPart}`;

    const document = await ctx.db.insert("chats", {
      chatId: uniqueChatId,
      title: args.title,
      userId: userId,
      organizationId: args.organizationId,
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

    // Check if exact same file already exists in context (by fileId only)
    const fileExists = existingContext.some(
      (contextItem) => contextItem.fileId === args.context.fileId,
    );

    if (fileExists) {
      console.log(
        `File with ID ${args.context.fileId} already exists in context, skipping exact duplicate`,
      );
      return existingDocument; // Return without adding duplicate
    }

    // Add the new context item
    existingContext.push(args.context);

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

        // Update the current chat's storage metadata
        const currentMetadata = existingChat.metadata || {
          totalSubchats: 0,
          activeUsers: 0,
          totalUsers: 0,
          totalFiles: 0,
          totalStorageBytes: 0,
          totalFileSize: 0, // Use totalFileSize instead of averageFileSize
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

        // Update the current chat's storage metadata
        const newTotalFiles = Math.max(0, currentMetadata.totalFiles - 1);
        const newTotalStorageBytes = Math.max(
          0,
          currentMetadata.totalStorageBytes - uploadedFile.fileSize,
        );
        const newTotalFileSize = Math.max(
          0,
          (currentMetadata.totalFileSize || 0) - uploadedFile.fileSize,
        );

        const updatedMetadata = {
          ...currentMetadata,
          totalFiles: newTotalFiles,
          totalStorageBytes: newTotalStorageBytes,
          totalFileSize: newTotalFileSize, // Use totalFileSize instead of averageFileSize
          lastActivityAt: Date.now(),
          lastMetadataUpdate: Date.now(),
        };

        await ctx.db.patch(existingChat._id, {
          metadata: updatedMetadata,
        });

        console.log(
          `📊 Updated chat ${existingChat.chatId} storage: -${uploadedFile.fileSize} bytes (total: ${updatedMetadata.totalStorageBytes})`,
        );

        // If this is a subchat, ALSO update the parent chat's storage
        if (
          existingChat.chatType === "app_subchat" &&
          (existingChat.parentChatId || existingChat.parentAppId)
        ) {
          // Use direct parentChatId if available, otherwise fallback to parentAppId lookup
          let parentChat = null;

          if (existingChat.parentChatId) {
            // Direct reference using string chatId - much more efficient
            parentChat = await ctx.db
              .query("chats")
              .filter((q) => q.eq(q.field("chatId"), existingChat.parentChatId))
              .first();
          } else if (existingChat.parentAppId) {
            // Legacy fallback - lookup by app's parentChatId
            const parentAppId = existingChat.parentAppId;
            const app = await ctx.db
              .query("apps")
              .withIndex("by_appId", (q) => q.eq("appId", parentAppId))
              .first();

            if (app && app.parentChatId) {
              parentChat = await ctx.db.get(app.parentChatId);
            }
          }

          if (parentChat) {
            const parentMetadata = parentChat.metadata || {
              totalSubchats: 0,
              activeUsers: 0,
              totalUsers: 0,
              totalFiles: 0,
              totalStorageBytes: 0,
              totalFileSize: 0, // Use totalFileSize instead of averageFileSize
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

            // Update parent chat's storage metadata
            const parentNewTotalFiles = Math.max(
              0,
              parentMetadata.totalFiles - 1,
            );
            const parentNewTotalStorageBytes = Math.max(
              0,
              parentMetadata.totalStorageBytes - uploadedFile.fileSize,
            );
            const parentNewTotalFileSize = Math.max(
              0,
              (parentMetadata.totalFileSize || 0) - uploadedFile.fileSize,
            );

            const updatedParentMetadata = {
              ...parentMetadata,
              totalFiles: parentNewTotalFiles,
              totalStorageBytes: parentNewTotalStorageBytes,
              totalFileSize: parentNewTotalFileSize, // Use totalFileSize instead of averageFileSize
              lastActivityAt: Date.now(),
              lastMetadataUpdate: Date.now(),
            };

            await ctx.db.patch(parentChat._id, {
              metadata: updatedParentMetadata,
            });

            console.log(
              `📊 Updated parent chat ${existingChat.parentAppId} storage: -${uploadedFile.fileSize} bytes (total: ${updatedParentMetadata.totalStorageBytes})`,
            );
          } else {
            console.warn(
              `Parent chat not found for subchat ${existingChat.chatId}`,
            );
          }
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

// Get archived chats
export const getArchivedChats = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // If organizationId is provided, verify it exists and user owns it
    if (args.organizationId) {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found.");
    }
    if (organization.userId !== userId) {
      throw new Error("Unauthorized to view chats in this organization.");
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId),
      )
        .filter((q) => q.eq(q.field("isArchived"), true))
        .order("desc")
        .collect();

      return chats;
    }

    // If no organizationId provided, return all user's archived chats (for backward compatibility)
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return chats;
  },
});

// Restore chat from archive
export const restoreFromArchive = mutation({
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

    if (!existingDocument.isArchived) {
      throw new Error("Chat is not archived.");
    }

    const document = await ctx.db.patch(args.id, {
      isArchived: false,
    });

    return document;
  },
});

// Permanently delete chat and all associated data
export const permanentlyDelete = mutation({
  args: {
    id: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const userId = identity.subject;

    const existingChat = await ctx.db.get(args.id);

    if (!existingChat) {
      throw new Error("Chat not found.");
    }

    if (existingChat.userId !== userId) {
      throw new Error("Unauthorized to delete.");
    }

    if (!existingChat.isArchived) {
      throw new Error("Chat must be archived before permanent deletion.");
    }

    // Find all child chats (subchats) that belong to this parent chat
    const childChats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("parentChatId"), existingChat.chatId))
      .collect();

    // Delete all child chats first
    for (const childChat of childChats) {
      // Delete child chat
      await ctx.db.delete(childChat._id);
    }

    console.log(
      `🗑️ PERMANENT DELETE MUTATION CALLED for chat: ${existingChat.chatId}`,
    );
    console.log(`🗑️ Chat details:`, {
      _id: existingChat._id,
      chatId: existingChat.chatId,
      title: existingChat.title,
      isArchived: existingChat.isArchived,
    });

    // Neo4j cleanup will be handled by the frontend after this mutation completes

    // Delete the parent chat
    await ctx.db.delete(args.id);

    return {
      success: true,
      chatId: existingChat.chatId,
      convexId: existingChat._id, // Also return the Convex ID for Neo4j cleanup
      deletedChildChats: childChats.length,
      childChatIds: childChats.map((chat) => chat.chatId), // Return child chat IDs for Neo4j cleanup
    };
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

    // If this is a subchat being deleted, update parent chat's storage
    if (
      existingChat.chatType === "app_subchat" &&
      (existingChat.parentChatId || existingChat.parentAppId)
    ) {
      // Use direct parentChatId if available, otherwise fallback to parentAppId lookup
      let parentChat = null;

      if (existingChat.parentChatId) {
        // Direct reference using string chatId - much more efficient
        parentChat = await ctx.db
          .query("chats")
          .filter((q) => q.eq(q.field("chatId"), existingChat.parentChatId))
          .first();
      } else if (existingChat.parentAppId) {
        // Legacy fallback - lookup by app's parentChatId
        const parentAppId = existingChat.parentAppId!;
        const app = await ctx.db
          .query("apps")
          .withIndex("by_appId", (q) => q.eq("appId", parentAppId))
          .first();

        if (app && app.parentChatId) {
          parentChat = await ctx.db.get(app.parentChatId);
        }
      }

      if (parentChat) {
        const currentMetadata = existingChat.metadata || {
          totalFiles: 0,
          totalStorageBytes: 0,
          totalFileSize: 0,
        };

        // If the subchat has storage, remove it from the parent
        if (
          currentMetadata.totalStorageBytes > 0 ||
          currentMetadata.totalFiles > 0
        ) {
          const parentMetadata = parentChat.metadata || {
            totalSubchats: 0,
            activeUsers: 0,
            totalUsers: 0,
            totalFiles: 0,
            totalStorageBytes: 0,
            totalFileSize: 0, // Use totalFileSize instead of averageFileSize
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

          // Update parent chat's storage metadata
          const parentNewTotalFiles = Math.max(
            0,
            parentMetadata.totalFiles - currentMetadata.totalFiles,
          );
          const parentNewTotalStorageBytes = Math.max(
            0,
            parentMetadata.totalStorageBytes -
              currentMetadata.totalStorageBytes,
          );
          const parentNewTotalFileSize = Math.max(
            0,
            (parentMetadata.totalFileSize || 0) -
              (currentMetadata.totalFileSize || 0),
          );

          const updatedParentMetadata = {
            ...parentMetadata,
            totalFiles: parentNewTotalFiles,
            totalStorageBytes: parentNewTotalStorageBytes,
            totalFileSize: parentNewTotalFileSize, // Use totalFileSize instead of averageFileSize
            totalSubchats: Math.max(0, parentMetadata.totalSubchats - 1), // Decrease subchat count
            activeUsers: Math.max(0, parentMetadata.activeUsers - 1), // Decrease active users when subchat deleted
            lastActivityAt: Date.now(),
            lastMetadataUpdate: Date.now(),
          };

          await ctx.db.patch(parentChat._id, {
            metadata: updatedParentMetadata,
          });

          console.log(
            `📊 Updated parent chat ${existingChat.parentAppId} after subchat deletion: -${currentMetadata.totalStorageBytes} bytes, subchats: ${updatedParentMetadata.totalSubchats}`,
          );
        }
      } else {
        console.warn(
          `Parent chat not found for subchat deletion: ${existingChat.chatId}`,
        );
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
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // If organizationId is provided, verify it exists and user owns it
    if (args.organizationId) {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found.");
    }
    if (organization.userId !== userId) {
      throw new Error("Unauthorized to view folders in this organization.");
    }

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId),
      )
        .order("desc")
        .collect();

      return folders;
    }

    // If no organizationId provided, return all user's folders (for backward compatibility)
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
    organizationId: v.id("organizations"),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Verify organization exists and user owns it
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found.");
    }
    if (organization.userId !== userId) {
      throw new Error("Unauthorized to create folders in this organization.");
    }

    const folder = await ctx.db.insert("folders", {
      name: args.name,
      userId: userId,
      organizationId: args.organizationId,
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
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // If organizationId is provided, verify it exists and user owns it
    if (args.organizationId) {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found.");
    }
    if (organization.userId !== userId) {
      throw new Error("Unauthorized to view chats in this organization.");
    }

    const favoriteChats = await ctx.db
      .query("chats")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId),
      )
        .filter((q) =>
          q.and(
            q.eq(q.field("isArchived"), false),
            q.eq(q.field("isFavorited"), true),
          ),
        )
        .order("desc")
        .collect();

      return favoriteChats;
    }

    // If no organizationId provided, return all user's favorite chats (for backward compatibility)
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

// Update unhinged mode for a chat (uses Grok's unhinged AI)
export const updateUnhingedMode = mutation({
  args: {
    chatId: v.id("chats"),
    unhingedMode: v.boolean(),
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
      unhingedMode: args.unhingedMode,
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
      unhingedMode: chat.unhingedMode,
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
      unhingedMode: chat.unhingedMode,
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

// Get published settings for API consumption (by internal Convex ID)
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

// Get published settings by chatId field (for API - uses string chatId, not internal _id)
export const getPublishedSettingsByChatId = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (!chat) {
      return null;
    }

    // ONLY return published settings - no fallback to current settings
    return chat.publishedSettings || null;
  },
});

// Get full chat details by chatId field (for API - uses string chatId, not internal _id)
export const getChatByChatIdField = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    return chat || null;
  },
});

// Get user's chat limits and current usage
// Get parent chat storage and subchat statistics
export const getParentChatStats = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const chat = await ctx.db.get(args.chatId);

    if (!chat) {
      throw new Error("Chat not found.");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized to view this chat's statistics.");
    }

    // Get all subchats for this parent
    const subchats = await ctx.db
      .query("chats")
      .filter((q) =>
        q.and(
          q.eq(q.field("chatType"), "app_subchat"),
          q.or(
            q.eq(q.field("parentChatId"), chat.chatId), // Use parentChatId (string chatId)
            q.eq(q.field("parentAppId"), chat.chatId), // Fallback to parentAppId for legacy subchats
          ),
          q.eq(q.field("isArchived"), false),
        ),
      )
      .collect();

    // Calculate aggregated storage from parent's own files + all subchat files
    const parentMetadata = chat.metadata || {
      totalFiles: 0,
      totalStorageBytes: 0,
      totalFileSize: 0,
    };

    // Aggregate storage from all subchats
    let totalSubchatFiles = 0;
    let totalSubchatStorage = 0;
    let totalSubchatFileSize = 0;

    for (const subchat of subchats) {
      const subchatMeta = subchat.metadata || {
        totalFiles: 0,
        totalStorageBytes: 0,
        totalFileSize: 0,
      };
      totalSubchatFiles += subchatMeta.totalFiles || 0;
      totalSubchatStorage += subchatMeta.totalStorageBytes || 0;
      totalSubchatFileSize += subchatMeta.totalFileSize || 0;
    }

    // Total = parent's own files + all subchat files
    const aggregatedTotalFiles =
      (parentMetadata.totalFiles || 0) + totalSubchatFiles;
    const aggregatedTotalStorage =
      (parentMetadata.totalStorageBytes || 0) + totalSubchatStorage;
    const aggregatedTotalFileSize =
      (parentMetadata.totalFileSize || 0) + totalSubchatFileSize;

    return {
      chatId: chat.chatId,
      title: chat.title,
      totalSubchats: subchats.length,
      totalFiles: aggregatedTotalFiles,
      totalStorageBytes: aggregatedTotalStorage,
      totalStorageMB:
        Math.round((aggregatedTotalStorage / (1024 * 1024)) * 100) / 100,
      totalFileSize: aggregatedTotalFileSize,
      activeUsers: subchats.length, // Active users = number of subchats
      lastActivityAt: (parentMetadata as any).lastActivityAt || Date.now(),
      // Include breakdown for debugging
      breakdown: {
        parentFiles: parentMetadata.totalFiles || 0,
        parentStorage: parentMetadata.totalStorageBytes || 0,
        subchatFiles: totalSubchatFiles,
        subchatStorage: totalSubchatStorage,
      },
      // Get list of subchat IDs for this parent
      subchatIds: subchats.map((sc) => sc.chatId),
    };
  },
});

// Migration function to initialize metadata for existing chats
export const migrateExistingChatsMetadata = mutation({
  args: {
    batchSize: v.optional(v.number()), // Process chats in batches to avoid timeout
    skipChatIds: v.optional(v.array(v.string())), // Skip chats that already have metadata
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const batchSize = args.batchSize || 10; // Process 10 chats at a time

    // Get chats that need metadata initialization
    let chatsToMigrate = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .take(batchSize);

    // Filter out chats that already have complete metadata or are in skip list
    chatsToMigrate = chatsToMigrate.filter((chat) => {
      if (args.skipChatIds?.includes(chat.chatId)) return false;

      // Check if metadata is missing or incomplete
      const metadata = chat.metadata;
      return (
        !metadata ||
        metadata.totalFiles === undefined ||
        metadata.totalStorageBytes === undefined ||
        metadata.totalSubchats === undefined
      );
    });

    console.log(
      `🔄 Migrating ${chatsToMigrate.length} chats for user ${userId}`,
    );

    const results = [];

    for (const chat of chatsToMigrate) {
      try {
        // Calculate current storage from file upload queue
        const completedFiles = await ctx.db
          .query("file_upload_queue")
          .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), userId),
              q.eq(q.field("status"), "completed"),
            ),
          )
          .collect();

        const totalFiles = completedFiles.length;
        const totalStorageBytes = completedFiles.reduce(
          (sum, file) => sum + file.fileSize,
          0,
        );
        const totalFileSize = totalStorageBytes; // totalFileSize is same as totalStorageBytes

        // Count subchats for this chat
        const subchats = await ctx.db
          .query("chats")
          .filter((q) =>
            q.and(
              q.eq(q.field("chatType"), "app_subchat"),
              q.eq(q.field("parentAppId"), chat.chatId),
              q.eq(q.field("isArchived"), false),
            ),
          )
          .collect();

        const totalSubchats = subchats.length;

        // Create complete metadata structure
        const defaultMetadata = {
          totalSubchats,
          activeUsers: 0,
          totalUsers: 0,
          totalFiles,
          totalStorageBytes,
          totalFileSize, // Use totalFileSize instead of averageFileSize
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

        // Update the chat with new metadata
        await ctx.db.patch(chat._id, {
          metadata: defaultMetadata,
        });

        results.push({
          chatId: chat.chatId,
          title: chat.title,
          totalFiles,
          totalStorageBytes,
          totalStorageMB:
            Math.round((totalStorageBytes / (1024 * 1024)) * 100) / 100,
          totalSubchats,
          migrated: true,
        });

        console.log(
          `✅ Migrated chat ${chat.chatId}: ${totalFiles} files, ${Math.round(totalStorageBytes / (1024 * 1024))}MB, ${totalSubchats} subchats`,
        );
      } catch (error) {
        console.error(`❌ Failed to migrate chat ${chat.chatId}:`, error);
        results.push({
          chatId: chat.chatId,
          title: chat.title,
          error: error instanceof Error ? error.message : String(error),
          migrated: false,
        });
      }
    }

    return {
      migratedCount: results.filter((r) => r.migrated).length,
      failedCount: results.filter((r) => !r.migrated).length,
      totalProcessed: results.length,
      results,
      hasMore: chatsToMigrate.length === batchSize, // If we got a full batch, there might be more
    };
  },
});

// Helper function to get migration status for a user
export const getMigrationStatus = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Count total chats
    const totalChats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    // Count chats with complete metadata
    const migratedChats = totalChats.filter((chat) => {
      const metadata = chat.metadata;
      return (
        metadata &&
        metadata.totalFiles !== undefined &&
        metadata.totalStorageBytes !== undefined &&
        metadata.totalSubchats !== undefined
      );
    });

    // Count chats needing migration
    const needsMigration = totalChats.filter((chat) => {
      const metadata = chat.metadata;
      return (
        !metadata ||
        metadata.totalFiles === undefined ||
        metadata.totalStorageBytes === undefined ||
        metadata.totalSubchats === undefined
      );
    });

    return {
      totalChats: totalChats.length,
      migratedChats: migratedChats.length,
      needsMigration: needsMigration.length,
      migrationComplete: needsMigration.length === 0,
      chatsNeedingMigration: needsMigration.map((chat) => ({
        chatId: chat.chatId,
        title: chat.title,
        hasMetadata: !!chat.metadata,
      })),
    };
  },
});

// Quick test function to verify storage tracking is working
export const testStorageTracking = query({
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

    const metadata = chat.metadata || {
      totalStorageBytes: 0,
      totalFiles: 0,
      totalFileSize: 0,
      totalSubchats: 0,
      activeUsers: 0,
    };

    // Also get subchats if this is a parent
    const subchats = await ctx.db
      .query("chats")
      .filter((q) =>
        q.and(
          q.eq(q.field("chatType"), "app_subchat"),
          q.or(
            q.eq(q.field("parentChatId"), chat.chatId), // Use parentChatId (string chatId)
            q.eq(q.field("parentAppId"), chat.chatId), // Fallback to parentAppId for legacy subchats
          ),
        ),
      )
      .collect();

    const subchatStorage = subchats.map((subchat) => ({
      chatId: subchat.chatId,
      totalStorageBytes: subchat.metadata?.totalStorageBytes || 0,
      totalFiles: subchat.metadata?.totalFiles || 0,
      totalFileSize: subchat.metadata?.totalFileSize || 0,
    }));

    return {
      chatId: chat.chatId,
      title: chat.title,
      chatType: chat.chatType,
      parentAppId: chat.parentAppId,
      storage: {
        totalStorageBytes: metadata.totalStorageBytes || 0,
        totalFiles: metadata.totalFiles || 0,
        totalFileSize: metadata.totalFileSize || 0,
        totalSubchats: metadata.totalSubchats || 0,
        activeUsers: metadata.activeUsers || 0,
      },
      subchats: subchatStorage,
      totalSubchatStorage: subchatStorage.reduce(
        (sum, sc) => sum + sc.totalStorageBytes,
        0,
      ),
    };
  },
});

// Fix subchat counting for existing parent chats
export const fixSubchatCounting = mutation({
  args: {
    chatId: v.optional(v.id("chats")), // Optional - if not provided, fix all user's chats
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    let chatsToFix: any[] = [];

    if (args.chatId) {
      // Fix specific chat
      const chat = await ctx.db.get(args.chatId);
      if (chat && chat.userId === userId) {
        chatsToFix = [chat];
      }
    } else {
      // Fix all user's chats
      chatsToFix = await ctx.db
        .query("chats")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("isArchived"), false),
            q.neq(q.field("chatType"), "app_subchat"), // Only fix parent chats
          ),
        )
        .collect();
    }

    const results = [];

    for (const chat of chatsToFix) {
      try {
        // Count actual subchats for this parent chat
        const actualSubchats = await ctx.db
          .query("chats")
          .filter((q) =>
            q.and(
              q.eq(q.field("chatType"), "app_subchat"),
              q.or(
                q.eq(q.field("parentChatId"), chat.chatId), // Use parentChatId (string chatId)
                q.eq(q.field("parentAppId"), chat.chatId), // Fallback to parentAppId for legacy subchats
              ),
              q.eq(q.field("isArchived"), false),
            ),
          )
          .collect();

        const actualSubchatCount = actualSubchats.length;
        const currentMetadata = chat.metadata || {};
        const currentSubchatCount = currentMetadata.totalSubchats || 0;

        if (currentSubchatCount !== actualSubchatCount) {
          // Fix the count
          const updatedMetadata = {
            ...currentMetadata,
            totalSubchats: actualSubchatCount,
            activeUsers: actualSubchatCount, // Set activeUsers = number of subchats
            lastMetadataUpdate: Date.now(),
          };

          await ctx.db.patch(chat._id, {
            metadata: updatedMetadata,
          });

          console.log(
            `🔧 Fixed subchat count for ${chat.chatId}: ${currentSubchatCount} → ${actualSubchatCount}`,
          );

          results.push({
            chatId: chat.chatId,
            title: chat.title,
            oldCount: currentSubchatCount,
            newCount: actualSubchatCount,
            subchatIds: actualSubchats.map((sc) => sc.chatId),
            fixed: true,
          });
        } else {
          results.push({
            chatId: chat.chatId,
            title: chat.title,
            count: currentSubchatCount,
            subchatIds: actualSubchats.map((sc) => sc.chatId),
            fixed: false,
            reason: "Count was already correct",
          });
        }
      } catch (error) {
        console.error(
          `❌ Failed to fix subchat count for ${chat.chatId}:`,
          error,
        );
        results.push({
          chatId: chat.chatId,
          title: chat.title,
          error: error instanceof Error ? error.message : String(error),
          fixed: false,
        });
      }
    }

    return {
      totalProcessed: results.length,
      fixedCount: results.filter((r) => r.fixed).length,
      results,
    };
  },
});

// Migrate existing subchats to add parentChatId field
export const migrateSubchatsParentChatId = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const batchSize = args.batchSize || 20;

    // Find subchats that have parentAppId but no parentChatId
    const subchatsToMigrate = await ctx.db
      .query("chats")
      .filter((q) =>
        q.and(
          q.eq(q.field("chatType"), "app_subchat"),
          q.eq(q.field("parentChatId"), undefined), // No parentChatId yet
          q.neq(q.field("parentAppId"), undefined), // But has parentAppId
        ),
      )
      .take(batchSize);

    console.log(
      `🔄 Migrating ${subchatsToMigrate.length} subchats to add parentChatId`,
    );

    const results = [];

    for (const subchat of subchatsToMigrate) {
      try {
        if (!subchat.parentAppId) continue;

        // Find the parent chat using parentAppId
        const parentChat = await ctx.db
          .query("chats")
          .filter((q) => q.eq(q.field("chatId"), subchat.parentAppId))
          .first();

        if (parentChat) {
          // Add parentChatId to the subchat (using string chatId, not _id)
          await ctx.db.patch(subchat._id, {
            parentChatId: parentChat.chatId, // Store string chatId, not document _id
          });

          console.log(
            `✅ Added parentChatId to subchat ${subchat.chatId} → parent ${parentChat.chatId}`,
          );

          results.push({
            subchatId: subchat.chatId,
            parentAppId: subchat.parentAppId,
            parentChatId: parentChat.chatId,
            parentDocId: parentChat._id,
            migrated: true,
          });
        } else {
          console.warn(
            `⚠️ Parent chat not found for subchat ${subchat.chatId} with parentAppId ${subchat.parentAppId}`,
          );

          results.push({
            subchatId: subchat.chatId,
            parentAppId: subchat.parentAppId,
            error: "Parent chat not found",
            migrated: false,
          });
        }
      } catch (error) {
        console.error(`❌ Failed to migrate subchat ${subchat.chatId}:`, error);
        results.push({
          subchatId: subchat.chatId,
          error: error instanceof Error ? error.message : String(error),
          migrated: false,
        });
      }
    }

    return {
      migratedCount: results.filter((r) => r.migrated).length,
      failedCount: results.filter((r) => !r.migrated).length,
      totalProcessed: results.length,
      results,
      hasMore: subchatsToMigrate.length === batchSize,
    };
  },
});

// Debug function to check subchat parent relationships
export const debugSubchatRelationships = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get all user's subchats
    const subchats = await ctx.db
      .query("chats")
      .filter((q) =>
        q.and(
          q.eq(q.field("chatType"), "app_subchat"),
          q.eq(q.field("userId"), userId),
        ),
      )
      .collect();

    const results = [];

    for (const subchat of subchats) {
      let parentChat = null;
      let app = null;
      let lookupMethod = "none";

      // Try to find parent chat
      if (subchat.parentChatId) {
        parentChat = await ctx.db
          .query("chats")
          .filter((q) => q.eq(q.field("chatId"), subchat.parentChatId))
          .first();
        lookupMethod = "parentChatId";
      } else if (subchat.parentAppId) {
        // Look up app first
        const parentAppId = subchat.parentAppId!;
        app = await ctx.db
          .query("apps")
          .withIndex("by_appId", (q) => q.eq("appId", parentAppId))
          .first();

        if (app && app.parentChatId) {
          parentChat = await ctx.db.get(app.parentChatId);
          lookupMethod = "parentAppId → app.parentChatId";
        } else if (app) {
          lookupMethod = "parentAppId found app, but app has no parentChatId";
        } else {
          lookupMethod = "parentAppId - app not found";
        }
      }

      results.push({
        subchatId: subchat.chatId,
        subchatTitle: subchat.title,
        parentAppId: subchat.parentAppId,
        parentChatId: subchat.parentChatId,
        lookupMethod,
        appFound: !!app,
        appName: app?.name,
        appParentChatId: app?.parentChatId,
        parentChatFound: !!parentChat,
        parentChatId_resolved: parentChat?.chatId,
        parentChatTitle: parentChat?.title,
        subchatMetadata: {
          totalFiles: subchat.metadata?.totalFiles || 0,
          totalStorageBytes: subchat.metadata?.totalStorageBytes || 0,
        },
        parentMetadata: {
          totalFiles: parentChat?.metadata?.totalFiles || 0,
          totalStorageBytes: parentChat?.metadata?.totalStorageBytes || 0,
          totalSubchats: parentChat?.metadata?.totalSubchats || 0,
        },
      });
    }

    return {
      totalSubchats: subchats.length,
      results,
    };
  },
});

// Simple function to check a specific chat's details
export const inspectChat = query({
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

    // If it's a subchat, try to find its parent
    let parentChat = null;
    let parentLookupMethod = "none";

    if (chat.chatType === "app_subchat") {
      if (chat.parentChatId) {
        parentChat = await ctx.db
          .query("chats")
          .filter((q) => q.eq(q.field("chatId"), chat.parentChatId))
          .first();
        parentLookupMethod = "parentChatId (string)";
      } else if (chat.parentAppId) {
        const app = await ctx.db
          .query("apps")
          .withIndex("by_appId", (q) => q.eq("appId", chat.parentAppId!))
          .first();

        if (app && app.parentChatId) {
          parentChat = await ctx.db.get(app.parentChatId);
          parentLookupMethod = "parentAppId → app.parentChatId";
        }
      }
    }

    return {
      chat: {
        _id: chat._id,
        chatId: chat.chatId,
        title: chat.title,
        chatType: chat.chatType,
        parentAppId: chat.parentAppId,
        parentChatId: chat.parentChatId,
        userId: chat.userId,
        metadata: chat.metadata,
      },
      parentInfo: {
        found: !!parentChat,
        lookupMethod: parentLookupMethod,
        parentChat: parentChat
          ? {
              _id: parentChat._id,
              chatId: parentChat.chatId,
              title: parentChat.title,
              metadata: parentChat.metadata,
            }
          : null,
      },
    };
  },
});

export const getUserChatLimits = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
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

    let currentChats = [];

    // If organizationId is provided, verify it exists and user owns it
    if (args.organizationId) {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found.");
    }
    if (organization.userId !== userId) {
      throw new Error("Unauthorized to view chats in this organization.");
    }

    // Get current chat count for this organization (non-archived chats only)
      currentChats = await ctx.db
      .query("chats")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId),
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();
    } else {
      // If no organizationId provided, get all user's chats (for backward compatibility)
      currentChats = await ctx.db
        .query("chats")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("isArchived"), false))
        .collect();
    }

    // Determine tier name for display purposes
    let tierName = "free";
    if (subscription && subscription.status === "active") {
      tierName = subscription.tier;
    }

    // Chat limits are now unlimited for all tiers
    return {
      currentChatCount: currentChats.length,
      chatLimit: -1, // Unlimited for all tiers
      tierName: tierName,
      canCreateMore: true, // Always allow creating more chats
      remainingChats: -1, // Unlimited
    };
  },
});

// ==============================================================================
// Custom Scopes Management
// ==============================================================================

export const updateScopeConfig = mutation({
  args: {
    chatId: v.id("chats"),
    scopeConfig: v.object({
      scopes: v.array(
        v.object({
          name: v.string(),
          type: v.string(),
          required: v.boolean(),
          description: v.optional(v.string()),
        }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get the chat and verify ownership
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized to update this chat");
    }

    // Update the scope configuration
    await ctx.db.patch(args.chatId, {
      scopeConfig: args.scopeConfig,
    });

    return {
      success: true,
      message: "Scope configuration saved successfully",
    };
  },
});

export const getScopeConfig = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get the chat and verify ownership
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized to view this chat");
    }

    return chat.scopeConfig || { scopes: [] };
  },
});

export const clearScopeConfig = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get the chat and verify ownership
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized to update this chat");
    }

    // Clear the scope configuration
    await ctx.db.patch(args.chatId, {
      scopeConfig: undefined,
    });

    return {
      success: true,
      message: "Scope configuration cleared",
    };
  },
});

// Migration helper: Assign existing chats without organizationId to an organization
export const migrateChatsToOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Verify organization exists and user owns it
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found.");
    }
    if (organization.userId !== userId) {
      throw new Error("Unauthorized to migrate chats to this organization.");
    }

    // Find all chats without organizationId for this user
    const chatsToMigrate = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("organizationId"), undefined))
      .collect();

    // Update each chat with the organizationId
    let migratedCount = 0;
    for (const chat of chatsToMigrate) {
      await ctx.db.patch(chat._id, {
        organizationId: args.organizationId,
      });
      migratedCount++;
    }

    return {
      success: true,
      migratedCount,
      message: `Migrated ${migratedCount} chat(s) to organization "${organization.name}"`,
    };
  },
});
