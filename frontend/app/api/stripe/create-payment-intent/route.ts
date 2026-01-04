import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  logger.error('STRIPE_SECRET_KEY is not configured');
}

const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    })
  : null;

export async function POST(request: NextRequest) {
  let amount: number | undefined;
  let currency: string = 'eur';
  let userId: string | undefined;
  
  try {
    const body = await request.json();
    amount = body.amount;
    currency = body.currency || 'eur';
    userId = body.userId;
    const metadata = body.metadata;

    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: 'Minimum amount is €10' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!stripe) {
      logger.error('Stripe is not configured - STRIPE_SECRET_KEY is missing');
      return NextResponse.json(
        { error: 'Payment service is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Create Payment Intent
    // Use payment_method_types instead of automatic_payment_methods to avoid bancontact warning
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method_types: ['card'], // Only card payments to avoid bancontact warning
      metadata: {
        userId: userId.toString(),
        address: userId.toString(), // Also store as address for compatibility
        amount: amount.toString(),
        ...metadata,
      },
    });

    logger.info('Payment intent created', { 
      paymentIntentId: paymentIntent.id, 
      amount, 
      currency,
      userId 
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: unknown) {
    logger.error('Error creating payment intent', error as Error, { 
      amount, 
      currency, 
      userId 
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

