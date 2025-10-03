import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new upload queue
export const createUploadQueue = mutation({
  args: {
    chatId: v.id("chats"),
    name: v.string(),
    totalFiles: v.number(),
    isFolder: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Verify chat belongs to user
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queueDoc = await ctx.db.insert("upload_queues", {
      queueId,
      userId,
      chatId: args.chatId,
      name: args.name,
      totalFiles: args.totalFiles,
      completedFiles: 0,
      failedFiles: 0,
      status: "processing",
      isFolder: args.isFolder,
      createdAt: Date.now(),
    });

    return { queueId, queueDoc };
  },
});

// Add files to the queue
export const addFilesToQueue = mutation({
  args: {
    queueId: v.string(),
    chatId: v.id("chats"),
    files: v.array(
      v.object({
        fileName: v.string(),
        fileSize: v.number(),
        fileType: v.string(),
        filePath: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Verify queue exists and belongs to user
    const queue = await ctx.db
      .query("upload_queues")
      .withIndex("by_queue_id", (q) => q.eq("queueId", args.queueId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!queue) {
      throw new Error("Queue not found or unauthorized");
    }

    // Check file size limits for each file before adding to queue
    // Get user's subscription to determine tier
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get current storage usage
    const storage = await ctx.db
      .query("user_file_storage")
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
    const currentStorageBytes = storage?.totalFileSizeBytes || 0;
    const currentFileCount = storage?.fileCount || 0;

    // Check limits for all files in batch
    const totalUploadSize = args.files.reduce(
      (sum, file) => sum + file.fileSize,
      0,
    );

    for (const file of args.files) {
      // Check individual file size
      if (file.fileSize > maxFileSizeBytes) {
        throw new Error(
          `File "${file.fileName}" (${Math.round((file.fileSize / (1024 * 1024)) * 100) / 100}MB) exceeds the ${maxFileSizeMB}MB limit for ${tierName} tier`,
        );
      }
    }

    // Check total storage limit
    if (currentStorageBytes + totalUploadSize > maxStorageBytes) {
      throw new Error(
        `Upload would exceed storage limit of ${maxStorageMB}MB for ${tierName} tier`,
      );
    }

    // Check file count limit
    if (currentFileCount + args.files.length > maxFiles) {
      throw new Error(
        `Upload would exceed file limit of ${maxFiles} files for ${tierName} tier`,
      );
    }

    // Add files to queue
    const fileIds = [];
    for (const file of args.files) {
      const fileId = await ctx.db.insert("file_upload_queue", {
        userId,
        chatId: args.chatId,
        queueId: args.queueId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        filePath: file.filePath,
        status: "processing",
        progress: 0,
        createdAt: Date.now(),
      });
      fileIds.push(fileId);
    }

    return fileIds;
  },
});

// Update file progress
export const updateFileProgress = mutation({
  args: {
    fileId: v.id("file_upload_queue"),
    status: v.string(),
    progress: v.number(),
    error: v.optional(v.string()),
    extractedTextLength: v.optional(v.number()),
    nodesCreated: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Verify file belongs to user
    const file = await ctx.db.get(args.fileId);
    if (!file || file.userId !== userId) {
      throw new Error("File not found or unauthorized");
    }

    const updateData: any = {
      status: args.status,
      progress: args.progress,
    };

    if (args.error) updateData.error = args.error;
    if (args.extractedTextLength)
      updateData.extractedTextLength = args.extractedTextLength;
    if (args.nodesCreated) updateData.nodesCreated = args.nodesCreated;

    if (args.status === "processing" && !file.startedAt) {
      updateData.startedAt = Date.now();
    }

    if (
      args.status === "completed" ||
      args.status === "failed" ||
      args.status === "cancelled"
    ) {
      updateData.completedAt = Date.now();

      // If file was successfully completed, track its size
      if (args.status === "completed") {
        // Get or create user storage record
        let storage = await ctx.db
          .query("user_file_storage")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        if (!storage) {
          // Create new storage record
          await ctx.db.insert("user_file_storage", {
            userId,
            totalFileSizeBytes: file.fileSize,
            fileCount: 1,
            lastUpdated: Date.now(),
            chatFileSizes: { [file.chatId]: file.fileSize },
          });
        } else {
          // Update existing storage record
          const currentChatSize =
            (storage.chatFileSizes as any)?.[file.chatId] || 0;
          const newChatSize = currentChatSize + file.fileSize;
          const newChatFileSizes = {
            ...(storage.chatFileSizes || {}),
            [file.chatId]: newChatSize,
          };

          await ctx.db.patch(storage._id, {
            totalFileSizeBytes: storage.totalFileSizeBytes + file.fileSize,
            fileCount: storage.fileCount + 1,
            lastUpdated: Date.now(),
            chatFileSizes: newChatFileSizes,
          });
        }
      }

      // Update queue counters
      const queue = await ctx.db
        .query("upload_queues")
        .withIndex("by_queue_id", (q) => q.eq("queueId", file.queueId))
        .first();

      if (queue) {
        const newCompletedFiles =
          args.status === "completed"
            ? queue.completedFiles + 1
            : queue.completedFiles;
        const newFailedFiles =
          args.status === "failed" || args.status === "cancelled"
            ? queue.failedFiles + 1
            : queue.failedFiles;

        await ctx.db.patch(queue._id, {
          completedFiles: newCompletedFiles,
          failedFiles: newFailedFiles,
        });

        // Check if queue is complete
        if (newCompletedFiles + newFailedFiles >= queue.totalFiles) {
          await ctx.db.patch(queue._id, {
            status: newFailedFiles > 0 ? "failed" : "completed",
            completedAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.patch(args.fileId, updateData);
    return args.fileId;
  },
});

// Get queue status
export const getQueueStatus = query({
  args: {
    queueId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const queue = await ctx.db
      .query("upload_queues")
      .withIndex("by_queue_id", (q) => q.eq("queueId", args.queueId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!queue) {
      return null;
    }

    const files = await ctx.db
      .query("file_upload_queue")
      .withIndex("by_queue", (q) => q.eq("queueId", args.queueId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    return {
      queue,
      files,
    };
  },
});

// Get all queues for a user with their files
export const getUserQueues = query({
  args: {
    chatId: v.optional(v.id("chats")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    let query = ctx.db
      .query("upload_queues")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.chatId) {
      query = ctx.db
        .query("upload_queues")
        .withIndex("by_chat", (q) => q.eq("chatId", args.chatId));
    }

    const queues = await query.order("desc").take(50);

    // Get files for each queue
    const queuesWithFiles = await Promise.all(
      queues.map(async (queue) => {
        const files = await ctx.db
          .query("file_upload_queue")
          .withIndex("by_queue", (q) => q.eq("queueId", queue.queueId))
          .filter((q) => q.eq(q.field("userId"), userId))
          .collect();

        return {
          ...queue,
          files: files.map((file) => ({
            id: file._id,
            fileName: file.fileName,
            fileSize: file.fileSize,
            fileType: file.fileType,
            filePath: file.filePath,
            status: file.status,
            progress: file.progress || 0,
            error: file.error,
            fileId: file.fileId,
            convexFileId: file._id, // Add the Convex file ID
          })),
        };
      }),
    );

    return queuesWithFiles;
  },
});

// Cancel a queue
export const cancelQueue = mutation({
  args: {
    queueId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const queue = await ctx.db
      .query("upload_queues")
      .withIndex("by_queue_id", (q) => q.eq("queueId", args.queueId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!queue) {
      throw new Error("Queue not found or unauthorized");
    }

    // Update queue status
    await ctx.db.patch(queue._id, {
      status: "cancelled",
      completedAt: Date.now(),
    });

    // Cancel all pending files
    const processingFiles = await ctx.db
      .query("file_upload_queue")
      .withIndex("by_queue", (q) => q.eq("queueId", args.queueId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("status"), "processing"),
        ),
      )
      .collect();

    for (const file of processingFiles) {
      await ctx.db.patch(file._id, {
        status: "cancelled",
        completedAt: Date.now(),
      });
    }

    return queue._id;
  },
});

// Clean up old completed queues (can be called periodically)
export const cleanupOldQueues = mutation({
  args: {
    olderThanDays: v.optional(v.number()), // Default 30 days
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const cutoffTime =
      Date.now() - (args.olderThanDays || 30) * 24 * 60 * 60 * 1000;

    const oldQueues = await ctx.db
      .query("upload_queues")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("status"), "completed"),
            q.eq(q.field("status"), "failed"),
          ),
          q.lt(q.field("createdAt"), cutoffTime),
        ),
      )
      .collect();

    for (const queue of oldQueues) {
      // Delete associated files
      const files = await ctx.db
        .query("file_upload_queue")
        .withIndex("by_queue", (q) => q.eq("queueId", queue.queueId))
        .collect();

      for (const file of files) {
        await ctx.db.delete(file._id);
      }

      // Delete queue
      await ctx.db.delete(queue._id);
    }

    return oldQueues.length;
  },
});
