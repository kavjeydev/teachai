import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { userId, creditsToAdd, reason, adminKey } = await req.json();

    // Simple admin key check (you can make this more secure)
    if (adminKey !== process.env.WEBHOOK_ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userId || !creditsToAdd) {
      return NextResponse.json(
        { error: "userId and creditsToAdd are required" },
        { status: 400 },
      );
    }

    console.log(
      `🔧 Manual webhook: Adding ${creditsToAdd} credits to user ${userId}`,
    );

    // Add credits using the external userId
    const result = await convex.mutation(api.subscriptions.addUserCredits, {
      userId,
      creditsToAdd,
    });

    // Log the transaction
    await convex.mutation(api.subscriptions.logCreditTransaction, {
      userId,
      type: "manual_purchase",
      amount: creditsToAdd,
      description: reason || "Manual credit addition via webhook",
    });

    console.log(
      `✅ Successfully added ${creditsToAdd} credits to user ${userId}`,
    );

    return NextResponse.json({
      success: true,
      creditsAdded: creditsToAdd,
      userId,
      result,
    });
  } catch (error) {
    console.error("Manual webhook error:", error);
    return NextResponse.json(
      { error: "Failed to add credits", details: error },
      { status: 500 },
    );
  }
}

// GET endpoint for testing
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Manual webhook endpoint is working",
    usage: "POST with { userId, creditsToAdd, reason, adminKey }",
    timestamp: new Date().toISOString(),
  });
}

