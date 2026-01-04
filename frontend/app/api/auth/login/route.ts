import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/password-utils';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailLower },
          { address: emailLower },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'This account was created with a wallet or Google. Please use that method to sign in.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    logger.info('User logged in successfully', { email: emailLower });

    return NextResponse.json({
      success: true,
      address: user.address,
      email: user.email,
      name: user.name,
      authType: 'email',
    });
  } catch (error: unknown) {
    logger.error('Error logging in user', error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to login' },
      { status: 500 }
    );
  }
}

