import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { initializeProfileInDB } from '@/lib/db-profile-utils';

/**
 * POST /api/profile/heartbeat
 * Update user's last activity timestamp (for online status tracking)
 * Automatically creates profile if it doesn't exist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, email, authType, name } = body;

    if (!address && !email) {
      return NextResponse.json(
        { error: 'Address or email is required' },
        { status: 400 }
      );
    }

    // Try to find user first - check by address or email
    let user = null;
    
    if (address) {
      user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() },
      });
    }
    
    if (!user && email) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { address: email.toLowerCase() },
          ],
        },
      });
    }

    // If user doesn't exist, create a basic profile
    if (!user) {
      try {
        // For email-based auth (Google), use email as address identifier
        if (email && !address) {
          const username = email.split('@')[0] || `user_${Date.now()}`;
          const profile = await initializeProfileInDB(email.toLowerCase(), username);
          if (profile) {
            // Update email field and mark as verified for Google auth
            await prisma.user.update({
              where: { address: email.toLowerCase() },
              data: { 
                email: email.toLowerCase(),
                emailVerified: authType === 'google', // Google emails are already verified
                name: name || undefined,
              },
            });
            user = await prisma.user.findUnique({
              where: { address: email.toLowerCase() },
            });
          }
        } else if (address) {
          // For wallet-based auth, use address
          const username = `user_${address.slice(2, 8)}`;
          const profile = await initializeProfileInDB(address.toLowerCase(), username);
          if (profile) {
            user = await prisma.user.findUnique({
              where: { address: address.toLowerCase() },
            });
          }
        }
      } catch (createError) {
        logger.error('Error creating profile in heartbeat', createError as Error);
        // Continue even if profile creation fails - we'll try to update anyway
      }
    } else {
      // Update existing user - set emailVerified for Google auth users
      const updateData: { email?: string; emailVerified?: boolean; name?: string; updatedAt: Date } = {
        updatedAt: new Date(),
      };
      
      // For Google auth, mark email as verified
      if (authType === 'google' && !user.emailVerified) {
        updateData.emailVerified = true;
      }
      
      // Update email if provided and not set
      if (email && !user.email) {
        updateData.email = email.toLowerCase();
      }
      
      // Update name if provided and not set
      if (name && !user.name) {
        updateData.name = name;
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
      
      return NextResponse.json({ success: true });
    }

    // Update user's updatedAt timestamp to mark them as active
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true });
    }

    // If we still don't have a user, return error
    return NextResponse.json(
      { error: 'User not found and could not be created' },
      { status: 404 }
    );
  } catch (error: unknown) {
    logger.error('Error updating user heartbeat', error as Error);
    return NextResponse.json(
      { error: 'Failed to update heartbeat' },
      { status: 500 }
    );
  }
}

