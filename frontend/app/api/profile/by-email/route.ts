import { NextRequest, NextResponse } from 'next/server';
import { getUserProfileByEmailFromDB } from '@/lib/db-profile-utils';
import { emailQuerySchema } from '@/lib/validation-schemas';
import { logger } from '@/lib/logger';

/**
 * GET /api/profile/by-email?email=...
 * Get user profile by email
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // Validate email
    const validationResult = emailQuerySchema.safeParse({ email });
    if (!validationResult.success) {
      logger.warn('Invalid email parameter', { email, errors: validationResult.error.issues });
      return NextResponse.json(
        { error: 'Invalid email format', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedEmail = validationResult.data.email;

    // Try to get profile by email field first
    let profile = await getUserProfileByEmailFromDB(validatedEmail);

    // If not found, try by address (for Google auth users, email is stored as address)
    if (!profile) {
      const { getUserProfileFromDB } = await import('@/lib/db-profile-utils');
      profile = await getUserProfileFromDB(validatedEmail);
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error: unknown) {
    logger.error('Error fetching profile by email', error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

