import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { addTransactionToDB, addAssetToPortfolioInDB } from '@/lib/db-profile-utils';
import { logger } from '@/lib/logger';

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
  } catch (err: unknown) {
    logger.error('Webhook signature verification failed', err as Error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle payment intent events
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const userId = paymentIntent.metadata?.userId || paymentIntent.metadata?.address;
    const amount = paymentIntent.amount / 100; // Convert from cents to euros
    const tokensAmount = paymentIntent.metadata?.tokensAmount || amount.toString();

    logger.info('Payment succeeded', { userId, amount, paymentIntentId: paymentIntent.id });
    
    if (userId) {
      try {
        // Create transaction record
        await addTransactionToDB(userId, {
          type: 'token_purchase',
          status: 'completed',
          amount: amount.toString(),
          currency: 'EUR',
          tokensAmount,
          description: `Purchased ${tokensAmount} $TAI tokens via Stripe`,
          paymentMethod: 'stripe',
          stripeSessionId: paymentIntent.id,
          metadata: {
            paymentIntentId: paymentIntent.id,
            amount,
            tokensAmount,
          },
        });

        // Add tokens to portfolio
        await addAssetToPortfolioInDB(userId, {
          type: 'token',
          symbol: 'TAI',
          name: '$TAI Token',
          quantity: parseFloat(tokensAmount),
          purchasePrice: 1.0,
          currentPrice: 1.0,
          purchaseDate: Date.now(),
          currency: 'EUR',
          totalCost: amount,
          interestEarned: 0,
        });

        logger.info('Successfully processed payment', { userId, amount, tokensAmount });
      } catch (error) {
        logger.error('Error processing payment in webhook', error as Error, { userId, amount });
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const userId = paymentIntent.metadata?.userId || paymentIntent.metadata?.address;
    const failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';
    
    logger.warn('Payment failed', { userId, paymentIntentId: paymentIntent.id, failureReason });
    
    if (userId) {
      try {
        // Create failed transaction record
        await addTransactionToDB(userId, {
          type: 'token_purchase',
          status: 'failed',
          amount: (paymentIntent.amount / 100).toString(),
          currency: 'EUR',
          description: `Failed token purchase via Stripe: ${failureReason}`,
          paymentMethod: 'stripe',
          stripeSessionId: paymentIntent.id,
          metadata: {
            paymentIntentId: paymentIntent.id,
            failureReason,
          },
        });

        logger.info('Successfully recorded failed payment', { userId, paymentIntentId: paymentIntent.id });
      } catch (error) {
        logger.error('Error recording failed payment', error as Error, { userId });
      }
    }
  }

  if (event.type === 'payment_intent.canceled') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const userId = paymentIntent.metadata?.userId || paymentIntent.metadata?.address;
    
    logger.info('Payment canceled', { userId, paymentIntentId: paymentIntent.id });
  }

  return NextResponse.json({ received: true });
}

