'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Client-side page to handle Google OAuth callback
 * Extracts access_token from URL hash and fetches user info
 */
export default function GoogleCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract access_token from URL hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        // Clear hash from URL immediately to prevent issues
        if (typeof window !== 'undefined' && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        if (error) {
          const errorMsg = errorDescription || error;
          router.push(`/?error=${encodeURIComponent(errorMsg)}`);
          return;
        }

        if (!accessToken) {
          router.push('/?error=no_access_token');
          return;
        }

        // Fetch user info from Google API
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info from Google');
        }

        const userInfo = await userInfoResponse.json();

        // Create session data
        const sessionData = {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.id,
          authType: 'google',
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        };

        // Store session in sessionStorage BEFORE redirecting
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('google_session', JSON.stringify(sessionData));
        }

        // Small delay to ensure sessionStorage is written before redirect
        // Use window.location instead of router.push to ensure a full page reload
        // This ensures AuthContext re-checks sessionStorage on the new page
        await new Promise(resolve => setTimeout(resolve, 50));
        window.location.href = '/dashboard';
      } catch (error: any) {
        console.error('Error handling Google callback:', error);
        router.push(`/?error=${encodeURIComponent(error.message || 'Failed to complete Google Sign-In')}`);
      }
    };

    handleCallback();
  }, [router]);

  // Show loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-yellow mx-auto mb-4"></div>
        <p className="text-white">Completing Google Sign-In...</p>
      </div>
    </div>
  );
}

