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

    // Try to find user first - check by address, email, or wallet
    let user = null;
    
    if (address) {
      // First, try to find by address directly
      user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() },
      });
      
      // If not found and it's a wallet address, check if it's linked to any user via Wallet table
      if (!user && address.startsWith('0x')) {
        const wallet = await prisma.wallet.findFirst({
          where: { address: address.toLowerCase() },
          include: { user: true },
        });
        if (wallet?.user) {
          user = wallet.user;
        }
      }
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
          // For wallet-based auth, check if there's a user with this email already
          // If user added email to their wallet profile, we should use that profile
          if (email) {
            const existingUserWithEmail = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: email.toLowerCase() },
                  { address: email.toLowerCase() },
                ],
              },
            });
            
            if (existingUserWithEmail) {
              // Link wallet to existing user profile
              const existingWallet = await prisma.wallet.findFirst({
                where: {
                  address: address.toLowerCase(),
                },
              });
              
              if (existingWallet) {
                // Update existing wallet to link to this user
                await prisma.wallet.update({
                  where: { id: existingWallet.id },
                  data: {
                    userId: existingUserWithEmail.id,
                    type: 'metamask',
                  },
                });
              } else {
                // Create new wallet link
                await prisma.wallet.create({
                  data: {
                    userId: existingUserWithEmail.id,
                    type: 'metamask',
                    address: address.toLowerCase(),
                  },
                });
              }
              user = existingUserWithEmail;
            }
          }
          
          // If no existing user found, create new profile
          if (!user) {
            const username = `user_${address.slice(2, 8)}`;
            const profile = await initializeProfileInDB(address.toLowerCase(), username);
            if (profile) {
              user = await prisma.user.findUnique({
                where: { address: address.toLowerCase() },
              });
            }
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
      
      // If user logged in with wallet and has email, link wallet to user profile
      if (address && address.startsWith('0x') && email) {
        // Check if wallet is already linked
        const existingWallet = await prisma.wallet.findFirst({
          where: { address: address.toLowerCase() },
        });
        
        if (!existingWallet || existingWallet.userId !== user.id) {
          // Link wallet to this user
          if (existingWallet) {
            // Update existing wallet to link to this user
            await prisma.wallet.update({
              where: { id: existingWallet.id },
              data: {
                userId: user.id,
                type: 'metamask',
              },
            });
          } else {
            // Create new wallet link
            await prisma.wallet.create({
              data: {
                userId: user.id,
                type: 'metamask',
                address: address.toLowerCase(),
              },
            });
          }
        }
      }
      
      // If user logged in with wallet (no email), check if wallet is linked to user with email
      if (address && address.startsWith('0x') && !email && !user.email) {
        const wallet = await prisma.wallet.findFirst({
          where: { address: address.toLowerCase() },
          include: { user: true },
        });
        
        // If wallet is linked to a user with email, use that user instead
        if (wallet?.user && wallet.user.email) {
          user = wallet.user;
        }
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

