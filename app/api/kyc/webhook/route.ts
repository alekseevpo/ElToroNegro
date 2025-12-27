import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
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

  // Handle verification session events
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.userId;

    if (userId) {
      // Note: In a real application, you would update the database here
      // For now, we'll just log it. The frontend will handle the update via API call
      console.log(`User ${userId} verified successfully - Session: ${session.id}`);
    }
  }

  if (event.type === 'identity.verification_session.requires_input') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.userId;
    console.log(`Verification requires additional input for user ${userId} - Session: ${session.id}`);
  }

  if (event.type === 'identity.verification_session.canceled') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.userId;
    console.log(`Verification canceled for user ${userId} - Session: ${session.id}`);
  }

  if (event.type === 'identity.verification_session.processing') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.userId;
    console.log(`Verification processing for user ${userId} - Session: ${session.id}`);
  }

  return NextResponse.json({ received: true });
}

