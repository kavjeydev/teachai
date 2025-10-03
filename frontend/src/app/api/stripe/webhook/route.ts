import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { currentUser } from "@clerk/nextjs/server";

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
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
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
            subscriptionId: invoice.subscription,
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

      // Log the event
      await convex.mutation(api.subscriptions.logBillingEvent, {
        eventType: event.type,
        stripeEventId: event.id,
        data: event.data,
      });

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Webhook handler error:", error);
      return NextResponse.json(
        { error: "Webhook handler failed" },
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
  console.log(`📋 handleSubscriptionChange called`);
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  console.log("🔍 Subscription change details:", {
    subscriptionId: subscription.id,
    customerId,
    priceId,
    status: subscription.status,
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

  await convex.mutation(api.subscriptions.createSubscription, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId!,
    tier,
    status: subscription.status,
    currentPeriodStart: (subscription as any).current_period_start * 1000,
    currentPeriodEnd: (subscription as any).current_period_end * 1000,
  });

  // Apply any pending plan changes if this is a billing cycle renewal
  try {
    await convex.mutation(api.subscriptions.applyPendingPlanChanges, {
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.log("No pending plan changes to apply:", error);
  }

  // Reset credits to exact plan amount (fresh start with new plan)
  await convex.mutation(api.subscriptions.updateUserCredits, {
    userId,
    totalCredits: credits,
    resetUsage: true, // Always reset to 0 and give full plan credits
    periodStart: (subscription as any).current_period_start * 1000,
    periodEnd: (subscription as any).current_period_end * 1000,
  });
}

async function handleSubscriptionCancellation(
  subscription: Stripe.Subscription,
) {
  // Handle subscription cancellation
  // You might want to downgrade to free tier or set a grace period
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
  // Handle failed payment
  // You might want to notify the user or suspend service
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
) {
  // Handle one-time credit purchases
  if (session.mode === "payment" && session.payment_status === "paid") {
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error("No userId in checkout session metadata");
      return;
    }

    // Get the price ID from line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;

    if (!priceId) {
      console.error("No price ID found in checkout session");
      return;
    }

    // Determine credits to add based on price ID
    const creditsToAdd = getCreditsForPriceId(priceId);
    if (creditsToAdd > 0) {
      console.log(`Adding ${creditsToAdd} credits for user ${userId}`);

      // Add credits to user's balance (don't replace, add to existing)
      await convex.mutation(api.subscriptions.addUserCredits, {
        userId,
        creditsToAdd,
      });

      // Log the credit purchase transaction
      await convex.mutation(api.subscriptions.logCreditTransaction, {
        userId,
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
