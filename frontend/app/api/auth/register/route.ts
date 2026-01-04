import { NextRequest, NextResponse } from 'next/server';
import { initializeProfileInDB } from '@/lib/db-profile-utils';
import { hashPasswordForStorage } from '@/lib/password-utils';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailLower },
          { address: emailLower },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPasswordForStorage(password);

    // Generate username from email
    const username = emailLower.split('@')[0] || `user_${Date.now()}`;

    // Create user profile
    const profile = await initializeProfileInDB(emailLower, username);

    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Update user with email, password hash, and name
    await prisma.user.update({
      where: { address: emailLower },
      data: {
        email: emailLower,
        passwordHash,
        name: name || undefined,
        emailVerified: false, // Email verification will be sent separately
      },
    });

    logger.info('User registered successfully', { email: emailLower });

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      email: emailLower,
    });
  } catch (error: unknown) {
    logger.error('Error registering user', error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register user' },
      { status: 500 }
    );
  }
}

