import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserProfileFromDB, getUserProfileByEmailFromDB, setEmailVerifiedInDB } from '@/lib/db-profile-utils';

/**
 * API Route to send email verification
 * 
 * Supports multiple email services:
 * - Resend (recommended for production)
 * - Console logging (for development when no API key is set)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email and userId are required' },
        { status: 400 }
      );
    }

    // Get user profile (by userId or email)
    let profile = await getUserProfileFromDB(userId);
    if (!profile) {
      profile = await getUserProfileByEmailFromDB(email);
    }
    
    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const verificationUrl = `${request.nextUrl.origin}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    const resendApiKey = process.env.RESEND_API_KEY;

    // Log configuration status (without exposing the key)
    console.log('Email sending configuration:', {
      hasResendKey: !!resendApiKey,
      keyLength: resendApiKey?.length || 0,
      keyPrefix: resendApiKey?.substring(0, 7) || 'none',
      nodeEnv: process.env.NODE_ENV,
    });

    // Try to send via Resend if API key is configured
    if (resendApiKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        
        const { data, error } = await resend.emails.send({
          from: `El Toro Negro <${fromEmail}>`,
          to: [email],
          subject: 'Verify your email address',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #fbbf24; margin: 0; font-size: 28px;">El Toro Negro</h1>
                  <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 14px;">Investment platform for people, for the future</p>
                </div>
                
                <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h2 style="color: #000; margin-top: 0;">Verify Your Email Address</h2>
                  <p style="color: #666;">Thank you for registering with El Toro Negro. Please verify your email address by clicking the button below:</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; background: #fbbf24; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Verify Email Address</a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px; margin-top: 30px;">Or copy and paste this link into your browser:</p>
                  <p style="color: #0066cc; font-size: 12px; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
                  
                  <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                    This link will expire in 24 hours. If you didn't create an account with El Toro Negro, please ignore this email.
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                  <p>&copy; ${new Date().getFullYear()} El Toro Negro. All rights reserved.</p>
                </div>
              </body>
            </html>
          `,
          text: `Verify your email address for El Toro Negro\n\nClick this link to verify: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
        });

        if (error) {
          console.error('Resend error details:', {
            message: error.message,
            name: error.name,
            statusCode: (error as any).statusCode,
            fullError: error,
          });
          // Provide more detailed error message
          const errorMessage = error.message || 'Unknown error';
          throw new Error(`Failed to send email via Resend: ${errorMessage}. Please check your RESEND_API_KEY and domain configuration.`);
        }

        console.log('Email sent successfully via Resend:', {
          emailId: data?.id,
          to: email,
          from: fromEmail,
        });

        // Save verification token to database
        // userId is the user's address/identifier
        await setEmailVerifiedInDB(userId, false, token);

        // Return success (don't return token for security)
        return NextResponse.json({
          success: true,
          message: 'Verification email sent successfully',
          // Only return token in development for testing
          ...(process.env.NODE_ENV === 'development' && {
            token,
            verificationUrl,
          }),
        });
      } catch (emailError: any) {
        console.error('Error sending email via Resend:', emailError);
        // Fall through to console logging mode if Resend fails
      }
    }

    // Fallback: Log to console for development (when no API key is set)
    console.log('\n=== EMAIL VERIFICATION (Development Mode) ===');
    console.log('To:', email);
    console.log('Verification URL:', verificationUrl);
    console.log('Token:', token);
    console.log('=============================================\n');
    console.log('⚠️  Email service not configured. To enable real email sending:');
    console.log('1. Sign up at https://resend.com');
    console.log('2. Get your API key from dashboard');
    console.log('3. Add RESEND_API_KEY=your_key_here to .env.local in the root directory');
    console.log('4. (Optional) Add RESEND_FROM_EMAIL=your-verified-domain@yourdomain.com');
    console.log('5. Restart the development server after adding the key\n');

    // Save verification token to database even in development mode
    // userId is the user's address/identifier
    await setEmailVerifiedInDB(userId, false, token);

    // Return token for development (so frontend can test verification flow)
    return NextResponse.json({
      success: true,
      message: 'Verification email would be sent (development mode - check console)',
      token, // Only in development
      verificationUrl, // Only in development
      developmentMode: true,
    });
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
