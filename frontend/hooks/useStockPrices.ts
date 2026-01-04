import { useQuery } from '@tanstack/react-query';
import { fetchStockPrice, fetchCommodityPrice } from '@/lib/price-api';

/**
 * Hook to fetch stock prices
 */
export function useStockPrice(symbol: string) {
  return useQuery({
    queryKey: ['stockPrice', symbol],
    queryFn: () => fetchStockPrice(symbol),
    enabled: !!symbol,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch multiple stock prices
 */
export function useMultipleStockPrices(symbols: string[]) {
  return useQuery({
    queryKey: ['stockPrices', symbols.sort().join(',')],
    queryFn: async () => {
      const results: Record<string, any> = {};
      await Promise.all(
        symbols.map(async (symbol) => {
          const data = await fetchStockPrice(symbol);
          if (data) {
            results[symbol] = data;
          }
        })
      );
      return results;
    },
    enabled: symbols.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch commodity prices
 */
export function useCommodityPrice(symbol: string) {
  return useQuery({
    queryKey: ['commodityPrice', symbol],
    queryFn: () => fetchCommodityPrice(symbol),
    enabled: !!symbol,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch multiple commodity prices
 */
export function useMultipleCommodityPrices(symbols: string[]) {
  return useQuery({
    queryKey: ['commodityPrices', symbols.sort().join(',')],
    queryFn: async () => {
      const results: Record<string, any> = {};
      await Promise.all(
        symbols.map(async (symbol) => {
          const data = await fetchCommodityPrice(symbol);
          if (data) {
            results[symbol] = data;
          }
        })
      );
      return results;
    },
    enabled: symbols.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

