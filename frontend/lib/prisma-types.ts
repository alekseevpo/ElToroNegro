/**
 * Prisma type definitions
 * 
 * Type-safe definitions for Prisma models with includes
 */

import type { 
  User, 
  Wallet, 
  SocialConnection, 
  Transaction as PrismaTransaction, 
  PortfolioAsset as PrismaPortfolioAsset,
  KYCVerification as PrismaKYCVerification
} from '@prisma/client';

// Wallet types
export type WalletType = 'metamask' | 'ton' | 'walletconnect' | 'coinbase' | 'trustwallet';

// Social connection types
export type SocialConnectionType = 'twitter' | 'telegram' | 'discord' | 'email';

// Transaction types
export type TransactionType = 'token_purchase' | 'investment' | 'withdrawal' | 'lottery_ticket' | 'btc_bet';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type TransactionCurrency = 'EUR' | 'ETH' | 'TAI';
export type PaymentMethod = 'card' | 'crypto' | 'stripe';

// Portfolio asset types
export type PortfolioAssetType = 'token' | 'stock' | 'commodity' | 'crypto' | 'fiat';
export type PortfolioCurrency = 'EUR' | 'ETH' | 'USD';

// KYC types
export type KYCProvider = 'stripe' | 'sumsub' | 'onfido' | 'custom';
export type KYCStatus = 'pending' | 'processing' | 'verified' | 'failed' | 'expired' | 'canceled' | 'requires_input';

// User with all relations
export type UserWithRelations = User & {
  wallets: Wallet[];
  socialConnections: SocialConnection[];
  transactions: PrismaTransaction[];
  portfolioAssets: PrismaPortfolioAsset[];
  kycHistory: PrismaKYCVerification[];
  referrals: Pick<User, 'address'>[];
  referredByUser: Pick<User, 'referralCode'> | null;
};

// Type guards
export function isWalletType(value: string): value is WalletType {
  return ['metamask', 'ton', 'walletconnect', 'coinbase', 'trustwallet'].includes(value);
}

export function isSocialConnectionType(value: string): value is SocialConnectionType {
  return ['twitter', 'telegram', 'discord', 'email'].includes(value);
}

export function isTransactionType(value: string): value is TransactionType {
  return ['token_purchase', 'investment', 'withdrawal', 'lottery_ticket', 'btc_bet'].includes(value);
}

export function isTransactionStatus(value: string): value is TransactionStatus {
  return ['pending', 'completed', 'failed'].includes(value);
}

export function isKYCProvider(value: string): value is KYCProvider {
  return ['stripe', 'sumsub', 'onfido', 'custom'].includes(value);
}

export function isKYCStatus(value: string): value is KYCStatus {
  return ['pending', 'processing', 'verified', 'failed', 'expired', 'canceled', 'requires_input'].includes(value);
}

