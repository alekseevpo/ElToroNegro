'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateKYCStatus } from '@/lib/profile-utils';

interface KYCVerificationProps {
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export default function KYCVerification({ onComplete, onError }: KYCVerificationProps) {
  const { user } = useAuth();
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.address) {
      createVerificationSession();
    }
  }, [user]);

  const createVerificationSession = async () => {
    if (!user?.address) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/kyc/create-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.address,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create verification session');
      }

      const data = await response.json();
      setVerificationSessionId(data.verificationSessionId);
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize verification';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!verificationSessionId || !user?.address) return;

    try {
      const response = await fetch('/api/kyc/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationSessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to check verification status');
      }

      const data = await response.json();

      if (data.verified) {
        // Update user profile with KYC status
        updateKYCStatus(user.address, {
          verified: true,
          verificationId: verificationSessionId,
          provider: 'stripe',
          status: 'verified',
        });

        onComplete?.();
      }
    } catch (err: any) {
      console.error('Error checking verification status:', err);
    }
  };

  // Poll for verification status every 3 seconds
  useEffect(() => {
    if (!verificationSessionId) return;

    const interval = setInterval(() => {
      checkVerificationStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [verificationSessionId]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Preparing verification...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={createVerificationSession}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
        <p className="text-gray-600">Unable to load verification session</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">What to expect:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Have a valid ID document ready (passport, driver's license, or ID card)</li>
              <li>You'll need to take a selfie to match your ID</li>
              <li>The process typically takes 1-2 minutes</li>
              <li>We use bank-level security to protect your data</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <iframe
          src={`https://verify.stripe.com/start/${clientSecret}`}
          className="w-full h-[600px] border-0 rounded-lg"
          title="Identity Verification"
        />
      </div>

      <div className="text-center text-sm text-gray-600">
        <p>Verification is handled securely by Stripe Identity</p>
        <p className="mt-1">We never see or store your ID documents</p>
      </div>
    </div>
  );
}

