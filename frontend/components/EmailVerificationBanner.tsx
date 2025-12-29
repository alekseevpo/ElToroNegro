'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';

/**
 * Banner to prompt users to verify their email
 */
export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.address || null);
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  // Determine email to verify
  // For Google auth users, email is in user.address
  // For other users, email is in profile.email
  const emailToVerify = user?.authType === 'google' 
    ? user.address 
    : profile?.email;

  // Check dismissal state from sessionStorage
  useEffect(() => {
    if (emailToVerify && typeof window !== 'undefined') {
      const dismissedKey = `email_verification_dismissed_${emailToVerify}`;
      const isDismissed = sessionStorage.getItem(dismissedKey) === 'true';
      setDismissed(isDismissed);
    }
  }, [emailToVerify]);

  // Don't show if no email to verify or no user
  if (!user || !emailToVerify) {
    return null;
  }

  // Check if email is verified from profile
  const isVerified = profile?.emailVerified || false;
  
  // Don't show if already verified or dismissed
  if (isVerified || dismissed) {
    return null;
  }

  const handleSendVerification = async () => {
    if (!emailToVerify) return;

    // Use profile address if available, otherwise use user address
    const userId = profile?.address || user.address;
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToVerify,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }

      // In development mode, show console message and display URL in UI
      if (data.developmentMode && data.verificationUrl) {
        logger.info('Email verification URL (development mode)', { verificationUrl: data.verificationUrl });
        setVerificationUrl(data.verificationUrl);
        showSuccess('Verification link generated (dev mode). See link below.');
      } else if (data.token) {
        // Development mode with token
        setVerificationUrl(data.verificationUrl || `${window.location.origin}/verify-email?token=${data.token}&email=${encodeURIComponent(emailToVerify)}`);
        showSuccess('Verification link generated (dev mode). See link below.');
      } else {
        // Production mode - email was sent via Resend
        showSuccess('Verification email sent! Please check your inbox and spam folder.');
      }
    } catch (error: unknown) {
      const { message } = handleError(error);
      logger.error('Error sending verification email', error, { email: emailToVerify, userId });
      showError(message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal for this session (won't persist across page reloads)
    // Use email as key to track dismissal per email address
    if (typeof window !== 'undefined' && emailToVerify) {
      sessionStorage.setItem(`email_verification_dismissed_${emailToVerify}`, 'true');
    }
  };

  return (
    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-400 mb-1">Verify Your Email Address</h3>
            <p className="text-sm text-blue-300/80 mb-3">
              Please verify your email address ({emailToVerify}) to unlock all features and receive important notifications.
              {profile?.email && profile.email !== user.address && (
                <span className="block mt-1 text-xs text-blue-300/60">
                  (Email was updated in your profile)
                </span>
              )}
            </p>
            <button
              onClick={handleSendVerification}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : verificationUrl ? 'Resend Verification Email' : 'Send Verification Email'}
            </button>
            {profile?.emailVerificationSentAt && (
              <p className="text-xs text-blue-300/60 mt-2">
                Verification email sent {new Date(profile.emailVerificationSentAt).toLocaleTimeString()}
              </p>
            )}
            {verificationUrl && (
              <div className="mt-3 p-3 bg-black/50 rounded-lg border border-blue-500/30">
                <p className="text-xs text-blue-300/80 mb-2">Development Mode - Verification Link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={verificationUrl}
                    className="flex-1 px-2 py-1 bg-black/50 border border-blue-500/30 rounded text-xs text-white font-mono"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(verificationUrl);
                      showSuccess('Link copied to clipboard!');
                    }}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-blue-300/60 mt-2">
                  ⚠️ Email service not configured. Add RESEND_API_KEY to .env.local to send real emails.
                </p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-400/60 hover:text-blue-400 transition-colors"
          title="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

