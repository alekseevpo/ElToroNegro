'use client';

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface CardPaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentIntentId: string, amount: number) => void;
  onError: (error: string) => void;
  metadata?: Record<string, any>;
}

type PaymentStep = 'preparing' | 'ready' | 'processing' | 'completing' | 'completed' | 'error';

function PaymentForm({
  amount,
  onSuccess,
  onError,
  metadata,
}: Omit<CardPaymentFormProps, 'currency'>) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('preparing');

  // Create payment intent when component mounts or amount changes
  useEffect(() => {
    if (!user?.address || !amount || amount < 10) return;

    const createPaymentIntent = async () => {
      setPaymentStep('preparing');
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency: 'eur',
            userId: user.address,
            metadata,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentStep('ready');
      } catch (err: unknown) {
        const { message } = handleError(err);
        logger.error('Error creating payment intent', err, { amount, currency });
        setPaymentStep('error');
        onError(message || 'Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [amount, user?.address, metadata, onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      onError('Stripe is not loaded. Please refresh the page.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      return;
    }

    setLoading(true);
    setPaymentStep('processing');

    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user?.name || user?.address || 'Customer',
            },
          },
        }
      );

      if (error) {
        setPaymentStep('error');
        onError(error.message || 'Payment failed');
        showError(error.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStep('completing');
        // Small delay to show completing state
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setPaymentStep('completed');
        showSuccess('Payment successful!');
        setLoading(false);
        
        // Call success callback - parent component will handle next steps
        onSuccess(paymentIntent.id, amount);
      } else {
        setPaymentStep('error');
        onError('Payment was not completed');
        showError('Payment was not completed');
        setLoading(false);
      }
    } catch (err: unknown) {
      const { message } = handleError(err);
      logger.error('Payment error', err);
      setPaymentStep('error');
      onError(message || 'An error occurred during payment');
      showError(message || 'An error occurred during payment');
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': {
          color: '#9ca3af',
        },
        backgroundColor: '#000000',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: false,
  };

  const getStepProgress = () => {
    switch (paymentStep) {
      case 'preparing':
        return { current: 1, total: 4, label: 'Preparing payment...', percentage: 25 };
      case 'ready':
        return { current: 2, total: 4, label: 'Ready to pay', percentage: 50 };
      case 'processing':
        return { current: 3, total: 4, label: 'Processing payment...', percentage: 75 };
      case 'completing':
        return { current: 4, total: 4, label: 'Completing...', percentage: 90 };
      case 'completed':
        return { current: 4, total: 4, label: 'Payment completed!', percentage: 100 };
      case 'error':
        return { current: 0, total: 4, label: 'Payment failed', percentage: 0 };
      default:
        return { current: 0, total: 4, label: '', percentage: 0 };
    }
  };

  const progress = getStepProgress();

  if (!clientSecret || paymentStep === 'preparing') {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-yellow mx-auto mb-3"></div>
          <p className="text-sm text-primary-gray-lighter font-medium">{progress.label}</p>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-primary-gray-light rounded-full h-2">
          <div
            className="bg-accent-yellow h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Bar - Show when processing or completing */}
      {(paymentStep === 'processing' || paymentStep === 'completing' || paymentStep === 'completed') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${
              paymentStep === 'completed' ? 'text-green-400' : 
              paymentStep === 'error' ? 'text-red-400' : 
              'text-primary-gray-lighter'
            }`}>
              {progress.label}
            </span>
            <span className="text-primary-gray-lighter">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="w-full bg-primary-gray-light rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                paymentStep === 'completed' ? 'bg-green-500' :
                paymentStep === 'error' ? 'bg-red-500' :
                'bg-accent-yellow'
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          {paymentStep === 'processing' && (
            <p className="text-xs text-primary-gray-lighter text-center">
              Please wait while we process your payment...
            </p>
          )}
        </div>
      )}

      {/* Card Input - Hide when processing/completing */}
      {paymentStep !== 'processing' && paymentStep !== 'completing' && paymentStep !== 'completed' && (
        <>
          <div className="p-4 bg-black border border-primary-gray-light rounded-xl">
            <CardElement options={cardElementOptions} />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-1 text-blue-400">Test Card Numbers:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-300/90 text-xs">
                  <li>Success: <code className="bg-black/30 px-1 rounded">4242 4242 4242 4242</code></li>
                  <li>Decline: <code className="bg-black/30 px-1 rounded">4000 0000 0000 0002</code></li>
                  <li>3D Secure: <code className="bg-black/30 px-1 rounded">4000 0025 0000 3155</code></li>
                </ul>
                <p className="mt-2 text-xs text-blue-300/80">Use any future expiry date and any 3-digit CVC</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success Message */}
      {paymentStep === 'completed' && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-green-400">Payment Successful!</p>
              <p className="text-sm text-green-300/80 mt-1">Your payment of €{amount.toFixed(2)} has been processed.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {paymentStep === 'error' && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-red-400">Payment Failed</p>
              <p className="text-sm text-red-300/80 mt-1">Please check your card details and try again.</p>
              <button
                type="button"
                onClick={() => setPaymentStep('ready')}
                className="mt-3 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button - Hide when processing/completing/completed */}
      {paymentStep !== 'processing' && paymentStep !== 'completing' && paymentStep !== 'completed' && (
        <button
          type="submit"
          disabled={!stripe || loading || paymentStep !== 'ready'}
          className="w-full py-4 bg-accent-yellow text-black font-semibold text-lg rounded-xl hover:bg-accent-yellow-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paymentStep === 'error' ? 'Try Again' : `Pay €${amount.toFixed(2)}`}
        </button>
      )}
    </form>
  );
}

export default function CardPaymentForm({
  amount,
  currency = 'eur',
  onSuccess,
  onError,
  metadata,
}: CardPaymentFormProps) {
  const options: StripeElementsOptions = {
    mode: 'payment',
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
  };

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <p className="text-red-400 text-sm">
          Stripe is not configured. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment variables.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        metadata={metadata}
      />
    </Elements>
  );
}

