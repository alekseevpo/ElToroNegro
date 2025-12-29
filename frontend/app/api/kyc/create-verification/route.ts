import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.warn('STRIPE_SECRET_KEY is not configured');
      return NextResponse.json(
        { 
          error: 'KYC verification is not configured. Please contact support or check your environment variables.',
          code: 'STRIPE_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    // Dynamically import Stripe to avoid errors if not installed
    let Stripe;
    try {
      Stripe = (await import('stripe')).default;
    } catch (importError) {
      return NextResponse.json(
        { 
          error: 'Stripe SDK is not installed. Please install it: npm install stripe',
          code: 'STRIPE_SDK_MISSING'
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create verification session
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        userId,
      },
      options: {
        document: {
          allowed_types: ['driving_license', 'passport', 'id_card'],
          require_matching_selfie: true,
        },
      },
    });

    return NextResponse.json({
      verificationSessionId: verificationSession.id,
      clientSecret: verificationSession.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating verification session:', error);
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { error: 'Invalid Stripe API key. Please check your configuration.', code: 'STRIPE_AUTH_ERROR' },
        { status: 401 }
      );
    }
    
    if (error.type === 'StripeAPIError') {
      return NextResponse.json(
        { error: `Stripe API error: ${error.message}`, code: 'STRIPE_API_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create verification session' },
      { status: 500 }
    );
  }
}

