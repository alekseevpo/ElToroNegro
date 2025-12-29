'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
// Email verification is handled via API, no need for localStorage
import Link from 'next/link';

/**
 * Email Verification Page
 * Handles email verification token from verification link
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');

  // Log when component mounts
  useEffect(() => {
    console.log('🟢 VerifyEmailPage component mounted');
    console.log('🔍 Initial state:', {
      status,
      hasSearchParams: !!searchParams,
      token: searchParams?.get('token') ? 'present' : 'missing',
      email: searchParams?.get('email') ? 'present' : 'missing',
    });
  }, []);

  useEffect(() => {
    console.log('🔵 Email verification page - useEffect triggered', {
      loading,
      hasUser: !!user,
      userConnected: user?.isConnected,
      searchParams: searchParams ? {
        token: searchParams.get('token') ? 'present' : 'missing',
        email: searchParams.get('email') ? 'present' : 'missing',
      } : 'null',
    });

    // Wait for auth to finish loading
    if (loading) {
      console.log('⏳ Waiting for auth to finish loading...');
      return;
    }

    const verifyEmail = async () => {
      console.log('🚀 Starting email verification process...');
      
      const token = searchParams?.get('token');
      const emailParam = searchParams?.get('email');
      
      console.log('📧 Verification params:', {
        hasToken: !!token,
        tokenLength: token?.length,
        hasEmail: !!emailParam,
        email: emailParam,
      });

      if (!token || !emailParam) {
        console.error('❌ Missing verification params:', { token: !!token, email: !!emailParam });
        setStatus('error');
        setMessage('Invalid verification link. Missing token or email.');
        return;
      }
      
      console.log('✅ Verification params are present, proceeding...');

      // Normalize email from URL (lowercase, trim)
      // searchParams.get() already decodes URL-encoded values, so we don't need decodeURIComponent
      // But if emailParam is already decoded and contains %40, try to decode it once
      let email: string = emailParam;
      
      // If email contains URL-encoded characters (like %40 for @), decode it
      if (email.includes('%')) {
        try {
          email = decodeURIComponent(email);
        } catch (e) {
          // If decoding fails, use as-is
          console.warn('Failed to decode email parameter:', e);
        }
      }
      
      // Normalize: lowercase and trim
      email = email.toLowerCase().trim();
      
      // Email verification should work with just token and email
      // No need to check authentication - the token itself is the proof
      // But we can optionally verify that the email matches if user is logged in
      
      let userEmail: string | undefined;
      let userId: string | undefined;

      // If user is authenticated, check if email matches
      if (user) {
        if (user.authType === 'google') {
          // For Google auth, user.address contains the email
          userEmail = user.address?.toLowerCase().trim();
          userId = user.address;
        } else if (user.address?.includes('@')) {
          // User address is an email
          userEmail = user.address.toLowerCase().trim();
          userId = user.address;
        } else {
          // For wallet auth, try to get profile from API
          try {
            const profileResponse = await fetch(`/api/profile/${user.address}`);
            if (profileResponse.ok) {
              const profile = await profileResponse.json();
              userEmail = profile?.email?.toLowerCase().trim();
              userId = user.address;
            }
          } catch (e) {
            console.warn('Could not fetch profile for verification:', e);
          }
        }
      }

      // Try to get profile by email from API (works even if not authenticated)
      if (!userEmail) {
        try {
          const profileResponse = await fetch(`/api/profile/by-email?email=${encodeURIComponent(email)}`);
          if (profileResponse.ok) {
            const profile = await profileResponse.json();
            userEmail = profile?.email?.toLowerCase().trim();
            userId = profile?.address || email; // Use address from profile or email as fallback
          }
        } catch (e) {
          console.warn('Could not fetch profile by email:', e);
        }
      }

      // If we still don't have userId, use email as userId (for email-based profiles)
      if (!userId) {
        userId = email;
      }

      console.log('Email verification check:', { 
        emailFromUrl: email, 
        emailFromUrlRaw: emailParam,
        userEmail, 
        userAddress: user?.address, 
        authType: user?.authType,
        userId,
        matches: userEmail ? userEmail === email : 'no user email to compare'
      });

      // Optional: If user is authenticated and email doesn't match, warn but don't block
      if (user && userEmail && userEmail !== email) {
        console.warn('Email mismatch but proceeding with verification:', { 
          expected: email, 
          found: userEmail, 
          userAddress: user?.address, 
          authType: user?.authType 
        });
        // Don't block - token verification will handle it
      }

      try {
        console.log('📤 Sending verification request to API...');
        
        // Verify token with backend
        const response = await fetch('/api/email/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            email,
          }),
        });

        console.log('📥 API response received:', {
          status: response.status,
          ok: response.ok,
        });

        const data = await response.json();
        
        console.log('📦 API response data:', {
          verified: data.verified,
          success: data.success,
          error: data.error,
        });

        if (!response.ok) {
          console.error('❌ Verification failed:', data.error || 'Unknown error');
          throw new Error(data.error || 'Verification failed');
        }
        
        // Check if already verified
        if (data.alreadyVerified) {
          console.log('✅ Email is already verified');
          setStatus('success');
          setMessage('Your email is already verified!');
        } else if (data.verified) {
          console.log('✅ Email verification successful!');
        } else {
          throw new Error(data.error || 'Verification failed');
        }

        // Profile is updated in database via API, no need to update localStorage

        setStatus('success');
        setMessage('Your email has been verified successfully!');
        
        // Debug: Check session before redirect
        if (typeof window !== 'undefined') {
          const googleSessionStr = sessionStorage.getItem('google_session');
          console.log('🔍 Email verification - Session check:', {
            hasSession: !!googleSessionStr,
            sessionLength: googleSessionStr?.length || 0,
            currentUser: user ? { address: user.address, isConnected: user.isConnected, authType: user.authType } : null,
          });
          
          if (googleSessionStr) {
            try {
              const googleSession = JSON.parse(googleSessionStr);
              const isExpired = googleSession.expiresAt <= Date.now();
              console.log('🔍 Session details:', {
                email: googleSession.email,
                expiresAt: new Date(googleSession.expiresAt).toISOString(),
                isExpired,
                timeUntilExpiry: googleSession.expiresAt - Date.now(),
              });
            } catch (e) {
              console.error('❌ Error parsing session:', e);
            }
          }
        }
        
        // Wait a moment to show success message, then redirect
        // Always use window.location.href for full page reload to ensure AuthContext re-initializes
        console.log('⏰ Setting up redirect timer (2 seconds)...');
        setTimeout(() => {
          console.log('🔄 Redirect timer fired, checking session...');
          
          // Check if session exists before redirecting
          if (typeof window !== 'undefined') {
            const googleSessionStr = sessionStorage.getItem('google_session');
            if (googleSessionStr) {
              try {
                const googleSession = JSON.parse(googleSessionStr);
                if (googleSession.expiresAt > Date.now()) {
                  console.log('✅ Session is valid, redirecting to dashboard NOW');
                  console.log('🚀 Executing: window.location.href = "/dashboard"');
                  // Full page reload to ensure AuthContext re-initializes
                  window.location.href = '/dashboard';
                  return;
                } else {
                  console.warn('⚠️ Session expired at:', new Date(googleSession.expiresAt).toISOString());
                  console.warn('⚠️ Current time:', new Date().toISOString());
                }
              } catch (e) {
                console.error('❌ Error parsing session:', e);
              }
            } else {
              console.warn('⚠️ No Google session found in sessionStorage');
              console.warn('⚠️ Available sessionStorage keys:', Object.keys(sessionStorage));
            }
          }
          
          // If no valid session, still redirect (user will need to log in)
          console.log('⚠️ Redirecting to dashboard without valid session (user may need to log in)');
          console.log('🚀 Executing: window.location.href = "/dashboard"');
          window.location.href = '/dashboard';
        }, 2000);
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. The link may be expired or invalid.');
      }
    };

    verifyEmail();
  }, [searchParams, user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full bg-primary-gray rounded-2xl p-8 border border-primary-gray-light">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-yellow mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Email</h1>
            <p className="text-primary-gray-lighter">Please wait while we verify your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-primary-gray-lighter mb-6">{message}</p>
            <p className="text-sm text-primary-gray-lighter">Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-primary-gray-lighter mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="block w-full py-3 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/dashboard?tab=profile"
                className="block w-full py-3 bg-primary-gray-light text-white font-medium rounded-lg hover:bg-primary-gray-light/80 transition-colors"
              >
                Resend Verification Email
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

