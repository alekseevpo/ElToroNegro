/**
 * Validation schemas using Zod
 * For API request validation
 */

import { z } from 'zod';

/**
 * Ethereum address validation
 */
const ethereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

/**
 * Email validation
 */
const emailSchema = z.string().email('Invalid email address');

/**
 * Username validation (3-30 chars, alphanumeric + underscore)
 */
const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

/**
 * Referral code validation (XXXX-XXXX format)
 */
const referralCodeSchema = z.string().regex(/^[A-Z0-9]{4}-[0-9]{4}$/, 'Invalid referral code format');

/**
 * Profile creation/update schema
 */
export const profileCreateSchema = z.object({
  address: ethereumAddressSchema,
  username: usernameSchema,
  name: z.string().max(100).optional(),
  avatar: z.string().optional(),
  email: emailSchema.optional(),
  referredBy: referralCodeSchema.optional(),
  wallets: z.object({
    metamask: ethereumAddressSchema.optional(),
    ton: z.string().optional(),
    walletconnect: ethereumAddressSchema.optional(),
    coinbase: ethereumAddressSchema.optional(),
    trustwallet: ethereumAddressSchema.optional(),
  }).optional(),
  socialConnections: z.object({
    twitter: z.string().optional(),
    telegram: z.string().optional(),
    discord: z.string().optional(),
    email: z.string().optional(),
  }).optional(),
}).strict();

/**
 * Profile update schema (all fields optional except address)
 */
export const profileUpdateSchema = z.object({
  address: ethereumAddressSchema,
  name: z.string().max(100).optional(),
  avatar: z.string().optional(),
  email: emailSchema.optional(),
  wallets: z.object({
    metamask: ethereumAddressSchema.optional(),
    ton: z.string().optional(),
    walletconnect: ethereumAddressSchema.optional(),
    coinbase: ethereumAddressSchema.optional(),
    trustwallet: ethereumAddressSchema.optional(),
  }).optional(),
  socialConnections: z.object({
    twitter: z.string().optional(),
    telegram: z.string().optional(),
    discord: z.string().optional(),
    email: z.string().optional(),
  }).optional(),
}).strict();

/**
 * Transaction creation schema
 */
export const transactionCreateSchema = z.object({
  type: z.enum(['token_purchase', 'investment', 'withdrawal', 'lottery_ticket', 'btc_bet']),
  status: z.enum(['pending', 'completed', 'failed']),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.enum(['EUR', 'ETH', 'TAI']),
  tokensAmount: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  txHash: z.string().optional(),
  paymentMethod: z.enum(['card', 'crypto', 'stripe']).optional(),
  stripeSessionId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).strict();

/**
 * Portfolio asset schema
 */
export const portfolioAssetSchema = z.object({
  type: z.enum(['token', 'stock', 'commodity', 'crypto', 'fiat']),
  symbol: z.string().min(1, 'Symbol is required'),
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  purchasePrice: z.number().nonnegative('Purchase price must be non-negative'),
  currentPrice: z.number().nonnegative('Current price must be non-negative'),
  purchaseDate: z.number().int().positive('Purchase date must be a valid timestamp'),
  currency: z.enum(['EUR', 'ETH', 'USD']),
  totalCost: z.number().nonnegative('Total cost must be non-negative'),
  interestEarned: z.number().nonnegative().optional(),
  interestRate: z.number().nonnegative().optional(),
}).strict();

/**
 * Address parameter schema
 */
export const addressParamSchema = z.object({
  address: ethereumAddressSchema,
});

/**
 * Email query schema
 */
export const emailQuerySchema = z.object({
  email: emailSchema,
});

