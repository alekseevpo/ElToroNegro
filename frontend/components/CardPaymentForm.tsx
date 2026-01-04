'use client';

import { useState, useEffect, useRef } from 'react';
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

// Only load Stripe if publishable key is configured
// Wrap in try-catch to prevent module-level errors
let stripePromise: Promise<any> | null = null;
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (stripePublishableKey && stripePublishableKey.trim() !== '') {
  try {
    stripePromise = loadStripe(stripePublishableKey).catch((error) => {
      // Use console.error at module level to avoid SSR issues
      if (typeof window !== 'undefined') {
        console.error('Failed to load Stripe.js', error);
      }
      return null;
    });
  } catch (error) {
    // Use console.error at module level to avoid SSR issues
    if (typeof window !== 'undefined') {
      console.error('Error initializing Stripe', error);
    }
    stripePromise = Promise.resolve(null);
  }
} else {
  stripePromise = Promise.resolve(null);
}

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
  const [isMounted, setIsMounted] = useState(false);
  const [cardElementReady, setCardElementReady] = useState(false);
  const cardElementRef = useRef<any>(null);
  
  // Track if component is mounted
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Create payment intent when component mounts or amount changes
  useEffect(() => {
    // Reset card element ready state when amount changes
    setCardElementReady(false);
    cardElementRef.current = null;
    
    if (!user?.address || !amount || amount < 10) {
      if (amount && amount < 10) {
        onError('Minimum amount is €10');
      }
      return;
    }

    if (!stripe) {
      logger.warn('Stripe not loaded yet', { amount });
      return;
    }

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
          let errorMessage = 'Failed to create payment intent';
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
            logger.error('Payment intent creation failed', new Error(errorMessage), { 
              status: response.status,
              statusText: response.statusText,
              amount,
              userId: user.address 
            });
          } catch (parseError) {
            logger.error('Failed to parse error response', parseError as Error, { 
              status: response.status,
              statusText: response.statusText 
            });
            errorMessage = `Server error (${response.status}): ${response.statusText || 'Unknown error'}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (!data.clientSecret) {
          throw new Error('No client secret received from server');
        }
        
        setClientSecret(data.clientSecret);
        setPaymentStep('ready');
        logger.info('Payment intent created successfully', { amount, paymentIntentId: data.paymentIntentId });
      } catch (err: unknown) {
        const { message } = handleError(err);
        const currentAmount = amount;
        const currentUserId = user?.address;
        logger.error('Error creating payment intent', err, { 
          amount: currentAmount, 
          currency: 'eur', 
          userId: currentUserId 
        });
        setPaymentStep('error');
        onError(message || 'Failed to initialize payment. Please try again.');
      }
    };

    createPaymentIntent();
  }, [amount, user?.address, metadata, onError, stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe) {
      logger.error('Stripe not loaded', new Error('Stripe instance is null'));
      onError('Stripe is not loaded. Please refresh the page and try again.');
      return;
    }

    if (!elements) {
      logger.error('Stripe Elements not loaded', new Error('Elements instance is null'));
      onError('Payment form is not ready. Please refresh the page and try again.');
      return;
    }

    if (!clientSecret) {
      logger.error('Client secret missing', new Error('Client secret is null'));
      onError('Payment session expired. Please refresh the page and try again.');
      return;
    }

    // Wait a bit to ensure CardElement is fully mounted and ready
    let attempts = 0;
    let cardElement = null;
    
    while (attempts < 10 && !cardElement) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted) {
        logger.warn('Component unmounted before payment', { amount });
        onError('Payment form was closed. Please try again.');
        return;
      }
      
      cardElement = elements.getElement(CardElement);
      attempts++;
    }
    
    if (!cardElement) {
      logger.error('Card element not found after retries', new Error('CardElement is null'), { 
        isMounted,
        hasElements: !!elements,
        hasStripe: !!stripe,
        cardElementReady,
        attempts
      });
      onError('Card element is not ready. Please wait a moment and try again.');
      return;
    }
    
    // Double check that element is still mounted
    try {
      // Try to access element's internal state to verify it's mounted
      if (cardElementRef.current && !cardElementRef.current._element) {
        throw new Error('CardElement is not properly mounted');
      }
    } catch (checkError) {
      logger.error('CardElement mount check failed', checkError as Error);
      onError('Card element is not ready. Please refresh the page and try again.');
      return;
    }

    setLoading(true);
    setPaymentStep('processing');

    try {
      // Confirm payment with error handling for unmounted elements
      let paymentResult: { error?: any; paymentIntent?: any } | null = null;
      try {
        paymentResult = await stripe.confirmCardPayment(
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
      } catch (confirmError: any) {
        // Handle IntegrationError specifically
        if (confirmError?.code === 'integration_error' || confirmError?.message?.includes('Element')) {
          logger.error('Stripe Element integration error', confirmError, {
            isMounted,
            cardElementReady,
            hasCardElement: !!cardElement
          });
          throw new Error('Payment form is not ready. Please wait a moment and try again.');
        }
        throw confirmError;
      }

      if (!paymentResult) {
        throw new Error('Payment confirmation returned no result');
      }

      const { error, paymentIntent } = paymentResult;

      if (error) {
        logger.error('Stripe payment error', error, { 
          type: error.type, 
          code: error.code,
          paymentIntentId: paymentIntent?.id 
        });
        setPaymentStep('error');
        const errorMessage = error.message || 'Payment failed. Please check your card details and try again.';
        onError(errorMessage);
        showError(errorMessage);
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
      {paymentStep !== 'processing' && paymentStep !== 'completing' && paymentStep !== 'completed' && 
       stripe && elements && clientSecret && paymentStep === 'ready' && (
        <>
          <div className="space-y-2">
            <label htmlFor="stripe-card-element" className="block text-sm font-medium text-primary-gray-lighter">
              Card Details
            </label>
            <div 
              id="stripe-card-element-container"
              className="p-4 bg-black border border-primary-gray-light rounded-xl min-h-[50px]"
              role="group"
              aria-labelledby="stripe-card-element-label"
            >
              <span id="stripe-card-element-label" className="sr-only">Card number, expiration date, and CVC</span>
              <CardElement 
                id="stripe-card-element"
                key={`card-${clientSecret}`} // Force remount when clientSecret changes
                options={cardElementOptions}
                onReady={(element) => {
                  logger.debug('CardElement is ready', { hasElement: !!element });
                  if (element) {
                    cardElementRef.current = element;
                    setCardElementReady(true);
                  }
                }}
                onChange={(e) => {
                  if (e.error) {
                    logger.debug('CardElement validation error', { error: e.error.message });
                    setCardElementReady(false);
                  } else if (e.complete) {
                    setCardElementReady(true);
                  } else {
                    // Element is being filled but not complete yet
                    setCardElementReady(true); // Allow submission even if not complete
                  }
                }}
              />
            </div>
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
          disabled={!stripe || loading || paymentStep !== 'ready' || !cardElementReady}
          className="w-full py-4 bg-accent-yellow text-black font-semibold text-lg rounded-xl hover:bg-accent-yellow-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paymentStep === 'error' ? 'Try Again' : 
           !cardElementReady ? 'Loading payment form...' : 
           `Pay €${amount.toFixed(2)}`}
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

  if (!stripePublishableKey || !stripePromise) {
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

