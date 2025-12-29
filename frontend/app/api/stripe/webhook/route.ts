import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15',
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

  // Handle payment intent events
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const userId = paymentIntent.metadata?.userId;
    const amount = paymentIntent.amount / 100; // Convert from cents to euros

    console.log(`Payment succeeded for user ${userId}: €${amount.toFixed(2)}`);
    
    // TODO: In production, update database here
    // - Add tokens to user account
    // - Create transaction record
    // - Update user balance
    // - Send confirmation email
    
    // For now, just log it
    // The frontend will handle the UI update via the onSuccess callback
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const userId = paymentIntent.metadata?.userId;
    
    console.log(`Payment failed for user ${userId}: ${paymentIntent.id}`);
    
    // TODO: In production, handle failed payment
    // - Log failure reason
    // - Notify user
    // - Update transaction status
  }

  if (event.type === 'payment_intent.canceled') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const userId = paymentIntent.metadata?.userId;
    
    console.log(`Payment canceled for user ${userId}: ${paymentIntent.id}`);
  }

  return NextResponse.json({ received: true });
}

