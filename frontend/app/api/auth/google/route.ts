import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route to initiate Google OAuth flow
 * Redirects user to Google OAuth authorization page
 * Uses Implicit Flow (response_type=token) which doesn't require client_secret
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    // Use the client-side handler page directly since hash fragments are only available client-side
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/handle-callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth is not configured' },
        { status: 500 }
      );
    }

    // Build Google OAuth URL with Implicit Flow (token response type)
    // This doesn't require client_secret
    // Note: redirect_uri must match exactly what's configured in Google Cloud Console
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token', // Use token instead of code for implicit flow
      scope: 'openid email profile',
      // Don't use prompt to allow Google to remember user's choice and avoid double auth
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Redirect to Google OAuth page
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Sign-In' },
      { status: 500 }
    );
  }
}

