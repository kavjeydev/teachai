import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get user's current file storage usage
export const getUserFileStorage = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const storage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!storage) {
      // Return default values if no storage record exists
      return {
        totalFileSizeBytes: 0,
        fileCount: 0,
        lastUpdated: Date.now(),
        chatFileSizes: {},
      };
    }

    return storage;
  },
});

// Add file size to user's storage tracking
export const addFileSize = mutation({
  args: {
    chatId: v.string(), // Chat ID as string
    fileSize: v.number(),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get current storage or create new one
    let storage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!storage) {
      // Create new storage record
      const storageId = await ctx.db.insert("user_file_storage", {
        userId,
        totalFileSizeBytes: args.fileSize,
        fileCount: 1,
        lastUpdated: Date.now(),
        chatFileSizes: { [args.chatId]: args.fileSize },
      });

      return {
        totalFileSizeBytes: args.fileSize,
        fileCount: 1,
        newRecord: true,
      };
    }

    // Update existing storage record
    const chatFileSizes = storage.chatFileSizes || {};
    const currentChatSize = chatFileSizes[args.chatId] || 0;
    const newChatSize = currentChatSize + args.fileSize;
    const newChatFileSizes = {
      ...chatFileSizes,
      [args.chatId]: newChatSize,
    };

    await ctx.db.patch(storage._id, {
      totalFileSizeBytes: storage.totalFileSizeBytes + args.fileSize,
      fileCount: storage.fileCount + 1,
      lastUpdated: Date.now(),
      chatFileSizes: newChatFileSizes,
    });

    return {
      totalFileSizeBytes: storage.totalFileSizeBytes + args.fileSize,
      fileCount: storage.fileCount + 1,
      newRecord: false,
    };
  },
});

// Remove file size from user's storage tracking
export const removeFileSize = mutation({
  args: {
    chatId: v.string(), // Chat ID as string
    fileSize: v.number(),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const storage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!storage) {
      // No storage record found, nothing to remove
      return {
        totalFileSizeBytes: 0,
        fileCount: 0,
        error: "No storage record found",
      };
    }

    // Calculate new values
    const newTotalSize = Math.max(
      0,
      storage.totalFileSizeBytes - args.fileSize,
    );
    const newFileCount = Math.max(0, storage.fileCount - 1);

    // Update chat-specific size tracking
    const chatFileSizes = storage.chatFileSizes || {};
    const currentChatSize = chatFileSizes[args.chatId] || 0;
    const newChatSize = Math.max(0, currentChatSize - args.fileSize);
    const newChatFileSizes = {
      ...chatFileSizes,
      [args.chatId]: newChatSize,
    };

    // Remove chat entry if size is 0
    if (newChatSize === 0) {
      delete newChatFileSizes[args.chatId];
    }

    await ctx.db.patch(storage._id, {
      totalFileSizeBytes: newTotalSize,
      fileCount: newFileCount,
      lastUpdated: Date.now(),
      chatFileSizes: newChatFileSizes,
    });

    return {
      totalFileSizeBytes: newTotalSize,
      fileCount: newFileCount,
      removed: true,
    };
  },
});

// Check if user can upload a file based on their tier limits
export const checkUploadLimits = query({
  args: {
    fileSize: v.number(),
    fileName: v.string(),
    chatId: v.id("chats"), // Add chatId to determine which chat's storage to check
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get the chat to determine storage tracking
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found.");
    }

    // Determine which chat's storage to check for limits
    let targetChat = chat;
    let targetUserId = userId;
    let parentChat = null;

    // If this is a subchat, we need to check against the parent chat's aggregated limits
    if (chat.chatType === "app_subchat") {
      // Try parentChatId first (more efficient), then fallback to parentAppId
      if (chat.parentChatId) {
        parentChat = await ctx.db
          .query("chats")
          .filter((q) => q.eq(q.field("chatId"), chat.parentChatId))
          .first();
      } else if (chat.parentAppId) {
        parentChat = await ctx.db
          .query("chats")
          .filter((q) => q.eq(q.field("chatId"), chat.parentAppId))
          .first();
      }

      if (parentChat) {
        targetChat = parentChat;
        targetUserId = parentChat.userId; // Use parent chat owner's limits
      }
    }

    // Get user's subscription to determine tier
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .first();

    // Determine tier limits
    let maxStorageMB = 250; // Free tier default
    let maxFileSizeMB = 25;
    let maxFiles = 50;
    let tierName = "free";

    if (subscription && subscription.status === "active") {
      tierName = subscription.tier;
      switch (subscription.tier) {
        case "pro":
          maxStorageMB = 2048; // 2GB
          maxFileSizeMB = 50;
          maxFiles = 200;
          break;
        case "scale":
          maxStorageMB = 10240; // 10GB
          maxFileSizeMB = 100;
          maxFiles = 1000;
          break;
        case "enterprise":
          maxStorageMB = 51200; // 50GB
          maxFileSizeMB = 500;
          maxFiles = 5000;
          break;
      }
    }

    const maxStorageBytes = maxStorageMB * 1024 * 1024;
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    // Get current storage usage - for parent chats, this includes all subchat storage
    // For subchats, we check against parent's aggregated storage but only count the subchat's own files
    let currentStorageBytes = 0;
    let currentFileCount = 0;

    if (chat.chatType === "app_subchat" && parentChat) {
      // For subchats: check against parent's total storage (includes all subchats)
      const parentMetadata = parentChat.metadata || {
        totalFiles: 0,
        totalStorageBytes: 0,
      };
      currentStorageBytes = parentMetadata.totalStorageBytes || 0;
      currentFileCount = parentMetadata.totalFiles || 0;
    } else {
      // For parent chats: use their own metadata (which should include subchat totals)
      const targetMetadata = targetChat.metadata || {
        totalFiles: 0,
        totalStorageBytes: 0,
      };
      currentStorageBytes = targetMetadata.totalStorageBytes || 0;
      currentFileCount = targetMetadata.totalFiles || 0;
    }

    // Check limits
    const checks = {
      fileSizeOk: args.fileSize <= maxFileSizeBytes,
      storageOk: currentStorageBytes + args.fileSize <= maxStorageBytes,
      fileCountOk: currentFileCount + 1 <= maxFiles,
    };

    const canUpload =
      checks.fileSizeOk && checks.storageOk && checks.fileCountOk;

    return {
      canUpload,
      checks,
      limits: {
        maxStorageMB,
        maxFileSizeMB,
        maxFiles,
        tierName,
      },
      current: {
        storageBytes: currentStorageBytes,
        storageMB:
          Math.round((currentStorageBytes / (1024 * 1024)) * 100) / 100,
        fileCount: currentFileCount,
      },
      errors: {
        fileSizeError: !checks.fileSizeOk
          ? `File size (${Math.round((args.fileSize / (1024 * 1024)) * 100) / 100}MB) exceeds limit of ${maxFileSizeMB}MB for ${tierName} tier`
          : null,
        storageError: !checks.storageOk
          ? `Upload would exceed storage limit of ${maxStorageMB}MB for ${tierName} tier`
          : null,
        fileCountError: !checks.fileCountOk
          ? `Upload would exceed file limit of ${maxFiles} files for ${tierName} tier`
          : null,
      },
    };
  },
});

// Get storage usage statistics for a user (aggregated from all their parent chats)
export const getStorageStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get user's subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get all user's chats (only parent chats, not subchats)
    const userChats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isArchived"), false),
          q.neq(q.field("chatType"), "app_subchat"), // Exclude subchats
        ),
      )
      .collect();

    // Aggregate storage from all parent chats
    let totalStorageBytes = 0;
    let totalFileCount = 0;
    const chatFileSizes: Record<string, number> = {};

    for (const chat of userChats) {
      const metadata = chat.metadata || { totalStorageBytes: 0, totalFiles: 0 };
      totalStorageBytes += metadata.totalStorageBytes || 0;
      totalFileCount += metadata.totalFiles || 0;

      if (metadata.totalStorageBytes > 0) {
        chatFileSizes[chat.chatId] = metadata.totalStorageBytes;
      }
    }

    // Determine tier limits
    let maxStorageMB = 250;
    let tierName = "free";

    if (subscription && subscription.status === "active") {
      tierName = subscription.tier;
      switch (subscription.tier) {
        case "pro":
          maxStorageMB = 2048;
          break;
        case "scale":
          maxStorageMB = 10240;
          break;
        case "enterprise":
          maxStorageMB = 51200;
          break;
      }
    }

    const currentStorageMB =
      Math.round((totalStorageBytes / (1024 * 1024)) * 100) / 100;
    const usagePercentage = Math.round((currentStorageMB / maxStorageMB) * 100);

    return {
      currentStorageMB,
      maxStorageMB,
      currentStorageBytes: totalStorageBytes,
      fileCount: totalFileCount,
      usagePercentage,
      tierName,
      chatFileSizes, // Now aggregated from chat metadata
      totalChats: userChats.length,
    };
  },
});

// Clean up storage tracking for a deleted chat
export const cleanupChatStorage = mutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const storage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!storage || !storage.chatFileSizes) {
      return {
        cleaned: false,
        reason: "No storage record or chat sizes found",
      };
    }

    const chatSize = (storage.chatFileSizes as any)[args.chatId] || 0;

    if (chatSize === 0) {
      return { cleaned: false, reason: "No storage used by this chat" };
    }

    // Remove chat from tracking and update totals
    const newChatFileSizes = { ...(storage.chatFileSizes || {}) };
    delete newChatFileSizes[args.chatId];

    // Get file count for this chat (we'll need to estimate this)
    // For now, we'll assume 1 file per chat cleanup - this could be improved
    // by tracking file counts per chat in the future
    const estimatedFileCount = 1;

    await ctx.db.patch(storage._id, {
      totalFileSizeBytes: Math.max(0, storage.totalFileSizeBytes - chatSize),
      fileCount: Math.max(0, storage.fileCount - estimatedFileCount),
      lastUpdated: Date.now(),
      chatFileSizes: newChatFileSizes,
    });

    return {
      cleaned: true,
      removedBytes: chatSize,
      removedFiles: estimatedFileCount,
    };
  },
});
