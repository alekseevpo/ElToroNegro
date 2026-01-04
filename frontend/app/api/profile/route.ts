import { NextRequest, NextResponse } from 'next/server';
import {
  initializeProfileInDB,
  saveUserProfileToDB,
  getUserProfileFromDB,
} from '@/lib/db-profile-utils';
import type { UserProfile } from '@/lib/profile-utils';
import { profileCreateSchema, profileUpdateSchema } from '@/lib/validation-schemas';
import { logger } from '@/lib/logger';

/**
 * POST /api/profile
 * Create or update user profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = profileCreateSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Invalid profile creation request', { errors: validationResult.error.issues });
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { address, username, referredBy, ...updates } = validationResult.data;

    // Check if profile exists
    const existingProfile = await getUserProfileFromDB(address);

    if (existingProfile) {
      // Update existing profile
      if (!username || username === existingProfile.username) {
        // Partial update (username cannot be changed)
        const updatedProfile: UserProfile = {
          ...existingProfile,
          ...updates,
          username: existingProfile.username, // Preserve username
          referralCode: existingProfile.referralCode, // Preserve referral code
          createdAt: existingProfile.createdAt, // Preserve creation date
        };

        const saved = await saveUserProfileToDB(address, updatedProfile);
        
        if (!saved) {
          return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
          );
        }

        return NextResponse.json(saved);
      } else {
        return NextResponse.json(
          { error: 'Username cannot be changed' },
          { status: 400 }
        );
      }
    } else {
      // Create new profile
      if (!username) {
        return NextResponse.json(
          { error: 'Username is required for new profiles' },
          { status: 400 }
        );
      }

      const newProfile = await initializeProfileInDB(address, username, referredBy);

      if (!newProfile) {
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        );
      }

      // Apply any additional updates
      if (Object.keys(updates).length > 0) {
        const updatedProfile: UserProfile = {
          ...newProfile,
          ...updates,
        };
        const saved = await saveUserProfileToDB(address, updatedProfile);
        return NextResponse.json(saved || newProfile);
      }

      return NextResponse.json(newProfile, { status: 201 });
    }
  } catch (error: unknown) {
    logger.error('Error creating/updating profile', error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create/update profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Update user profile (alias for POST with updates only)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Invalid profile update request', { errors: validationResult.error.issues });
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { address, ...updates } = validationResult.data;

    const existingProfile = await getUserProfileFromDB(address);

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Prevent changing username, referralCode, createdAt (these fields are not in update schema, but we ensure they're not changed)
    const allowedUpdates = updates;

    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...allowedUpdates,
    };

    const saved = await saveUserProfileToDB(address, updatedProfile);

    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(saved);
  } catch (error: unknown) {
    logger.error('Error updating profile', error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    );
  }
}

