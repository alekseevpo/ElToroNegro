/**
 * Application-wide constants
 * 
 * Centralized location for all constants to avoid magic numbers and strings
 */

// Environment
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Network Configuration
export const SEPOLIA_CHAIN_ID = '0xaa36a7';
export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;
export const MAINNET_CHAIN_ID = '0x1';

// Treasury and Token Addresses
export const TREASURY_ADDRESS = 
  process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000';

export const TOKEN_ADDRESSES = {
  USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  WBTC: process.env.NEXT_PUBLIC_WBTC_ADDRESS || '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
} as const;

// ERC-20 ABI (minimal interface)
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
] as const;

// Investment Limits
export const MIN_INVESTMENT_AMOUNT = 10; // EUR
export const MAX_INVESTMENT_AMOUNT = 100000; // EUR
export const TOKEN_PRICE = 1; // 1 $TAI = 1 EUR

// KYC Limits
export const KYC_REQUIRED_AMOUNT = 1000; // EUR

// API Configuration
export const API_CACHE_TIME = 15 * 60 * 1000; // 15 minutes
export const API_STALE_TIME = 10 * 60 * 1000; // 10 minutes

// Session Configuration
export const SESSION_STORAGE_KEYS = {
  GOOGLE_SESSION: 'google_session',
  WALLET_SESSION: 'wallet_session',
  REFERRAL_CODE: 'referral_code',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  KYC_DISMISSED: 'kyc_banner_dismissed',
  EMAIL_VERIFICATION_DISMISSED: 'email_verification_dismissed',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Wallet not connected. Please connect your wallet first.',
  INSUFFICIENT_BALANCE: 'Insufficient balance. Please add funds to your wallet.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  INVALID_AMOUNT: `Amount must be between €${MIN_INVESTMENT_AMOUNT} and €${MAX_INVESTMENT_AMOUNT}.`,
  METAMASK_NOT_FOUND: 'MetaMask not found. Please install MetaMask.',
  WRONG_NETWORK: 'Please switch to Sepolia testnet in MetaMask.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TRANSACTION_SENT: 'Transaction sent! Waiting for confirmation...',
  TRANSACTION_CONFIRMED: 'Transaction confirmed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  EMAIL_VERIFIED: 'Email verified successfully!',
} as const;

// UI Configuration
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  INPUT: 500,
  API_CALL: 1000,
} as const;

