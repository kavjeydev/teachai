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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Get user's subscription to determine tier
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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

    // Get current storage usage
    const storage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const currentStorageBytes = storage?.totalFileSizeBytes || 0;
    const currentFileCount = storage?.fileCount || 0;

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

// Get storage usage statistics for a user
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

    // Get storage usage
    const storage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

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

    const currentStorageBytes = storage?.totalFileSizeBytes || 0;
    const currentStorageMB =
      Math.round((currentStorageBytes / (1024 * 1024)) * 100) / 100;
    const usagePercentage = Math.round((currentStorageMB / maxStorageMB) * 100);

    return {
      currentStorageMB,
      maxStorageMB,
      currentStorageBytes,
      fileCount: storage?.fileCount || 0,
      usagePercentage,
      tierName,
      chatFileSizes: storage?.chatFileSizes || {},
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
