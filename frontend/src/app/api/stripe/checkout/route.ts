import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    // Initialize Stripe with runtime check
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

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const { priceId, mode = "subscription" } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: "Price ID required" }, { status: 400 });
    }

    // Check if user already has an active subscription (for subscription mode)
    if (mode === "subscription") {
      const currentSubscription = await convex.query(
        api.subscriptions.getSubscriptionByUserId,
        { userId },
      );

      // Prevent multiple subscriptions for paid tiers
      if (
        currentSubscription &&
        "tier" in currentSubscription &&
        currentSubscription.tier !== "free" &&
        "status" in currentSubscription &&
        currentSubscription.status === "active"
      ) {
        return NextResponse.json(
          {
            error: `You already have an active ${currentSubscription.tier} subscription. Please manage your plan through the billing portal.`,
            currentTier: currentSubscription.tier,
          },
          { status: 400 },
        );
      }
    }

    // Verify the price exists before creating session
    try {
      await stripe.prices.retrieve(priceId);
    } catch (priceError) {
      console.error("Price verification failed:", priceError);
      return NextResponse.json(
        {
          error: `Price not found: ${priceId}. Make sure you're using the correct price ID for your Stripe environment (test/live).`,
        },
        { status: 400 },
      );
    }

    // Create or get Stripe customer
    let customerId: string;
    // Try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email:
        user.emailAddresses[0]?.emailAddress || `user-${userId}@trainly.local`,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      // Update metadata if missing
      if (!existingCustomers.data[0].metadata?.userId) {
        await stripe.customers.update(customerId, {
          metadata: {
            userId: userId,
            trainlyTier: "free", // Will be updated by webhook
          },
        });
      }
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
          trainlyTier: "free", // Will be updated by webhook
        },
      });
      customerId = customer.id;
    }

    // Verify customer exists in Stripe
    try {
      await stripe.customers.retrieve(customerId);
    } catch (customerError) {
      console.error("Customer verification failed:", customerError);
      return NextResponse.json(
        { error: "Customer verification failed" },
        { status: 500 },
      );
    }

    // Create checkout session with customer
    const session = await stripe.checkout.sessions.create({
      mode: mode as "subscription" | "payment",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/dashboard?success=true`,
      cancel_url: `${req.headers.get("origin")}/dashboard?canceled=true`,
      metadata: {
        userId: userId,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout session creation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
