import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Use direct HTTP calls to Convex for server-side operations
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

// Helper function to call Convex mutations from server-side
async function callConvexMutation(functionPath: string, args: any) {
  const url = `${CONVEX_SITE_URL}/api/run/${functionPath}`;

  console.log(`🔄 Calling Convex mutation: ${functionPath}`, { args });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      args,
      format: "json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Convex mutation failed: ${functionPath}`, {
      status: response.status,
      error: errorText,
    });
    throw new Error(
      `Convex mutation failed: ${response.status} - ${errorText}`,
    );
  }

  const result = await response.json();
  console.log(`✅ Convex mutation success: ${functionPath}`, { result });
  return result;
}

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
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
      console.log("✅ Webhook signature verified successfully");
    } catch (error) {
      console.error("❌ Webhook signature verification failed:", error);
      console.error(
        "Expected secret:",
        process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 20) + "...",
      );
      console.error("Signature received:", signature?.substring(0, 50) + "...");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    try {
      console.log(`🔔 Webhook received: ${event.type}`, {
        eventId: event.id,
        created: event.created,
        livemode: event.livemode,
      });

      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          console.log(`📋 Processing subscription event: ${event.type}`);
          const subscription = event.data.object as Stripe.Subscription;
          console.log("Subscription details:", {
            id: subscription.id,
            status: subscription.status,
            priceId: subscription.items.data[0]?.price.id,
            customerId: subscription.customer,
          });
          await handleSubscriptionChange(subscription, stripe);
          break;
        }

        case "customer.subscription.deleted": {
          console.log(`🗑️ Processing subscription deletion`);
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionCancellation(subscription);
          break;
        }

        case "invoice.payment_succeeded": {
          console.log(`💰 Processing invoice payment succeeded`);
          const invoice = event.data.object as Stripe.Invoice;
          console.log("Invoice details:", {
            id: invoice.id,
            subscriptionId: (invoice as any).subscription,
            customerId: invoice.customer,
            total: invoice.total,
            billing_reason: invoice.billing_reason,
          });
          await handlePaymentSucceeded(invoice, stripe);
          break;
        }

        case "invoice.payment_failed": {
          console.log(`❌ Processing invoice payment failed`);
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentFailed(invoice);
          break;
        }

        case "checkout.session.completed": {
          console.log(`✅ Processing checkout session completed`);
          const session = event.data.object as Stripe.Checkout.Session;
          console.log("Session details:", {
            id: session.id,
            mode: session.mode,
            payment_status: session.payment_status,
            customerId: session.customer,
            metadata: session.metadata,
          });
          await handleCheckoutCompleted(session, stripe);
          break;
        }

        default:
          console.log(`❓ Unhandled event type: ${event.type}`);
      }

      // Log the event (optional - don't fail if this fails)
      try {
        await callConvexMutation("subscriptions/logBillingEvent", {
          userId: "webhook", // Use a placeholder for webhook events
          eventType: event.type,
          stripeEventId: event.id,
          data: event.data,
        });
      } catch (error) {
        console.log("Failed to log billing event (non-critical):", error);
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("❌ Webhook handler error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        eventType: event?.type,
        eventId: event?.id,
      });
      return NextResponse.json(
        {
          error: "Webhook handler failed",
          details: error instanceof Error ? error.message : "Unknown error",
          eventType: event?.type,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Stripe configuration error:", error);
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 },
    );
  }
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  stripe: Stripe,
) {
  try {
    console.log(`📋 handleSubscriptionChange called`);
    const customerId = subscription.customer as string;
    const priceId = subscription.items.data[0]?.price.id;

    console.log("🔍 Subscription change details:", {
      subscriptionId: subscription.id,
      customerId,
      priceId,
      status: subscription.status,
      currentPeriodStart: (subscription as any).current_period_start,
      currentPeriodEnd: (subscription as any).current_period_end,
      current_period_start: (subscription as any).current_period_start,
      current_period_end: (subscription as any).current_period_end,
    });

    // Get customer to find user ID (you'll need to store this mapping)
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) {
      console.log("❌ Customer not found or deleted");
      return;
    }

    const userId = (customer as Stripe.Customer).metadata?.userId;
    if (!userId) {
      console.log("❌ No userId in customer metadata");
      return;
    }

    console.log(`👤 Found userId: ${userId}`);

    // Determine tier based on price ID
    const tier = getTierFromPriceId(priceId);

    // ⚠️ CRITICAL: Don't process if this is a credit pack price ID
    if (isCreditsPrice(priceId)) {
      console.log(
        "🚫 This is a credit pack price ID, not a subscription - skipping subscription logic",
      );
      return;
    }

    const credits = getCreditsForTier(tier);

    console.log(`🎯 Mapped to tier: ${tier}, credits: ${credits}`);

    // Validate and convert timestamps
    const currentPeriodStart = (subscription as any).current_period_start;
    const currentPeriodEnd = (subscription as any).current_period_end;
    console.log("📅 Timestamp validation:", {
      raw_current_period_start: currentPeriodStart,
      raw_current_period_end: currentPeriodEnd,
      converted_start: currentPeriodStart
        ? currentPeriodStart * 1000
        : Date.now(),
      converted_end: currentPeriodEnd
        ? currentPeriodEnd * 1000
        : Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    await callConvexMutation("subscriptions/updateSubscriptionForUser", {
      userId: userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId!,
      tier,
      status: subscription.status,
      currentPeriodStart: currentPeriodStart
        ? currentPeriodStart * 1000
        : Date.now(),
      currentPeriodEnd: currentPeriodEnd
        ? currentPeriodEnd * 1000
        : Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    // Apply any pending plan changes if this is a billing cycle renewal
    try {
      await callConvexMutation("subscriptions/applyPendingPlanChanges", {
        subscriptionId: subscription.id,
      });
    } catch (error) {
      console.log("No pending plan changes to apply:", error);
    }

    // Reset credits to exact plan amount (fresh start with new plan)
    await callConvexMutation("subscriptions/updateUserCredits", {
      userId,
      totalCredits: credits,
      resetUsage: true, // Always reset to 0 and give full plan credits
      periodStart: currentPeriodStart ? currentPeriodStart * 1000 : Date.now(),
      periodEnd: currentPeriodEnd
        ? currentPeriodEnd * 1000
        : Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
  } catch (error) {
    console.error("❌ Error in handleSubscriptionChange:", error);
    throw error; // Re-throw to be caught by main handler
  }
}

async function handleSubscriptionCancellation(
  subscription: Stripe.Subscription,
) {
  console.log(`🗑️ Processing subscription cancellation`);

  const customerId = subscription.customer as string;

  // Get customer to find user ID
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });

  const customer = await stripe.customers.retrieve(customerId);
  if (!customer || customer.deleted) {
    console.log("❌ Customer not found or deleted");
    return;
  }

  const userId = (customer as Stripe.Customer).metadata?.userId;
  if (!userId) {
    console.log("❌ No userId in customer metadata");
    return;
  }

  console.log(`👤 Canceling subscription for userId: ${userId}`);

  // Update subscription status to canceled
  await callConvexMutation("subscriptions/cancelSubscription", {
    userId,
    stripeSubscriptionId: subscription.id,
  });

  // Downgrade to free tier credits but keep current usage
  await callConvexMutation("subscriptions/updateUserCredits", {
    userId,
    totalCredits: 500, // Free tier credits
    resetUsage: false, // Keep current usage
    periodStart: Date.now(),
    periodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  console.log(`✅ Subscription canceled and user downgraded to free tier`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, stripe: Stripe) {
  console.log(
    `💰 Processing invoice payment - billing_reason: ${invoice.billing_reason}`,
  );

  // Only process subscription-related invoices, NOT one-time payments
  if (
    invoice.billing_reason === "subscription_cycle" ||
    invoice.billing_reason === "subscription_create"
  ) {
    console.log("✅ This is a subscription invoice, processing normally");
    // Handle subscription billing cycle - reset credits for the new period
    // This is where subscription renewals would be processed
  } else {
    console.log(
      "⚠️ This is NOT a subscription invoice, skipping subscription logic",
    );
    // This might be a one-time payment invoice - don't treat as subscription
    return;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`❌ Processing payment failure`);

  const customerId = invoice.customer as string;
  if (!customerId) {
    console.log("❌ No customer ID in failed invoice");
    return;
  }

  // Get customer to find user ID
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) {
      console.log("❌ Customer not found or deleted");
      return;
    }

    const userId = (customer as Stripe.Customer).metadata?.userId;
    if (!userId) {
      console.log("❌ No userId in customer metadata");
      return;
    }

    console.log(`👤 Payment failed for userId: ${userId}`);

    // Log the failed payment event
    await callConvexMutation("subscriptions/logBillingEvent", {
      userId: userId,
      eventType: "payment_failed",
      stripeEventId: `invoice_${invoice.id}`,
      data: {
        invoiceId: invoice.id,
        customerId: customerId,
        amount: invoice.total,
        attemptCount: invoice.attempt_count,
      },
    });

    // If this is a subscription invoice, mark subscription as past_due
    if ((invoice as any).subscription) {
      await callConvexMutation("subscriptions/updateSubscriptionStatus", {
        userId,
        stripeSubscriptionId: (invoice as any).subscription as string,
        status: "past_due",
      });

      console.log(`⚠️ Subscription marked as past_due for userId: ${userId}`);
    }
  } catch (error) {
    console.error("Error processing payment failure:", error);
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
) {
  console.log(`🛒 Processing checkout completed - mode: ${session.mode}`);

  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("❌ No userId in checkout session metadata");
    return;
  }

  // Get the price ID from line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  const priceId = lineItems.data[0]?.price?.id;

  if (!priceId) {
    console.error("❌ No price ID found in checkout session");
    return;
  }

  console.log(`📋 Checkout details:`, {
    sessionId: session.id,
    userId,
    priceId,
    customerId: session.customer,
    mode: session.mode,
    paymentStatus: session.payment_status,
  });

  if (session.mode === "subscription" && session.payment_status === "paid") {
    // Handle subscription checkout
    console.log("🔄 Processing subscription checkout");

    // Get the subscription ID from the session
    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
      console.error("❌ No subscription ID found in checkout session");
      return;
    }

    // Retrieve the subscription to get full details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log("📋 Retrieved subscription:", {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer,
    });

    // Process the subscription using the existing handler
    await handleSubscriptionChange(subscription, stripe);
  } else if (session.mode === "payment" && session.payment_status === "paid") {
    // Handle one-time credit purchases
    console.log("💰 Processing one-time credit purchase");

    // Determine credits to add based on price ID
    const creditsToAdd = getCreditsForPriceId(priceId);
    if (creditsToAdd > 0) {
      console.log(`Adding ${creditsToAdd} credits for user ${userId}`);

      // Add credits to user's balance (don't replace, add to existing)
      await callConvexMutation("subscriptions/addUserCredits", {
        userId,
        creditsToAdd,
      });

      // Log the credit purchase transaction
      await callConvexMutation("subscriptions/logCreditTransaction", {
        userId: userId,
        type: "purchase",
        amount: creditsToAdd,
        description: `Credit pack purchase (${creditsToAdd} credits)`,
        stripeSessionId: session.id,
        stripePriceId: priceId,
      });
    }
  }
}

function getTierFromPriceId(priceId: string | undefined): string {
  const priceMap: Record<string, string> = {
    [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!]: "pro",
    [process.env.NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID!]: "scale",
    // Enterprise is handled separately as it's custom pricing
  };

  return priceMap[priceId || ""] || "free";
}

function getCreditsForPriceId(priceId: string): number {
  const creditPriceMap: Record<string, number> = {
    [process.env.NEXT_PUBLIC_STRIPE_CREDITS_5K_PRICE_ID!]: 5000,
    [process.env.NEXT_PUBLIC_STRIPE_CREDITS_15K_PRICE_ID!]: 15000,
    [process.env.NEXT_PUBLIC_STRIPE_CREDITS_50K_PRICE_ID!]: 50000,
    [process.env.NEXT_PUBLIC_STRIPE_CREDITS_100K_PRICE_ID!]: 100000,
  };

  return creditPriceMap[priceId] || 0;
}

function isCreditsPrice(priceId: string | undefined): boolean {
  if (!priceId) return false;

  const creditPriceIds = [
    process.env.NEXT_PUBLIC_STRIPE_CREDITS_5K_PRICE_ID!,
    process.env.NEXT_PUBLIC_STRIPE_CREDITS_15K_PRICE_ID!,
    process.env.NEXT_PUBLIC_STRIPE_CREDITS_50K_PRICE_ID!,
    process.env.NEXT_PUBLIC_STRIPE_CREDITS_100K_PRICE_ID!,
  ];

  return creditPriceIds.includes(priceId);
}

function getCreditsForTier(tier: string): number {
  const creditMap: Record<string, number> = {
    free: 500,
    pro: 10000,
    scale: 100000,
    enterprise: 100000, // Default for enterprise, can be customized
  };

  return creditMap[tier] || 500;
}
