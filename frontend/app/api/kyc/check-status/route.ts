import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return NextResponse.json(
        { 
          error: 'KYC verification is not configured',
          code: 'STRIPE_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    // Dynamically import Stripe
    let Stripe;
    try {
      Stripe = (await import('stripe')).default;
    } catch (importError) {
      return NextResponse.json(
        { 
          error: 'Stripe SDK is not installed',
          code: 'STRIPE_SDK_MISSING'
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });

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
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid verification session ID', code: 'INVALID_SESSION' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to check verification status' },
      { status: 500 }
    );
  }
}

