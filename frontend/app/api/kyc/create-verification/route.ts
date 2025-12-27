import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: error.message || 'Failed to create verification session' },
      { status: 500 }
    );
  }
}

