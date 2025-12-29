import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth Callback Route
 * Handles Implicit Flow (response_type=token)
 * Since we're using Implicit Flow, the access_token will be in the URL hash (#access_token=...)
 * Hash fragments are only available client-side, so we redirect to a client-side handler page
 */
export async function GET(request: NextRequest) {
  // Redirect to client-side handler page
  // The hash fragment will be preserved and can be accessed client-side
  return NextResponse.redirect(new URL('/api/auth/google/handle-callback', request.url));
}

