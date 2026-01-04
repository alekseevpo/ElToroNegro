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
      apiVersion: '2025-12-15.clover',
    });

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create verification session
    let verificationSession;
    try {
      verificationSession = await stripe.identity.verificationSessions.create({
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
    } catch (stripeError: any) {
      // Check if Identity is not enabled
      if (stripeError.code === 'resource_missing' || stripeError.message?.includes('identity')) {
        return NextResponse.json(
          { 
            error: 'Stripe Identity is not enabled in your Stripe account. Please enable it in your Stripe Dashboard: https://dashboard.stripe.com/settings/identity',
            code: 'STRIPE_IDENTITY_NOT_ENABLED'
          },
          { status: 503 }
        );
      }
      throw stripeError; // Re-throw if it's a different error
    }

    if (!verificationSession.client_secret) {
      console.error('Verification session created but client_secret is missing', {
        sessionId: verificationSession.id,
        status: verificationSession.status,
        type: verificationSession.type,
      });
      return NextResponse.json(
        { 
          error: 'Failed to create verification session: missing client secret',
          code: 'MISSING_CLIENT_SECRET'
        },
        { status: 500 }
      );
    }

    // Validate clientSecret format
    if (!verificationSession.client_secret.startsWith('vs_')) {
      console.error('Invalid clientSecret format', {
        sessionId: verificationSession.id,
        clientSecretPrefix: verificationSession.client_secret.substring(0, 10),
      });
      return NextResponse.json(
        { 
          error: 'Invalid verification session format from Stripe',
          code: 'INVALID_CLIENT_SECRET_FORMAT'
        },
        { status: 500 }
      );
    }

    console.log('Verification session created successfully', {
      sessionId: verificationSession.id,
      clientSecretPrefix: verificationSession.client_secret.substring(0, 10),
      status: verificationSession.status,
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

