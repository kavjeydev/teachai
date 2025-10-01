import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    // Initialize Stripe
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Get user's subscription or create Stripe customer if needed
    const subscription = await convex.query(
      api.subscriptions.getSubscriptionByUserId,
      { userId },
    );

    let stripeCustomerId: string;

    // If user has a valid Stripe customer ID, use it
    if (
      subscription &&
      "stripeCustomerId" in subscription &&
      subscription.stripeCustomerId &&
      !subscription.stripeCustomerId.startsWith("test_")
    ) {
      stripeCustomerId = subscription.stripeCustomerId;
    } else {
      // Create a new Stripe customer for this user (even free users)
      const customer = await stripe.customers.create({
        email:
          user.emailAddresses[0]?.emailAddress ||
          `user-${userId}@trainly.local`,
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : undefined,
        metadata: {
          userId: userId,
          trainlyTier: subscription?.tier || "free",
        },
      });

      stripeCustomerId = customer.id;

      // Update or create subscription record with the new customer ID
      if (subscription && "stripeCustomerId" in subscription) {
        await convex.mutation(api.subscriptions.updateCustomerId, {
          userId,
          stripeCustomerId: customer.id,
        });
      } else {
        // Create a basic subscription record for free users
        await convex.mutation(api.subscriptions.createFreeUserRecord, {
          userId,
          stripeCustomerId: customer.id,
        });
      }
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${req.headers.get("origin")}/dashboard/manage`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Customer portal creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create customer portal session" },
      { status: 500 },
    );
  }
}
