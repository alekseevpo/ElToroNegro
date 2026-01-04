import { NextRequest, NextResponse } from 'next/server';
import { getUserProfileFromDB } from '@/lib/db-profile-utils';
import { addressParamSchema } from '@/lib/validation-schemas';
import { logger } from '@/lib/logger';

/**
 * GET /api/profile/[address]
 * Get user profile by address
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    // Validate address
    const validationResult = addressParamSchema.safeParse({ address });
    if (!validationResult.success) {
      logger.warn('Invalid address parameter', { address, errors: validationResult.error.issues });
      return NextResponse.json(
        { error: 'Invalid address format', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedAddress = validationResult.data.address;

    const profile = await getUserProfileFromDB(validatedAddress);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error: unknown) {
    logger.error('Error fetching profile', error as Error, { address: params.address });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

