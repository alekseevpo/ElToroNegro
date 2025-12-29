import { NextRequest, NextResponse } from 'next/server';
import { getUserProfileByEmailFromDB } from '@/lib/db-profile-utils';

/**
 * GET /api/profile/by-email?email=...
 * Get user profile by email
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Try to get profile by email field first
    let profile = await getUserProfileByEmailFromDB(email);

    // If not found, try by address (for Google auth users, email is stored as address)
    if (!profile) {
      const { getUserProfileFromDB } = await import('@/lib/db-profile-utils');
      profile = await getUserProfileFromDB(email);
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Error fetching profile by email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

