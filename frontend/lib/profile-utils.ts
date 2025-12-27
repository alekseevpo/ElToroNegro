/**
 * Profile and Referral System Utilities
 * 
 * Handles user profile data, referral codes, and connections
 */

export interface Transaction {
  id: string;
  type: 'token_purchase' | 'investment' | 'withdrawal' | 'lottery_ticket' | 'btc_bet';
  status: 'pending' | 'completed' | 'failed';
  amount: string; // Amount in EUR or ETH
  currency: 'EUR' | 'ETH' | 'TAI';
  tokensAmount?: string; // Amount of tokens (for token purchases)
  description: string;
  timestamp: number;
  txHash?: string; // Blockchain transaction hash (for crypto transactions)
  paymentMethod?: 'card' | 'crypto' | 'stripe'; // Payment method used
  stripeSessionId?: string; // Stripe session ID for card payments
  metadata?: Record<string, any>; // Additional data
}

export interface PortfolioAsset {
  id: string;
  type: 'token' | 'stock' | 'commodity' | 'crypto' | 'fiat';
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number; // Average purchase price
  currentPrice: number;
  purchaseDate: number;
  currency: 'EUR' | 'ETH' | 'USD';
  totalCost: number; // Total amount invested
  totalValue: number; // Current total value
  profit: number; // Profit/Loss
  profitPercent: number; // Profit/Loss percentage
  interestEarned?: number; // Interest earned from holding
  interestRate?: number; // Annual interest rate if applicable
}

export interface UserProfile {
  username: string;
  referralCode: string;
  referredBy?: string; // Referral code of the user who invited this user
  wallets: {
    metamask?: string;
    ton?: string;
    walletconnect?: string;
    coinbase?: string;
    trustwallet?: string;
  };
  socialConnections: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    email?: string;
  };
  createdAt: number;
  referrals: string[]; // List of addresses that used this user's referral code
  transactions: Transaction[]; // Transaction history
  kycStatus?: {
    verified: boolean;
    verificationDate?: number;
    verificationId?: string;
    provider?: 'stripe' | 'sumsub' | 'onfido' | 'custom';
    status?: 'pending' | 'verified' | 'failed' | 'expired';
  };
  portfolio?: PortfolioAsset[]; // User's portfolio assets
}

/**
 * Generate a unique referral code for a user
 */
export const generateReferralCode = (address: string): string => {
  // Take first 4 chars and last 4 chars of address, make uppercase, add random 4 digits
  const short = address.slice(2, 6).toUpperCase() + address.slice(-4).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `${short}-${random}`;
};

/**
 * Get user profile from storage
 */
export const getUserProfile = (address: string): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(`profile_${address.toLowerCase()}`);
    if (stored) {
      const profile = JSON.parse(stored) as UserProfile;
      // Migration: add transactions array if it doesn't exist (for old profiles)
      if (!profile.transactions) {
        profile.transactions = [];
        saveUserProfile(address, profile);
      }
      return profile;
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
  
  return null;
};

/**
 * Save user profile to storage
 */
export const saveUserProfile = (address: string, profile: UserProfile): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`profile_${address.toLowerCase()}`, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};

/**
 * Initialize profile for a new user
 */
export const initializeProfile = (address: string, username: string, referredBy?: string): UserProfile => {
  const existingProfile = getUserProfile(address);
  
  // If profile already exists, return it (username cannot be changed)
  if (existingProfile) {
    return existingProfile;
  }
  
  const profile: UserProfile = {
    username,
    referralCode: generateReferralCode(address),
    referredBy,
    wallets: {},
    socialConnections: {},
    createdAt: Date.now(),
    referrals: [],
    transactions: [],
  };
  
  saveUserProfile(address, profile);
  
  // If user was referred, add them to referrer's referral list
  if (referredBy) {
    const referrerAddress = findAddressByReferralCode(referredBy);
    if (referrerAddress) {
      const referrerProfile = getUserProfile(referrerAddress);
      if (referrerProfile && !referrerProfile.referrals.includes(address.toLowerCase())) {
        referrerProfile.referrals.push(address.toLowerCase());
        saveUserProfile(referrerAddress, referrerProfile);
      }
    }
  }
  
  return profile;
};

/**
 * Update profile data (except username)
 */
export const updateProfile = (address: string, updates: Partial<Omit<UserProfile, 'username' | 'referralCode' | 'createdAt'>>): UserProfile | null => {
  const profile = getUserProfile(address);
  if (!profile) return null;
  
  const updatedProfile: UserProfile = {
    ...profile,
    ...updates,
    username: profile.username, // Username cannot be changed
    referralCode: profile.referralCode, // Referral code cannot be changed
    createdAt: profile.createdAt, // CreatedAt cannot be changed
  };
  
  saveUserProfile(address, updatedProfile);
  return updatedProfile;
};

/**
 * Connect a wallet to profile
 */
export const connectWallet = (address: string, walletType: 'metamask' | 'ton' | 'walletconnect' | 'coinbase' | 'trustwallet', walletAddress: string): UserProfile | null => {
  const profile = getUserProfile(address);
  if (!profile) return null;
  
  profile.wallets[walletType] = walletAddress;
  saveUserProfile(address, profile);
  return profile;
};

/**
 * Connect a social account
 */
export const connectSocial = (address: string, socialType: 'twitter' | 'telegram' | 'discord' | 'email', socialId: string): UserProfile | null => {
  const profile = getUserProfile(address);
  if (!profile) return null;
  
  profile.socialConnections[socialType] = socialId;
  saveUserProfile(address, profile);
  return profile;
};

/**
 * Disconnect a wallet
 */
export const disconnectWallet = (address: string, walletType: 'metamask' | 'ton' | 'walletconnect' | 'coinbase' | 'trustwallet'): UserProfile | null => {
  const profile = getUserProfile(address);
  if (!profile) return null;
  
  delete profile.wallets[walletType];
  saveUserProfile(address, profile);
  return profile;
};

/**
 * Disconnect a social account
 */
export const disconnectSocial = (address: string, socialType: 'twitter' | 'telegram' | 'discord' | 'email'): UserProfile | null => {
  const profile = getUserProfile(address);
  if (!profile) return null;
  
  delete profile.socialConnections[socialType];
  saveUserProfile(address, profile);
  return profile;
};

/**
 * Get referral statistics
 */
export const getReferralStats = (address: string): { totalReferrals: number; referrals: string[] } => {
  const profile = getUserProfile(address);
  if (!profile) {
    return { totalReferrals: 0, referrals: [] };
  }
  
  return {
    totalReferrals: profile.referrals.length,
    referrals: profile.referrals,
  };
};

/**
 * Get users referred by an address
 */
export const getReferredUsers = (address: string): UserProfile[] => {
  const profile = getUserProfile(address);
  if (!profile) return [];
  
  return profile.referrals
    .map(refAddress => getUserProfile(refAddress))
    .filter((p): p is UserProfile => p !== null);
};

/**
 * Find address by referral code (for testing/development - in production this should be done via backend)
 */
export const findAddressByReferralCode = (referralCode: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Search through all stored profiles
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('profile_')) {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || '{}') as UserProfile;
          if (profile.referralCode === referralCode) {
            return key.replace('profile_', '');
          }
        } catch (e) {
          // Skip invalid entries
        }
      }
    }
  } catch (error) {
    console.error('Error finding address by referral code:', error);
  }
  
  return null;
};

/**
 * Validate referral code format
 */
export const isValidReferralCode = (code: string): boolean => {
  // Format: XXXX-XXXX (8 uppercase letters/numbers, dash, 4 digits)
  return /^[A-Z0-9]{4}-[0-9]{4}$/.test(code);
};

/**
 * Calculate referral bonus percentage
 * Base bonus: 0.5% per referral, max 10%
 */
export const calculateReferralBonus = (totalReferrals: number): number => {
  const bonusPerReferral = 0.5; // 0.5% per referral
  const maxBonus = 10; // Maximum 10% bonus
  const calculatedBonus = totalReferrals * bonusPerReferral;
  return Math.min(calculatedBonus, maxBonus);
};

/**
 * Add a transaction to user profile
 */
export const addTransaction = (address: string, transaction: Omit<Transaction, 'id' | 'timestamp'>): Transaction | null => {
  const profile = getUserProfile(address);
  if (!profile) return null;

  const newTransaction: Transaction = {
    ...transaction,
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  profile.transactions = [newTransaction, ...profile.transactions]; // Add to beginning (newest first)
  // Keep only last 1000 transactions to avoid localStorage bloat
  if (profile.transactions.length > 1000) {
    profile.transactions = profile.transactions.slice(0, 1000);
  }

  saveUserProfile(address, profile);
  return newTransaction;
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = (
  address: string,
  transactionId: string,
  status: Transaction['status'],
  txHash?: string
): boolean => {
  const profile = getUserProfile(address);
  if (!profile) return false;

  const transaction = profile.transactions.find(t => t.id === transactionId);
  if (!transaction) return false;

  transaction.status = status;
  if (txHash) {
    transaction.txHash = txHash;
  }

  saveUserProfile(address, profile);
  return true;
};

/**
 * Get user transactions
 */
export const getUserTransactions = (address: string): Transaction[] => {
  const profile = getUserProfile(address);
  if (!profile) return [];
  return profile.transactions || [];
};

/**
 * Get transactions by type
 */
export const getTransactionsByType = (address: string, type: Transaction['type']): Transaction[] => {
  return getUserTransactions(address).filter(t => t.type === type);
};

/**
 * Get transaction by ID
 */
export const getTransactionById = (address: string, transactionId: string): Transaction | null => {
  const transactions = getUserTransactions(address);
  return transactions.find(t => t.id === transactionId) || null;
};

/**
 * Update KYC status for a user
 */
export const updateKYCStatus = (
  address: string,
  status: {
    verified: boolean;
    verificationDate?: number;
    verificationId?: string;
    provider?: 'stripe' | 'sumsub' | 'onfido' | 'custom';
    status?: 'pending' | 'verified' | 'failed' | 'expired';
  }
): UserProfile | null => {
  const profile = getUserProfile(address);
  if (!profile) return null;

  profile.kycStatus = {
    verified: status.verified,
    verificationDate: status.verificationDate || Date.now(),
    verificationId: status.verificationId,
    provider: status.provider || 'stripe',
    status: status.status || (status.verified ? 'verified' : 'pending'),
  };

  saveUserProfile(address, profile);
  return profile;
};

/**
 * Check if user is KYC verified
 */
export const isKYCVerified = (address: string): boolean => {
  const profile = getUserProfile(address);
  return profile?.kycStatus?.verified === true;
};

/**
 * Get KYC status for a user
 */
export const getKYCStatus = (address: string): UserProfile['kycStatus'] | null => {
  const profile = getUserProfile(address);
  return profile?.kycStatus || null;
};

/**
 * Add or update asset in portfolio
 */
export const addToPortfolio = (
  address: string,
  asset: Omit<PortfolioAsset, 'id' | 'totalValue' | 'profit' | 'profitPercent'>
): PortfolioAsset | null => {
  const profile = getUserProfile(address);
  if (!profile) return null;

  if (!profile.portfolio) {
    profile.portfolio = [];
  }

  // Check if asset already exists (same symbol and type)
  const existingIndex = profile.portfolio.findIndex(
    a => a.symbol === asset.symbol && a.type === asset.type
  );

  const newAsset: PortfolioAsset = {
    ...asset,
    id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    totalValue: asset.quantity * asset.currentPrice,
    profit: (asset.quantity * asset.currentPrice) - asset.totalCost,
    profitPercent: asset.totalCost > 0 
      ? (((asset.quantity * asset.currentPrice) - asset.totalCost) / asset.totalCost) * 100 
      : 0,
  };

  if (existingIndex >= 0) {
    // Update existing asset: calculate weighted average purchase price
    const existing = profile.portfolio[existingIndex];
    const totalQuantity = existing.quantity + asset.quantity;
    const totalCost = existing.totalCost + asset.totalCost;
    const avgPrice = totalCost / totalQuantity;

    profile.portfolio[existingIndex] = {
      ...newAsset,
      quantity: totalQuantity,
      purchasePrice: avgPrice,
      totalCost,
      // Keep the earliest purchase date
      purchaseDate: Math.min(existing.purchaseDate, asset.purchaseDate),
      // Sum interest earned
      interestEarned: (existing.interestEarned || 0) + (asset.interestEarned || 0),
    };
  } else {
    profile.portfolio.push(newAsset);
  }

  // Recalculate current values
  profile.portfolio = profile.portfolio.map(a => ({
    ...a,
    totalValue: a.quantity * a.currentPrice,
    profit: (a.quantity * a.currentPrice) - a.totalCost,
    profitPercent: a.totalCost > 0 
      ? (((a.quantity * a.currentPrice) - a.totalCost) / a.totalCost) * 100 
      : 0,
  }));

  saveUserProfile(address, profile);
  return existingIndex >= 0 ? profile.portfolio[existingIndex] : newAsset;
};

/**
 * Update asset price in portfolio
 */
export const updateAssetPrice = (
  address: string,
  assetId: string,
  currentPrice: number
): PortfolioAsset | null => {
  const profile = getUserProfile(address);
  if (!profile || !profile.portfolio) return null;

  const assetIndex = profile.portfolio.findIndex(a => a.id === assetId);
  if (assetIndex < 0) return null;

  const asset = profile.portfolio[assetIndex];
  asset.currentPrice = currentPrice;
  asset.totalValue = asset.quantity * currentPrice;
  asset.profit = asset.totalValue - asset.totalCost;
  asset.profitPercent = asset.totalCost > 0 
    ? ((asset.totalValue - asset.totalCost) / asset.totalCost) * 100 
    : 0;

  saveUserProfile(address, profile);
  return asset;
};

/**
 * Add interest to asset holding
 */
export const addInterestToAsset = (
  address: string,
  assetId: string,
  interestAmount: number
): PortfolioAsset | null => {
  const profile = getUserProfile(address);
  if (!profile || !profile.portfolio) return null;

  const assetIndex = profile.portfolio.findIndex(a => a.id === assetId);
  if (assetIndex < 0) return null;

  const asset = profile.portfolio[assetIndex];
  asset.interestEarned = (asset.interestEarned || 0) + interestAmount;
  // Interest increases the asset value
  asset.totalValue = (asset.quantity * asset.currentPrice) + (asset.interestEarned || 0);
  asset.profit = asset.totalValue - asset.totalCost;
  asset.profitPercent = asset.totalCost > 0 
    ? ((asset.totalValue - asset.totalCost) / asset.totalCost) * 100 
    : 0;

  saveUserProfile(address, profile);
  return asset;
};

/**
 * Get user portfolio
 */
export const getPortfolio = (address: string): PortfolioAsset[] => {
  const profile = getUserProfile(address);
  if (!profile || !profile.portfolio) return [];
  
  // Recalculate current values before returning
  return profile.portfolio.map(asset => ({
    ...asset,
    totalValue: asset.quantity * asset.currentPrice,
    profit: (asset.quantity * asset.currentPrice) - asset.totalCost,
    profitPercent: asset.totalCost > 0 
      ? (((asset.quantity * asset.currentPrice) - asset.totalCost) / asset.totalCost) * 100 
      : 0,
  }));
};

/**
 * Calculate total portfolio value and P&L
 */
export const getPortfolioStats = (address: string): {
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  totalProfitPercent: number;
  totalInterestEarned: number;
  assetCount: number;
} => {
  const portfolio = getPortfolio(address);
  
  if (portfolio.length === 0) {
    return {
      totalValue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalProfitPercent: 0,
      totalInterestEarned: 0,
      assetCount: 0,
    };
  }

  const totalValue = portfolio.reduce((sum, asset) => sum + asset.totalValue, 0);
  const totalCost = portfolio.reduce((sum, asset) => sum + asset.totalCost, 0);
  const totalInterestEarned = portfolio.reduce((sum, asset) => sum + (asset.interestEarned || 0), 0);
  const totalProfit = totalValue - totalCost;
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalProfit,
    totalProfitPercent,
    totalInterestEarned,
    assetCount: portfolio.length,
  };
};

