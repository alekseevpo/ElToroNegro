import { NextRequest, NextResponse } from 'next/server';
import { getUserProfileByEmailFromDB, setEmailVerifiedInDB } from '@/lib/db-profile-utils';
import { prisma } from '@/lib/db';

/**
 * API Route to verify email token
 */
export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      );
    }

    // Validate token format
    if (token.length < 32) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    // Get user directly from database to access emailVerificationToken
    // Try by email first, then by address (for Google auth users, email is stored as address)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { address: email.toLowerCase() },
        ],
      },
      select: {
        id: true,
        email: true,
        address: true,
        emailVerificationToken: true,
        emailVerificationSentAt: true,
        emailVerified: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      console.log('✅ Email is already verified');
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Email is already verified',
        alreadyVerified: true,
      });
    }

    // Verify token matches
    const storedToken = user.emailVerificationToken;
    console.log('Token verification:', {
      hasStoredToken: !!storedToken,
      storedTokenLength: storedToken?.length || 0,
      receivedTokenLength: token?.length || 0,
      storedTokenPrefix: storedToken ? `${storedToken.substring(0, 20)}...` : 'null',
      receivedTokenPrefix: token ? `${token.substring(0, 20)}...` : 'null',
      tokensMatch: storedToken === token,
    });
    
    if (!storedToken || storedToken !== token) {
      console.error('❌ Token mismatch:', {
        stored: storedToken ? `${storedToken.substring(0, 20)}...` : 'null',
        received: token ? `${token.substring(0, 20)}...` : 'null',
        storedLength: storedToken?.length || 0,
        receivedLength: token?.length || 0,
        match: storedToken === token
      });
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }
    
    console.log('✅ Token matches!');

    // Check if token is expired (24 hours)
    if (user.emailVerificationSentAt) {
      const expirationTime = user.emailVerificationSentAt.getTime() + (24 * 60 * 60 * 1000);
      if (Date.now() > expirationTime) {
        return NextResponse.json(
          { error: 'Verification token has expired' },
          { status: 400 }
        );
      }
    }

    // Mark email as verified (use email as identifier)
    const updatedProfile = await setEmailVerifiedInDB(email, true);
    
    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify email' },
      { status: 500 }
    );
  }
}

