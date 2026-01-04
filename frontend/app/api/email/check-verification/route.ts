import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/email/check-verification?email=...
 * Check email verification status for a user
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Try to find user by email or address (for Google auth, email is stored as address)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { address: normalizedEmail },
        ],
      },
      select: {
        id: true,
        address: true,
        email: true,
        username: true,
        emailVerified: true,
        emailVerificationToken: true,
        emailVerificationSentAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        exists: false,
        verified: false,
        message: 'User profile not found. User needs to log in first to create profile.',
      });
    }

    return NextResponse.json({
      exists: true,
      verified: user.emailVerified || false,
      email: user.email || user.address,
      username: user.username,
      hasVerificationToken: !!user.emailVerificationToken,
      verificationSentAt: user.emailVerificationSentAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      message: user.emailVerified 
        ? 'Email is verified' 
        : user.emailVerificationToken 
          ? 'Verification email was sent, but email is not yet verified'
          : 'Email verification has not been requested yet',
    });
  } catch (error: unknown) {
    logger.error('Error checking email verification status', error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check verification status' },
      { status: 500 }
    );
  }
}

