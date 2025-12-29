import { NextRequest, NextResponse } from 'next/server';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey || !webhookSecret) {
    console.warn('Stripe webhook secret is not configured');
    return NextResponse.json(
      { error: 'Webhook is not configured' },
      { status: 503 }
    );
  }

  // Dynamically import Stripe
  let Stripe;
  try {
    Stripe = (await import('stripe')).default;
  } catch (importError) {
    return NextResponse.json(
      { error: 'Stripe SDK is not installed' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
  });

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Import database functions
  const { updateKYCStatusInDB } = await import('@/lib/db-profile-utils');

  // Handle verification session events
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.userId;

    if (userId) {
      try {
        await updateKYCStatusInDB(userId, {
          verified: true,
          verificationId: session.id,
          provider: 'stripe',
          status: 'verified',
          verificationDate: Date.now(),
        });
        console.log(`User ${userId} verified successfully - Session: ${session.id}`);
      } catch (error) {
        console.error(`Error updating KYC status for user ${userId}:`, error);
      }
    }
  }

  if (event.type === 'identity.verification_session.requires_input') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.userId;
    
    if (userId) {
      try {
        await updateKYCStatusInDB(userId, {
          verified: false,
          verificationId: session.id,
          provider: 'stripe',
          status: 'requires_input',
          verificationDate: Date.now(),
        });
        console.log(`Verification requires additional input for user ${userId} - Session: ${session.id}`);
      } catch (error) {
        console.error(`Error updating KYC status for user ${userId}:`, error);
      }
    }
  }

  if (event.type === 'identity.verification_session.canceled') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.userId;
    
    if (userId) {
      try {
        await updateKYCStatusInDB(userId, {
          verified: false,
          verificationId: session.id,
          provider: 'stripe',
          status: 'canceled',
          verificationDate: Date.now(),
        });
        console.log(`Verification canceled for user ${userId} - Session: ${session.id}`);
      } catch (error) {
        console.error(`Error updating KYC status for user ${userId}:`, error);
      }
    }
  }

  if (event.type === 'identity.verification_session.processing') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.userId;
    
    if (userId) {
      try {
        await updateKYCStatusInDB(userId, {
          verified: false,
          verificationId: session.id,
          provider: 'stripe',
          status: 'processing',
          verificationDate: Date.now(),
        });
        console.log(`Verification processing for user ${userId} - Session: ${session.id}`);
      } catch (error) {
        console.error(`Error updating KYC status for user ${userId}:`, error);
      }
    }
  }

  if (event.type === 'identity.verification_session.verification_failed') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.userId;
    
    if (userId) {
      try {
        await updateKYCStatusInDB(userId, {
          verified: false,
          verificationId: session.id,
          provider: 'stripe',
          status: 'failed',
          verificationDate: Date.now(),
          error: 'Verification failed',
        });
        console.log(`Verification failed for user ${userId} - Session: ${session.id}`);
      } catch (error) {
        console.error(`Error updating KYC status for user ${userId}:`, error);
      }
    }
  }

  return NextResponse.json({ received: true });
}

