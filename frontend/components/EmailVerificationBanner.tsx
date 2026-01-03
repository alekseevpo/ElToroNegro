'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';

/**
 * Banner to prompt users to verify their email
 * For Google auth users: email is already verified, so don't show
 * For wallet users without email: prompt to add email for account recovery
 * For wallet users with unverified email: prompt to verify email
 */
export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.address || null);
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  // Don't show for Google auth users - their email is already verified
  if (user?.authType === 'google') {
    return null;
  }

  // For wallet users, check if they have an email
  const hasEmail = profile?.email && profile.email.length > 0;
  const emailToVerify = profile?.email;

  // Check dismissal state from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.address) {
      const dismissedKey = `email_verification_dismissed_${user.address}`;
      const isDismissed = sessionStorage.getItem(dismissedKey) === 'true';
      setDismissed(isDismissed);
    }
  }, [user?.address]);

  // Don't show if no user or dismissed
  if (!user || dismissed) {
    return null;
  }

  // If user has email, check if it's verified
  if (hasEmail) {
    const isVerified = profile?.emailVerified || false;
    
    // Don't show if already verified
    if (isVerified) {
      return null;
    }

    // Show verification banner for wallet users with unverified email
    return <EmailVerificationContent 
      email={emailToVerify || ''}
      userId={user.address}
      profile={profile}
      loading={loading}
      verificationUrl={verificationUrl}
      setLoading={setLoading}
      setVerificationUrl={setVerificationUrl}
      showSuccess={showSuccess}
      showError={showError}
      onDismiss={() => {
        setDismissed(true);
        if (typeof window !== 'undefined' && user.address) {
          sessionStorage.setItem(`email_verification_dismissed_${user.address}`, 'true');
        }
      }}
    />;
  }

  // For wallet users without email - show prompt to add email
  return <EmailPromptBanner 
    userId={user.address}
    onDismiss={() => {
      setDismissed(true);
      if (typeof window !== 'undefined' && user.address) {
        sessionStorage.setItem(`email_verification_dismissed_${user.address}`, 'true');
      }
    }}
  />;
}

/**
 * Banner prompting wallet users to add email for account recovery
 */
function EmailPromptBanner({ userId, onDismiss }: { userId: string; onDismiss: () => void }) {
  return (
    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-400 mb-1">Add Email for Account Recovery</h3>
            <p className="text-sm text-yellow-300/80 mb-3">
              We recommend adding your email address to your profile. This will help you recover your account if you lose access to your wallet. You can also fill out your profile information for better account security.
            </p>
            <div className="flex gap-2">
              <a
                href="/dashboard?tab=profileSettings"
                className="inline-block px-4 py-2 bg-yellow-500 text-black text-sm font-medium rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Add Email & Complete Profile
              </a>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-yellow-400/60 hover:text-yellow-400 transition-colors"
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

/**
 * Email verification content for users with email but not verified
 */
function EmailVerificationContent({
  email,
  userId,
  profile,
  loading,
  verificationUrl,
  setLoading,
  setVerificationUrl,
  showSuccess,
  showError,
  onDismiss,
}: {
  email: string;
  userId: string;
  profile: any;
  loading: boolean;
  verificationUrl: string | null;
  setLoading: (loading: boolean) => void;
  setVerificationUrl: (url: string | null) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  onDismiss: () => void;
}) {
  const handleSendVerification = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
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
        setVerificationUrl(data.verificationUrl || `${window.location.origin}/verify-email?token=${data.token}&email=${encodeURIComponent(email)}`);
        showSuccess('Verification link generated (dev mode). See link below.');
      } else {
        // Production mode - email was sent via Resend
        showSuccess('Verification email sent! Please check your inbox and spam folder.');
      }
    } catch (error: unknown) {
      const { message } = handleError(error);
      logger.error('Error sending verification email', error, { email, userId });
      showError(message || 'Failed to send verification email');
    } finally {
      setLoading(false);
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
              Please verify your email address ({email}) to unlock all features and receive important notifications.
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
          onClick={onDismiss}
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
