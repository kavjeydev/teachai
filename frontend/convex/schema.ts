import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { UserIdentity } from "convex/server";

export default defineSchema({
  chats: defineTable({
    chatId: v.string(),
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    folderId: v.optional(v.string()),
    content: v.optional(
      v.array(
        v.object({
          user: v.string(),
          sender: v.string(),
          text: v.string(),
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
      ),
    ),
    context: v.optional(
      v.array(
        v.object({
          filename: v.string(),
          fileId: v.string(),
        }),
      ),
    ),
    apiInfo: v.object({
      visibility: v.string(),
    }),
    apiKey: v.string(),
    apiKeyDisabled: v.boolean(),
    visibility: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_title", ["title"])
    .index("by_fileId", ["context"])
    .index("by_folder", ["folderId"]),

  folders: defineTable({
    name: v.string(),
    userId: v.string(),
    color: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
