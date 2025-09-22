import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // For now, just activate Pro subscription manually
    // In production, this would be called by the webhook after verifying the payment

    // This is a simplified version - in production you'd verify the session with Stripe first
    console.log(`Activating Pro subscription for user ${userId} after successful payment`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment success handler failed:', error);
    return NextResponse.json(
      { error: 'Failed to process payment success' },
      { status: 500 }
    );
  }
}
