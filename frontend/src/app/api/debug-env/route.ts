import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Return environment variable info (safe - only shows if they exist, not values)
    const envCheck = {
      hasConvexUrl: !!process.env.NEXT_PUBLIC_CONVEX_URL,
      convexUrlPrefix:
        process.env.NEXT_PUBLIC_CONVEX_URL?.substring(0, 30) + "...",
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyType: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
        ? "LIVE"
        : process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
          ? "TEST"
          : "UNKNOWN",
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretPrefix:
        process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + "...",
      hasPriceIds: {
        pro: !!process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        scale: !!process.env.NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID,
        credits5k: !!process.env.NEXT_PUBLIC_STRIPE_CREDITS_5K_PRICE_ID,
        credits15k: !!process.env.NEXT_PUBLIC_STRIPE_CREDITS_15K_PRICE_ID,
        credits50k: !!process.env.NEXT_PUBLIC_STRIPE_CREDITS_50K_PRICE_ID,
        credits100k: !!process.env.NEXT_PUBLIC_STRIPE_CREDITS_100K_PRICE_ID,
      },
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    };

    return NextResponse.json(envCheck);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check environment" },
      { status: 500 },
    );
  }
}
