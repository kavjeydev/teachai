import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { currentUser } from "@clerk/nextjs/server";

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

    // Debug logging
    console.log("Checkout Debug Info:", {
      priceId,
      mode,
      stripeKeyType: secretKey.startsWith("sk_test_") ? "test" : "live",
      userId,
    });

    // Verify the price exists before creating session
    try {
      const price = await stripe.prices.retrieve(priceId);
      console.log("Price found:", {
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        active: price.active,
      });
    } catch (priceError) {
      console.error("Price verification failed:", priceError);
      return NextResponse.json(
        {
          error: `Price not found: ${priceId}. Make sure you're using the correct price ID for your Stripe environment (test/live).`,
        },
        { status: 400 },
      );
    }

    // Create checkout session with customer email for identification
    const session = await stripe.checkout.sessions.create({
      mode: mode as "subscription" | "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/dashboard?success=true&user_id=${userId}&price_id=${priceId}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?canceled=true`,
      customer_email:
        user.emailAddresses[0]?.emailAddress || `user-${userId}@trainly.local`,
      metadata: {
        userId: userId,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
