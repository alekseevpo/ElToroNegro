/**
 * Database-backed profile utilities
 * 
 * This file provides database functions that replace localStorage-based
 * profile management. It maintains the same interface as profile-utils.ts
 * for backward compatibility.
 */

import { prisma } from './db';
import type { UserProfile, Transaction, PortfolioAsset } from './profile-utils';
import type { UserWithRelations, WalletType, SocialConnectionType, TransactionType, TransactionStatus, TransactionCurrency, PaymentMethod, PortfolioAssetType, PortfolioCurrency, KYCProvider, KYCStatus } from './prisma-types';
import { isWalletType, isSocialConnectionType, isTransactionType, isTransactionStatus, isKYCProvider, isKYCStatus } from './prisma-types';
import { logger } from './logger';

/**
 * Convert Prisma User model to UserProfile interface
 */
function prismaUserToProfile(user: UserWithRelations): UserProfile {
  return {
    username: user.username,
    name: user.name || undefined,
    avatar: user.avatar || undefined,
    email: user.email || undefined,
    passwordHash: user.passwordHash || undefined,
    referralCode: user.referralCode,
    referredBy: user.referredByUser?.referralCode || undefined,
    wallets: {
      metamask: user.wallets.find((w) => w.type === 'metamask')?.address,
      ton: user.wallets.find((w) => w.type === 'ton')?.address,
      walletconnect: user.wallets.find((w) => w.type === 'walletconnect')?.address,
      coinbase: user.wallets.find((w) => w.type === 'coinbase')?.address,
      trustwallet: user.wallets.find((w) => w.type === 'trustwallet')?.address,
    },
    socialConnections: {
      twitter: user.socialConnections.find((s) => s.type === 'twitter')?.socialId,
      telegram: user.socialConnections.find((s) => s.type === 'telegram')?.socialId,
      discord: user.socialConnections.find((s) => s.type === 'discord')?.socialId,
      email: user.socialConnections.find((s) => s.type === 'email')?.socialId,
    },
    createdAt: user.createdAt.getTime(),
    referrals: user.referrals?.map((r) => r.address.toLowerCase()) || [],
    transactions: user.transactions?.map((t) => ({
      id: t.id,
      type: (isTransactionType(t.type) ? t.type : 'token_purchase') as Transaction['type'],
      status: (isTransactionStatus(t.status) ? t.status : 'pending') as Transaction['status'],
      amount: t.amount,
      currency: (t.currency as TransactionCurrency) || 'EUR',
      tokensAmount: t.tokensAmount || undefined,
      description: t.description,
      timestamp: t.timestamp.getTime(),
      txHash: t.txHash || undefined,
      paymentMethod: (t.paymentMethod as PaymentMethod) || undefined,
      stripeSessionId: t.stripeSessionId || undefined,
      metadata: (t.metadata as Record<string, unknown>) || undefined,
    })) || [],
    emailVerified: user.emailVerified,
    emailVerificationToken: user.emailVerificationToken || undefined,
    emailVerificationSentAt: user.emailVerificationSentAt?.getTime(),
    kycStatus: user.kycVerified ? {
      verified: true,
      verificationDate: user.kycVerificationDate?.getTime(),
      verificationId: user.kycVerificationId || undefined,
      provider: (user.kycProvider && isKYCProvider(user.kycProvider) ? user.kycProvider : 'stripe') as KYCProvider,
      status: (user.kycStatus && isKYCStatus(user.kycStatus) ? user.kycStatus : 'pending') as KYCStatus,
    } : undefined,
    kycHistory: user.kycHistory?.map((k) => ({
      verificationId: k.verificationId,
      provider: (isKYCProvider(k.provider) ? k.provider : 'stripe') as KYCProvider,
      status: (isKYCStatus(k.status) ? k.status : 'pending') as KYCStatus,
      verificationDate: k.verificationDate.getTime(),
      completedDate: k.completedDate?.getTime(),
      error: k.error || undefined,
    })) || [],
    portfolio: user.portfolioAssets?.map((p) => ({
      id: p.id,
      type: (p.type as PortfolioAssetType) || 'token',
      symbol: p.symbol,
      name: p.name,
      quantity: p.quantity,
      purchasePrice: p.purchasePrice,
      currentPrice: p.currentPrice,
      purchaseDate: p.purchaseDate.getTime(),
      currency: (p.currency as PortfolioCurrency) || 'EUR',
      totalCost: p.totalCost,
      totalValue: p.totalValue,
      profit: p.profit,
      profitPercent: p.profitPercent,
      interestEarned: p.interestEarned || undefined,
      interestRate: p.interestRate || undefined,
    })) || [],
  };
}

/**
 * Get user profile from database
 */
export async function getUserProfileFromDB(address: string): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      include: {
        wallets: true,
        socialConnections: true,
        transactions: {
          orderBy: { timestamp: 'desc' },
        },
        portfolioAssets: true,
        kycHistory: {
          orderBy: { verificationDate: 'desc' },
        },
        referrals: {
          select: {
            address: true,
          },
        },
        referredByUser: {
          select: {
            referralCode: true,
          },
        },
      },
    });

    if (!user) return null;

    return prismaUserToProfile(user);
  } catch (error) {
    logger.error('Error getting user profile from DB', error, { address });
    return null;
  }
}

/**
 * Get user profile by email from database
 */
export async function getUserProfileByEmailFromDB(email: string): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        wallets: true,
        socialConnections: true,
        transactions: {
          orderBy: { timestamp: 'desc' },
        },
        portfolioAssets: true,
        kycHistory: {
          orderBy: { verificationDate: 'desc' },
        },
        referrals: {
          select: {
            address: true,
          },
        },
        referredByUser: {
          select: {
            referralCode: true,
          },
        },
      },
    });

    if (!user) return null;

    return prismaUserToProfile(user);
  } catch (error) {
    logger.error('Error getting user profile by email from DB', error, { email });
    return null;
  }
}

/**
 * Save user profile to database
 */
export async function saveUserProfileToDB(address: string, profile: UserProfile): Promise<UserProfile | null> {
  try {
    const addressLower = address.toLowerCase();
    
    // Find referrer if referredBy (referral code) is provided
    let referredById: string | null = null;
    if (profile.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: profile.referredBy },
        select: { id: true },
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }
    
    // Find or create user
    const user = await prisma.user.upsert({
      where: { address: addressLower },
      update: {
        username: profile.username,
        name: profile.name,
        avatar: profile.avatar,
        email: profile.email?.toLowerCase(),
        passwordHash: profile.passwordHash,
        referralCode: profile.referralCode,
        referredById: referredById,
        emailVerified: profile.emailVerified || false,
        emailVerificationToken: profile.emailVerificationToken,
        emailVerificationSentAt: profile.emailVerificationSentAt 
          ? new Date(profile.emailVerificationSentAt) 
          : null,
        kycVerified: profile.kycStatus?.verified || false,
        kycVerificationId: profile.kycStatus?.verificationId,
        kycProvider: profile.kycStatus?.provider,
        kycStatus: profile.kycStatus?.status,
        kycVerificationDate: profile.kycStatus?.verificationDate 
          ? new Date(profile.kycStatus.verificationDate) 
          : null,
        kycCompletedDate: profile.kycStatus?.verificationDate 
          ? new Date(profile.kycStatus.verificationDate) 
          : null,
      },
      create: {
        address: addressLower,
        username: profile.username,
        name: profile.name,
        avatar: profile.avatar,
        email: profile.email?.toLowerCase(),
        passwordHash: profile.passwordHash,
        referralCode: profile.referralCode,
        referredById: referredById,
        emailVerified: profile.emailVerified || false,
        emailVerificationToken: profile.emailVerificationToken,
        emailVerificationSentAt: profile.emailVerificationSentAt 
          ? new Date(profile.emailVerificationSentAt) 
          : null,
        kycVerified: profile.kycStatus?.verified || false,
        kycVerificationId: profile.kycStatus?.verificationId,
        kycProvider: profile.kycStatus?.provider,
        kycStatus: profile.kycStatus?.status,
        kycVerificationDate: profile.kycStatus?.verificationDate 
          ? new Date(profile.kycStatus.verificationDate) 
          : null,
        kycCompletedDate: profile.kycStatus?.verificationDate 
          ? new Date(profile.kycStatus.verificationDate) 
          : null,
      },
      include: {
        wallets: true,
        socialConnections: true,
        transactions: true,
        portfolioAssets: true,
        kycHistory: true,
      },
    });

    // Update wallets
    if (profile.wallets) {
      for (const [type, walletAddress] of Object.entries(profile.wallets)) {
        if (walletAddress) {
          await prisma.wallet.upsert({
            where: {
              userId_type: {
                userId: user.id,
                type: type,
              },
            },
            update: { address: walletAddress },
            create: {
              userId: user.id,
              type: type,
              address: walletAddress,
            },
          });
        }
      }
    }

    // Update social connections
    if (profile.socialConnections) {
      for (const [type, socialId] of Object.entries(profile.socialConnections)) {
        if (socialId) {
          await prisma.socialConnection.upsert({
            where: {
              userId_type: {
                userId: user.id,
                type: type,
              },
            },
            update: { socialId },
            create: {
              userId: user.id,
              type: type,
              socialId,
            },
          });
        }
      }
    }

    return prismaUserToProfile(user);
  } catch (error) {
    logger.error('Error saving user profile to DB', error, { address });
    return null;
  }
}

/**
 * Generate a unique referral code for a user
 */
export function generateReferralCode(address: string): string {
  const short = address.slice(2, 6).toUpperCase() + address.slice(-4).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${short}-${random}`;
}

/**
 * Initialize profile for a new user
 */
export async function initializeProfileInDB(
  address: string,
  username: string,
  referredBy?: string
): Promise<UserProfile | null> {
  try {
    const addressLower = address.toLowerCase();
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { address: addressLower },
    });
    
    if (existing) {
      return getUserProfileFromDB(addressLower);
    }
    
    // Find referrer if referral code provided
    let referredByUserId: string | null = null;
    if (referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referredBy },
      });
      if (referrer) {
        referredByUserId = referrer.id;
      }
    }
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        address: addressLower,
        username,
        referralCode: generateReferralCode(address),
        referredById: referredByUserId,
      },
      include: {
        wallets: true,
        socialConnections: true,
        transactions: true,
        portfolioAssets: true,
        kycHistory: true,
      },
    });
    
    return prismaUserToProfile(user);
  } catch (error) {
    logger.error('Error initializing profile in DB', error, { address, username });
    return null;
  }
}

/**
 * Update profile data (except username)
 */
export async function updateProfileInDB(
  address: string,
  updates: Partial<Omit<UserProfile, 'username' | 'referralCode' | 'createdAt'>>
): Promise<UserProfile | null> {
  try {
    const addressLower = address.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { address: addressLower },
    });
    
    if (!user) return null;
    
    // Update user fields
    const updatedUser = await prisma.user.update({
      where: { address: addressLower },
      data: {
        name: updates.name !== undefined ? updates.name : undefined,
        avatar: updates.avatar !== undefined ? updates.avatar : undefined,
        email: updates.email !== undefined ? updates.email?.toLowerCase() : undefined,
        passwordHash: updates.passwordHash !== undefined ? updates.passwordHash : undefined,
        referredBy: updates.referredBy !== undefined ? updates.referredBy : undefined,
        emailVerified: updates.emailVerified !== undefined ? updates.emailVerified : undefined,
        emailVerificationToken: updates.emailVerificationToken !== undefined ? updates.emailVerificationToken : undefined,
        emailVerificationSentAt: updates.emailVerificationSentAt 
          ? new Date(updates.emailVerificationSentAt) 
          : undefined,
      },
      include: {
        wallets: true,
        socialConnections: true,
        transactions: true,
        portfolioAssets: true,
        kycHistory: true,
      },
    });
    
    return prismaUserToProfile(updatedUser);
  } catch (error) {
    logger.error('Error updating profile in DB', error, { address });
    return null;
  }
}

/**
 * Add a transaction to user profile
 */
export async function addTransactionToDB(
  address: string,
  transaction: Omit<Transaction, 'id' | 'timestamp'>
): Promise<Transaction | null> {
  try {
    const addressLower = address.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { address: addressLower },
    });
    
    if (!user) return null;
    
    const newTransaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: transaction.type,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        tokensAmount: transaction.tokensAmount,
        description: transaction.description,
        txHash: transaction.txHash,
        paymentMethod: transaction.paymentMethod,
        stripeSessionId: transaction.stripeSessionId,
        metadata: transaction.metadata || {},
      },
    });
    
    return {
      id: newTransaction.id,
      type: newTransaction.type as Transaction['type'],
      status: newTransaction.status as Transaction['status'],
      amount: newTransaction.amount,
      currency: newTransaction.currency as Transaction['currency'],
      tokensAmount: newTransaction.tokensAmount || undefined,
      description: newTransaction.description,
      timestamp: newTransaction.timestamp.getTime(),
      txHash: newTransaction.txHash || undefined,
      paymentMethod: newTransaction.paymentMethod as Transaction['paymentMethod'],
      stripeSessionId: newTransaction.stripeSessionId || undefined,
      metadata: (newTransaction.metadata as Record<string, unknown>) || undefined,
    };
  } catch (error) {
    logger.error('Error adding transaction to DB', error, { address, transactionType: transaction.type });
    return null;
  }
}

/**
 * Update KYC status for a user
 */
export async function updateKYCStatusInDB(
  address: string,
  status: {
    verified: boolean;
    verificationDate?: number;
    verificationId?: string;
    provider?: 'stripe' | 'sumsub' | 'onfido' | 'custom';
    status?: 'pending' | 'processing' | 'verified' | 'failed' | 'expired' | 'canceled' | 'requires_input';
    error?: string;
  }
): Promise<UserProfile | null> {
  try {
    const addressLower = address.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { address: addressLower },
    });
    
    if (!user) return null;
    
    const verificationDate = status.verificationDate || Date.now();
    const provider = status.provider || 'stripe';
    const verificationStatus = status.status || (status.verified ? 'verified' : 'pending');
    const verificationId = status.verificationId || `verification_${Date.now()}`;
    
    // Update user KYC status
    await prisma.user.update({
      where: { address: addressLower },
      data: {
        kycVerified: status.verified,
        kycVerificationId: verificationId,
        kycProvider: provider,
        kycStatus: verificationStatus,
        kycVerificationDate: new Date(verificationDate),
        kycCompletedDate: status.verified ? new Date() : null,
        kycError: status.error || null,
      },
    });
    
    // Add to KYC history
    await prisma.kYCVerification.create({
      data: {
        userId: user.id,
        verificationId,
        provider,
        status: verificationStatus,
        completedDate: status.verified ? new Date() : null,
        error: status.error || null,
      },
    });
    
    return getUserProfileFromDB(addressLower);
  } catch (error) {
    logger.error('Error updating KYC status in DB', error, { address, status });
    return null;
  }
}

/**
 * Update email verification status
 * Can accept either address or email
 */
export async function setEmailVerifiedInDB(
  identifier: string,
  verified: boolean,
  token?: string
): Promise<UserProfile | null> {
  try {
    // Try to find by address first, then by email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { address: identifier.toLowerCase() },
          { email: identifier.toLowerCase() },
        ],
      },
    });
    
    if (!user) {
      logger.warn('User not found for email verification', { identifier });
      return null;
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: verified,
        emailVerificationToken: verified ? null : token || undefined,
        emailVerificationSentAt: verified ? null : (token ? new Date() : undefined),
      },
    });
    
    return getUserProfileFromDB(user.address);
  } catch (error) {
    logger.error('Error updating email verification in DB', error, { identifier });
    return null;
  }
}

/**
 * Find address by referral code
 */
export async function findAddressByReferralCodeInDB(referralCode: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { referralCode },
      select: { address: true },
    });
    
    return user?.address || null;
  } catch (error) {
    logger.error('Error finding address by referral code in DB', error, { referralCode });
    return null;
  }
}

/**
 * Get platform statistics
 */
export async function getPlatformStats() {
  try {
    const [totalRegistrations, activeToday, onlineNow] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
          },
        },
      }),
    ]);
    
    return {
      totalRegistrations,
      activeToday,
      onlineNow,
    };
  } catch (error) {
    logger.error('Error getting platform stats', error);
    return {
      totalRegistrations: 0,
      activeToday: 0,
      onlineNow: 0,
    };
  }
}

