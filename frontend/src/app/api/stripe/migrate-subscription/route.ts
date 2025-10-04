import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

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

    // Get current subscription data - try to get it directly with auth
    let subscription;
    try {
      subscription = await convex.query(
        api.subscriptions.getSubscriptionByUserId,
        { userId },
      );
      console.log("Subscription query result:", subscription);
    } catch (error) {
      console.error("Failed to get subscription:", error);
      return NextResponse.json(
        { error: "Failed to retrieve subscription data" },
        { status: 500 },
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 },
      );
    }

    // Check if subscription is a default free tier response (not a real subscription)
    if (subscription.tier === "free" && !("stripeCustomerId" in subscription)) {
      return NextResponse.json(
        { error: "No paid subscription found to migrate" },
        { status: 400 },
      );
    }

    console.log("Current subscription:", subscription);

    // Use existing customer ID if it's a real Stripe customer
    let customerId: string;

    if (
      "stripeCustomerId" in subscription &&
      subscription.stripeCustomerId &&
      subscription.stripeCustomerId.startsWith("cus_")
    ) {
      customerId = subscription.stripeCustomerId;
      console.log("Using existing Stripe customer:", customerId);
    } else {
      // Find or create Stripe customer
      const existingCustomers = await stripe.customers.list({
        email:
          user.emailAddresses[0]?.emailAddress ||
          `user-${userId}@trainly.local`,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
        console.log("Found existing customer:", customerId);
      } else {
        // Create new customer
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
            trainlyTier: subscription.tier,
          },
        });
        customerId = customer.id;
        console.log("Created new customer:", customerId);
      }
    }

    console.log("Customer prepared:", { customerId, userId });

    // Determine the correct price ID based on current tier
    let priceId: string;
    const tier = "tier" in subscription ? subscription.tier : "pro";

    switch (tier) {
      case "pro":
        priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!;
        break;
      case "scale":
      case "startup":
        priceId = process.env.NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID!;
        break;
      default:
        priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!;
    }

    console.log("Price ID selected:", { tier, priceId });

    console.log("Creating Stripe subscription with:", {
      customerId,
      priceId,
      tier,
    });

    // Create Stripe subscription (start immediately, don't try to preserve old billing cycle)
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      metadata: {
        userId: userId,
        migratedFrom: "manual_subscription",
        originalTier: tier,
      },
      // Start the subscription immediately with a new billing cycle
      proration_behavior: "none", // Don't prorate since this is a migration
    });

    console.log("Stripe subscription created:", {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      customerId: stripeSubscription.customer,
    });

    // Update the subscription record in Convex with real Stripe IDs
    await convex.mutation(api.subscriptions.updateSubscriptionForUser, {
      userId: userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      tier: tier,
      status: stripeSubscription.status,
      currentPeriodStart: stripeSubscription.current_period_start * 1000,
      currentPeriodEnd: stripeSubscription.current_period_end * 1000,
    });

    console.log("✅ Migration completed successfully");

    return NextResponse.json({
      success: true,
      message: "Subscription migrated successfully",
      subscriptionId: stripeSubscription.id,
      customerId: customerId,
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      {
        error: "Failed to migrate subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
