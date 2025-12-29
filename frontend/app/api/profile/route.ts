import { NextRequest, NextResponse } from 'next/server';
import {
  initializeProfileInDB,
  saveUserProfileToDB,
  getUserProfileFromDB,
} from '@/lib/db-profile-utils';
import type { UserProfile } from '@/lib/profile-utils';

/**
 * POST /api/profile
 * Create or update user profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, username, referredBy, ...updates } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

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
  } catch (error: any) {
    console.error('Error creating/updating profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create/update profile' },
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
    const { address, ...updates } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const existingProfile = await getUserProfileFromDB(address);

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Prevent changing username, referralCode, createdAt
    const { username, referralCode, createdAt, ...allowedUpdates } = updates;

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
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

