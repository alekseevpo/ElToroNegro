import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { verificationSessionId } = await request.json();

    if (!verificationSessionId) {
      return NextResponse.json(
        { error: 'Verification session ID is required' },
        { status: 400 }
      );
    }

    const session = await stripe.identity.verificationSessions.retrieve(
      verificationSessionId
    );

    return NextResponse.json({
      status: session.status,
      verified: session.status === 'verified',
      type: session.type,
      userId: session.metadata?.userId,
    });
  } catch (error: any) {
    console.error('Error checking verification status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check verification status' },
      { status: 500 }
    );
  }
}

