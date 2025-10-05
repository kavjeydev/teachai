import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all custom relationship types for a specific user
export const getUserCustomRelationshipTypes = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const customTypes = await ctx.db
      .query("customRelationships")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Return just the relationship type names, sorted alphabetically
    return customTypes.map((type) => type.relationshipType).sort();
  },
});

// Add a new custom relationship type for a user
export const addCustomRelationshipType = mutation({
  args: {
    userId: v.string(),
    relationshipType: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if this relationship type already exists for this user
    const existing = await ctx.db
      .query("customRelationships")
      .withIndex("by_user_type", (q) =>
        q
          .eq("userId", args.userId)
          .eq("relationshipType", args.relationshipType),
      )
      .first();

    if (existing) {
      // Update the lastUsed timestamp if it already exists
      await ctx.db.patch(existing._id, {
        lastUsed: Date.now(),
      });
      return { success: true, existed: true };
    }

    // Create new custom relationship type
    await ctx.db.insert("customRelationships", {
      userId: args.userId,
      relationshipType: args.relationshipType,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    });

    return { success: true, existed: false };
  },
});

// Update the lastUsed timestamp for a custom relationship type
export const updateCustomRelationshipUsage = mutation({
  args: {
    userId: v.string(),
    relationshipType: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customRelationships")
      .withIndex("by_user_type", (q) =>
        q
          .eq("userId", args.userId)
          .eq("relationshipType", args.relationshipType),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastUsed: Date.now(),
      });
    }

    return { success: true };
  },
});

// Remove a custom relationship type for a user
export const removeCustomRelationshipType = mutation({
  args: {
    userId: v.string(),
    relationshipType: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customRelationships")
      .withIndex("by_user_type", (q) =>
        q
          .eq("userId", args.userId)
          .eq("relationshipType", args.relationshipType),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true, deleted: true };
    }

    return { success: true, deleted: false };
  },
});

// Migrate existing localStorage custom relationship types to Convex
export const migrateCustomRelationshipTypes = mutation({
  args: {
    userId: v.string(),
    relationshipTypes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const migratedCount = 0;

    for (const relationshipType of args.relationshipTypes) {
      // Check if this relationship type already exists for this user
      const existing = await ctx.db
        .query("customRelationships")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", args.userId).eq("relationshipType", relationshipType),
        )
        .first();

      if (!existing) {
        await ctx.db.insert("customRelationships", {
          userId: args.userId,
          relationshipType: relationshipType,
          createdAt: Date.now(),
          lastUsed: Date.now(),
        });
      }
    }

    return {
      success: true,
      migratedCount: args.relationshipTypes.length,
    };
  },
});
