'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateKYCStatus, getKYCStatus } from '@/lib/profile-utils';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';

interface KYCVerificationProps {
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export default function KYCVerification({ onComplete, onError }: KYCVerificationProps) {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'verified' | 'failed' | 'requires_input'>('idle');

  // Check if user already has a verification session
  useEffect(() => {
    if (user?.address) {
      const existingKYC = getKYCStatus(user.address);
      if (existingKYC?.verified) {
        setStatus('verified');
        setLoading(false);
        return;
      }
      if (existingKYC?.verificationId && existingKYC.status === 'processing') {
        setVerificationSessionId(existingKYC.verificationId);
        setStatus('processing');
        setLoading(false);
        return;
      }
      createVerificationSession();
    }
  }, [user?.address]);

  const createVerificationSession = useCallback(async () => {
    if (!user?.address) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setStatus('idle');

    try {
      const response = await fetch('/api/kyc/create-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.address,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        logger.error('Non-JSON response from KYC API', undefined, { 
          responseText: text.substring(0, 200) 
        });
        throw new Error('Server returned an invalid response. Please check if Stripe is configured.');
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error occurred', code: 'UNKNOWN_ERROR' }));
        
        // Handle specific error codes
        if (data.code === 'STRIPE_IDENTITY_NOT_ENABLED') {
          throw new Error('Stripe Identity is not enabled. Please contact support to enable KYC verification.');
        }
        
        if (data.code === 'STRIPE_NOT_CONFIGURED') {
          throw new Error('KYC verification is not configured. Please contact support.');
        }
        
        if (data.code === 'STRIPE_AUTH_ERROR') {
          throw new Error('Stripe authentication failed. Please contact support.');
        }
        
        throw new Error(data.error || `Failed to create verification session (${response.status})`);
      }

      const data = await response.json();
      
      logger.info('KYC verification session response', { 
        hasSessionId: !!data.verificationSessionId,
        hasClientSecret: !!data.clientSecret,
        clientSecretPrefix: data.clientSecret?.substring(0, 10),
      });
      
      if (!data.verificationSessionId || !data.clientSecret) {
        logger.error('Missing verification session data', undefined, { data });
        throw new Error('Invalid response from server: missing session ID or client secret. Please try again.');
      }
      
      // Validate clientSecret format (should start with vs_)
      if (!data.clientSecret.startsWith('vs_')) {
        logger.error('Invalid clientSecret format', undefined, { 
          clientSecret: data.clientSecret.substring(0, 20),
          fullLength: data.clientSecret.length,
        });
        throw new Error('Invalid verification session format. Please try again.');
      }

      logger.info('Setting verification session', { 
        sessionId: data.verificationSessionId,
        clientSecretPrefix: data.clientSecret.substring(0, 10),
      });

      setVerificationSessionId(data.verificationSessionId);
      setClientSecret(data.clientSecret);
      setStatus('processing');
      
      // Update KYC status to processing
      updateKYCStatus(user.address, {
        verified: false,
        verificationId: data.verificationSessionId,
        provider: 'stripe',
        status: 'processing',
        verificationDate: Date.now(),
      });
    } catch (err: unknown) {
      const { message } = handleError(err);
      logger.error('KYC Verification Error', err, { userId: user?.address });
      const errorMessage = message || 'Failed to initialize verification. Please try again later.';
      setError(errorMessage);
      setStatus('failed');
      showError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.address, showError, onError]);

  const checkVerificationStatus = useCallback(async () => {
    if (!verificationSessionId || !user?.address) return;

    try {
      const response = await fetch('/api/kyc/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationSessionId }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        logger.error('Non-JSON response from KYC check-status', undefined, { 
          responseText: text.substring(0, 200) 
        });
        return; // Don't throw, just skip this check
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        logger.error('Failed to check verification status', undefined, { error: data.error });
        return; // Don't throw, just skip this check
      }

      const data = await response.json();

      if (data.verified) {
        // Update user profile with KYC status
        updateKYCStatus(user.address, {
          verified: true,
          verificationId: verificationSessionId,
          provider: 'stripe',
          status: 'verified',
          verificationDate: Date.now(),
        });

        setStatus('verified');
        showSuccess('Identity verification completed successfully!');
        onComplete?.();
      } else if (data.status === 'failed' || data.status === 'canceled' || data.status === 'expired') {
        updateKYCStatus(user.address, {
          verified: false,
          verificationId: verificationSessionId,
          provider: 'stripe',
          status: data.status,
          verificationDate: Date.now(),
        });
        setStatus('failed');
        setError(`Verification ${data.status}. Please try again.`);
        showError(`Verification ${data.status}. Please try again.`);
      } else if (data.status === 'requires_input') {
        updateKYCStatus(user.address, {
          verified: false,
          verificationId: verificationSessionId,
          provider: 'stripe',
          status: data.status,
          verificationDate: Date.now(),
        });
        setStatus('requires_input');
        // Optionally, show a message to the user that more input is needed
      } else if (data.status === 'processing') {
        setStatus('processing');
      }
    } catch (err: unknown) {
      logger.error('Error checking verification status', err, { userId: user?.address });
      // Don't show error to user, just log it
    }
  }, [verificationSessionId, user?.address, onComplete, showSuccess, showError]);

  // Poll for verification status every 3 seconds
  useEffect(() => {
    if (!verificationSessionId || !user?.address || status === 'verified') return;

    const interval = setInterval(() => {
      checkVerificationStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [verificationSessionId, user?.address, status, checkVerificationStatus]);

  // If already verified, show success message
  if (status === 'verified') {
    return (
      <div className="p-8 text-center bg-primary-gray rounded-xl border border-primary-gray-light">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Verified</h3>
        <p className="text-primary-gray-lighter mb-4">
          Your identity has been verified successfully.
        </p>
        {user?.address && getKYCStatus(user.address)?.verificationDate && (
          <p className="text-sm text-primary-gray-lighter">
            Verified on {new Date(getKYCStatus(user.address)!.verificationDate!).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-yellow mx-auto mb-4"></div>
        <p className="text-primary-gray-lighter">Preparing verification...</p>
      </div>
    );
  }

  if (error && status === 'failed') {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div className="flex items-start gap-3 mb-4">
          <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-red-400 mb-1">Verification Error</h3>
            <p className="text-red-300 text-sm">{error}</p>
            {error.includes('Stripe') && (
              <p className="text-red-300/80 text-xs mt-2">
                KYC verification is currently being set up. Please contact support or try again later.
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setError(null);
            setStatus('idle');
            createVerificationSession();
          }}
          className="px-4 py-2 bg-accent-yellow text-black rounded-lg hover:bg-accent-yellow-light font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!clientSecret && status !== 'processing') {
    return (
      <div className="p-6 bg-primary-gray rounded-xl border border-primary-gray-light">
        <p className="text-primary-gray-lighter">Unable to load verification session. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1 text-blue-400">What to expect:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-200">
              <li>Have a valid ID document ready (passport, driver's license, or ID card)</li>
              <li>You'll need to take a selfie to match your ID</li>
              <li>The process typically takes 1-2 minutes</li>
              <li>We use bank-level security to protect your data</li>
            </ul>
          </div>
        </div>
      </div>

      {clientSecret && clientSecret.startsWith('vs_') ? (
        <div className="bg-primary-gray rounded-xl border border-primary-gray-light p-6">
          <iframe
            key={clientSecret} // Force re-render if clientSecret changes
            src={`https://verify.stripe.com/start/${clientSecret}`}
            className="w-full h-[600px] border-0 rounded-lg"
            title="Identity Verification"
            allow="camera"
            onError={() => {
              logger.error('Failed to load Stripe Identity iframe', undefined, { clientSecret: clientSecret.substring(0, 20) });
              setError('Failed to load verification form. Please check if Stripe Identity is enabled and try again.');
              setStatus('failed');
            }}
            onLoad={() => {
              logger.info('Stripe Identity iframe loaded successfully', { clientSecret: clientSecret.substring(0, 20) });
            }}
          />
        </div>
      ) : (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-1">Invalid Verification Session</h3>
              <p className="text-red-300 text-sm">
                The verification session could not be initialized. Please try again or contact support if the problem persists.
              </p>
              <button
                onClick={() => {
                  setClientSecret(null);
                  setVerificationSessionId(null);
                  setStatus('idle');
                  createVerificationSession();
                }}
                className="mt-4 px-4 py-2 bg-accent-yellow text-black rounded-lg hover:bg-accent-yellow-light font-medium transition-colors"
              >
                Retry Verification
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-primary-gray-lighter">
        <p>Verification is handled securely by Stripe Identity</p>
        <p className="mt-1">We never see or store your ID documents</p>
      </div>

      {status === 'processing' && (
        <div className="bg-primary-gray-light border border-primary-gray-light rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <p className="text-sm text-primary-gray-lighter">Verification status is being checked automatically...</p>
            </div>
          </div>
        </div>
      )}

      {status === 'requires_input' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-yellow-300">
              <p className="font-semibold mb-1 text-yellow-400">Additional Information Required</p>
              <p className="text-yellow-200">Please complete the verification form above. Additional information may be needed to verify your identity.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

