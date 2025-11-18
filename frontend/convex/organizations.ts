import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Organization Management
 * 
 * After signup, users must create an organization. All chats belong to an organization.
 * Users can create multiple organizations and switch between them.
 */

export const createOrganization = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Generate unique organization ID
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 8);
    const uniqueOrgId = `org_${timestamp}_${randomPart}`;

    const now = Date.now();

    const organization = await ctx.db.insert("organizations", {
      organizationId: uniqueOrgId,
      name: args.name,
      userId: userId,
      createdAt: now,
      updatedAt: now,
    });

    return organization;
  },
});

export const getOrganizations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const organizations = await ctx.db
      .query("organizations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return organizations;
  },
});

export const getOrganizationById = query({
  args: {
    id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const organization = await ctx.db.get(args.id);

    if (!organization) {
      throw new Error("Organization not found.");
    }

    if (organization.userId !== userId) {
      throw new Error("Unauthorized to view this organization.");
    }

    return organization;
  },
});

export const updateOrganization = mutation({
  args: {
    id: v.id("organizations"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const organization = await ctx.db.get(args.id);

    if (!organization) {
      throw new Error("Organization not found.");
    }

    if (organization.userId !== userId) {
      throw new Error("Unauthorized to update this organization.");
    }

    const updated = await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });

    return updated;
  },
});

export const deleteOrganization = mutation({
  args: {
    id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;
    const organization = await ctx.db.get(args.id);

    if (!organization) {
      throw new Error("Organization not found.");
    }

    if (organization.userId !== userId) {
      throw new Error("Unauthorized to delete this organization.");
    }

    // Check if there are any chats in this organization
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.id))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    if (chats.length > 0) {
      throw new Error(
        `Cannot delete organization with ${chats.length} active chat(s). Please archive or delete all chats first.`,
      );
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Get user's default organization (first one created, or create one if none exists)
export const getOrCreateDefaultOrganization = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const organizations = await ctx.db
      .query("organizations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("asc") // Get oldest first
      .first();

    return organizations;
  },
});
