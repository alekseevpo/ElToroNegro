'use client';

import { useCryptoPrice } from './useCryptoPrices';

/**
 * Hook to get current ETH price in USD
 * Uses CoinGecko API with caching via React Query
 * 
 * @returns {Object} Object containing:
 *   - price: ETH price in USD (number | undefined)
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
    // Helper function to convert USD to ETH
    usdToEth: (usdAmount: number): number | undefined => {
      if (!data?.price || data.price <= 0) return undefined;
      return usdAmount / data.price;
    },
    // Helper function to convert ETH to USD
    ethToUsd: (ethAmount: number): number | undefined => {
      if (!data?.price || data.price <= 0) return undefined;
      return ethAmount * data.price;
    },
  };
}

