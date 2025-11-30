import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

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

    // Check file size limits using the new chat-metadata-based system
    const totalUploadSize = args.files.reduce(
      (sum, file) => sum + file.fileSize,
      0,
    );

    // For each file, check if it would exceed limits
    for (const file of args.files) {
      // Use the updated checkUploadLimits function that reads from chat metadata
      const limitCheck = await ctx.runQuery(api.fileStorage.checkUploadLimits, {
        fileSize: file.fileSize,
        fileName: file.fileName,
        chatId: args.chatId,
      });

      if (!limitCheck.canUpload) {
        // Throw the first error we encounter
        const firstError =
          limitCheck.errors.fileSizeError ||
          limitCheck.errors.tokenIngestionError ||
          limitCheck.errors.fileCountError ||
          "Upload not allowed";
        throw new Error(firstError);
      }
    }

    // Also check if the total batch would exceed limits
    if (args.files.length > 1) {
      const batchLimitCheck = await ctx.runQuery(
        api.fileStorage.checkUploadLimits,
        {
          fileSize: totalUploadSize,
          fileName: `Batch of ${args.files.length} files`,
          chatId: args.chatId,
        },
      );

      if (!batchLimitCheck.canUpload) {
        const firstError =
          batchLimitCheck.errors.fileSizeError ||
          batchLimitCheck.errors.tokenIngestionError ||
          batchLimitCheck.errors.fileCountError ||
          "Batch upload would exceed limits";
        throw new Error(firstError);
      }
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
        // Get the chat to find its string chatId and check if it's a subchat
        const chat = await ctx.db.get(file.chatId);
        if (!chat) {
          console.error(`Chat not found for file upload: ${file.chatId}`);
          return file;
        }

        const chatStringId = chat.chatId; // Use the string chatId field

        // Only update storage metadata for non-subchat uploads
        // Subchats will have their storage tracked by the backend analytics system
        if (chat.chatType !== "app_subchat") {
          console.log(
            `📊 Regular chat detected - updating frontend storage tracking`,
          );

          // Update regular chat's storage metadata
          const currentMetadata = chat.metadata || {
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
          const updatedMetadata = {
            ...currentMetadata,
            totalFiles: currentMetadata.totalFiles + 1,
            totalStorageBytes:
              currentMetadata.totalStorageBytes + file.fileSize,
            totalFileSize: (currentMetadata.totalFileSize || 0) + file.fileSize, // Track total file size
            lastActivityAt: Date.now(),
            lastMetadataUpdate: Date.now(),
          };

          await ctx.db.patch(chat._id, {
            metadata: updatedMetadata,
          });

          console.log(
            `📊 Updated regular chat ${chatStringId} storage: +${file.fileSize} bytes (total: ${updatedMetadata.totalStorageBytes})`,
          );
        } else {
          console.log(
            `🎯 SUBCHAT DETECTED - Storage tracking handled by backend analytics system for ${chatStringId}`,
          );
        }

        // DEBUG: Log chat details for debugging
        console.log(`🔍 Chat details for file upload:`, {
          chatId: chatStringId,
          chatType: chat.chatType,
          parentChatId: chat.parentChatId,
          parentAppId: chat.parentAppId,
          isSubchat: chat.chatType === "app_subchat",
        });
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

    if (args.chatId !== undefined) {
      const chatId = args.chatId;
      query = ctx.db
        .query("upload_queues")
        .withIndex("by_chat", (q) => q.eq("chatId", chatId))
        .filter((q) => q.eq(q.field("userId"), userId));
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

// Mark a queue as deleted (soft delete)
export const markQueueAsDeleted = mutation({
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

    // Mark queue as deleted
    await ctx.db.patch(queue._id, {
      status: "deleted",
      completedAt: Date.now(),
    });

    // Mark all files in the queue as deleted
    const files = await ctx.db
      .query("file_upload_queue")
      .withIndex("by_queue", (q) => q.eq("queueId", args.queueId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    for (const file of files) {
      await ctx.db.patch(file._id, {
        status: "deleted",
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
