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
    // identity: v.optional(v.object())
  })
    .index("by_user", ["userId"])
    .index("by_title", ["title"])
    .index("by_fileId", ["context"]),
});
