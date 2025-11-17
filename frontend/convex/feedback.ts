import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Convex functions for managing user feedback
 */

// Submit feedback
export const submitFeedback = mutation({
  args: {
    feedback: v.string(),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    // Validate feedback
    if (!args.feedback || args.feedback.trim().length === 0) {
      throw new Error("Feedback cannot be empty.");
    }

    // Limit feedback length
    const sanitizedFeedback = args.feedback.trim().slice(0, 5000);
    const sanitizedEmail = args.userEmail
      ? args.userEmail.trim().slice(0, 254)
      : undefined;

    // Store feedback in database
    const feedbackId = await ctx.db.insert("feedback", {
      userId,
      userEmail: sanitizedEmail,
      feedback: sanitizedFeedback,
      createdAt: Date.now(),
    });

    return feedbackId;
  },
});

// Get all feedback (for admin purposes)
export const getAllFeedback = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    // Note: In production, you might want to add admin role checking here
    // For now, any authenticated user can view all feedback

    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_created", (q) => q)
      .order("desc")
      .collect();

    return feedback;
  },
});

// Get feedback for a specific user
export const getUserFeedback = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const userId = identity.subject;

    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return feedback;
  },
});

