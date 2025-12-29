'use client';

import { useCryptoPrice } from './useCryptoPrices';

/**
 * Hook to get current ETH price in EUR
 * Uses CoinGecko API with caching via React Query
 * 
 * @returns {Object} Object containing:
 *   - price: ETH price in EUR (number | undefined)
 *   - isLoading: loading state (boolean)
 *   - error: error state (Error | null)
 *   - refetch: function to manually refetch the price
 */
export function useETHPrice() {
  const { data, isLoading, error, refetch } = useCryptoPrice('ETH');

  return {
    price: data?.price,
    isLoading,
    error: error as Error | null,
    refetch,
    // Helper function to convert EUR to ETH
    eurToEth: (eurAmount: number): number | undefined => {
      if (!data?.price || data.price <= 0) return undefined;
      return eurAmount / data.price;
    },
    // Helper function to convert ETH to EUR
    ethToEur: (ethAmount: number): number | undefined => {
      if (!data?.price || data.price <= 0) return undefined;
      return ethAmount * data.price;
    },
  };
}

