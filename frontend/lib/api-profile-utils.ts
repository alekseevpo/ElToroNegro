/**
 * API-based profile utilities
 * 
 * These functions replace localStorage-based functions in profile-utils.ts
 * They use API endpoints to interact with the database.
 */

import type { UserProfile, Transaction, PortfolioAsset } from './profile-utils';
import { logger } from './logger';

/**
 * Get user profile from API
 * @deprecated Use useProfile hook instead
 */
export async function getUserProfileFromAPI(address: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`/api/profile/${address}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error('Error fetching profile from API', error as Error, { address });
    return null;
  }
}

/**
 * Save user profile via API
 * @deprecated Use useProfileMutation hook instead
 */
export async function saveUserProfileToAPI(
  address: string,
  profile: Partial<UserProfile>
): Promise<UserProfile | null> {
  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        ...profile,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save profile: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error saving profile to API', error as Error, { address });
    return null;
  }
}

/**
 * Create new profile via API
 * @deprecated Use useProfileMutation hook instead
 */
export async function createProfileViaAPI(
  address: string,
  username: string,
  referredBy?: string
): Promise<UserProfile | null> {
  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        username,
        referredBy,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create profile: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error creating profile via API', error as Error, { address, username });
    return null;
  }
}

/**
 * Add transaction via API
 */
export async function addTransactionViaAPI(
  address: string,
  transaction: Omit<Transaction, 'id' | 'timestamp'>
): Promise<Transaction | null> {
  try {
    const response = await fetch(`/api/profile/${address}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error(`Failed to add transaction: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error adding transaction via API', error as Error, { address });
    return null;
  }
}

/**
 * Add asset to portfolio via API
 */
export async function addToPortfolioViaAPI(
  address: string,
  asset: Omit<PortfolioAsset, 'id' | 'totalValue' | 'profit' | 'profitPercent'>
): Promise<PortfolioAsset | null> {
  try {
    const response = await fetch(`/api/profile/${address}/portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asset),
    });

    if (!response.ok) {
      throw new Error(`Failed to add asset to portfolio: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error adding asset to portfolio via API', error as Error, { address });
    return null;
  }
}

/**
 * Get user transactions from API
 */
export async function getUserTransactionsFromAPI(
  address: string,
  type?: Transaction['type'],
  limit = 100,
  offset = 0
): Promise<{ transactions: Transaction[]; total: number; limit: number; offset: number } | null> {
  try {
    const url = new URL(`/api/profile/${address}/transactions`, window.location.origin);
    if (type) url.searchParams.set('type', type);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('offset', offset.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching transactions from API', error as Error, { address });
    return null;
  }
}

/**
 * Get user portfolio from API
 */
export async function getPortfolioFromAPI(address: string): Promise<PortfolioAsset[]> {
  try {
    const response = await fetch(`/api/profile/${address}/portfolio`);
    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
    }

    const data = await response.json();
    return data.portfolio || [];
  } catch (error) {
    logger.error('Error fetching portfolio from API', error as Error, { address });
    return [];
  }
}

