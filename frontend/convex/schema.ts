import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { UserIdentity } from "convex/server";

export default defineSchema({
  chats: defineTable({
    chatId: v.string(),
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    content: v.optional(
      v.array(
        v.object({
          user: v.string(),
          sender: v.string(),
          text: v.string(),
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
    .index("by_fileId", ["context"]),
});
