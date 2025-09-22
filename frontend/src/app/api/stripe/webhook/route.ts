import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { currentUser } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log the event
    await convex.mutation(api.subscriptions.logBillingEvent, {
      eventType: event.type,
      stripeEventId: event.id,
      data: event.data,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  // Get customer to find user ID (you'll need to store this mapping)
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer || customer.deleted) return;

  const userId = (customer as Stripe.Customer).metadata?.userId;
  if (!userId) return;

  // Determine tier based on price ID
  const tier = getTierFromPriceId(priceId);
  const credits = getCreditsForTier(tier);

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

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  // Handle subscription cancellation
  // You might want to downgrade to free tier or set a grace period
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful payment
  // This is where you'd reset credits for the new billing period
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment
  // You might want to notify the user or suspend service
}

function getTierFromPriceId(priceId: string | undefined): string {
  const priceMap: Record<string, string> = {
    [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!]: 'pro',
    [process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID!]: 'team',
    [process.env.NEXT_PUBLIC_STRIPE_STARTUP_PRICE_ID!]: 'startup',
  };

  return priceMap[priceId || ''] || 'free';
}

function getCreditsForTier(tier: string): number {
  const creditMap: Record<string, number> = {
    free: 500,
    pro: 10000,
    team: 30000,
    startup: 100000,
  };

  return creditMap[tier] || 500;
}
