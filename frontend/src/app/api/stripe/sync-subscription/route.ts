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

    // Get current subscription from your database
    const currentSub = await convex.query(
      api.subscriptions.getSubscriptionByUserId,
      { userId },
    );

    if (!currentSub || !("stripeCustomerId" in currentSub)) {
      return NextResponse.json(
        { error: "No subscription found to sync" },
        { status: 400 },
      );
    }

    console.log("Current subscription in DB:", currentSub);

    // Get the latest subscription from Stripe
    const customerId = currentSub.stripeCustomerId;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: "No Stripe subscription found for this customer" },
        { status: 400 },
      );
    }

    const stripeSubscription = subscriptions.data[0];
    const priceId = stripeSubscription.items.data[0]?.price.id;

    console.log("Latest Stripe subscription:", {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      priceId,
      customerId,
    });

    // Map price ID to tier
    const getTierFromPriceId = (priceId: string | undefined): string => {
      const priceMap: Record<string, string> = {
        [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!]: "pro",
        [process.env.NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID!]: "scale",
      };
      return priceMap[priceId || ""] || "free";
    };

    const tier = getTierFromPriceId(priceId);
    const credits = tier === "scale" ? 100000 : tier === "pro" ? 10000 : 500;

    console.log("Mapped tier and credits:", { tier, credits });

    // Update subscription in database
    await convex.mutation(api.subscriptions.updateSubscriptionForUser, {
      userId: userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId!,
      tier,
      status: stripeSubscription.status,
      currentPeriodStart: stripeSubscription.current_period_start * 1000,
      currentPeriodEnd: stripeSubscription.current_period_end * 1000,
    });

    // Update credits for the new tier
    await convex.mutation(api.subscriptions.updateUserCredits, {
      userId,
      totalCredits: credits,
      resetUsage: true,
      periodStart: stripeSubscription.current_period_start * 1000,
      periodEnd: stripeSubscription.current_period_end * 1000,
    });

    console.log("✅ Subscription synced successfully");

    return NextResponse.json({
      success: true,
      message: "Subscription synced successfully",
      tier,
      credits,
      stripeSubscriptionId: stripeSubscription.id,
    });
  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json(
      {
        error: "Failed to sync subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
