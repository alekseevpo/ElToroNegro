'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCryptoPrice, fetchMultipleCryptoPrices, type AssetPriceData } from '@/lib/price-api';

/**
 * Хук для получения цены одной криптовалюты с кэшированием через React Query
 */
export function useCryptoPrice(symbol: string) {
  return useQuery<AssetPriceData | null>({
    queryKey: ['cryptoPrice', symbol],
    queryFn: () => fetchCryptoPrice(symbol),
    enabled: !!symbol,
    staleTime: 15 * 60 * 1000, // 15 минут
  });
}

/**
 * Хук для получения цен нескольких криптовалют одновременно
 */
export function useMultipleCryptoPrices(symbols: string[]) {
  return useQuery<Record<string, AssetPriceData>>({
    queryKey: ['cryptoPrices', symbols.sort().join(',')],
    queryFn: () => fetchMultipleCryptoPrices(symbols),
    enabled: symbols.length > 0,
    staleTime: 15 * 60 * 1000, // 15 минут
  });
}

/**
 * Хук для получения данных о криптовалютах с CoinGecko Markets API
 */
export function useCryptoMarkets(ids: string[] = ['bitcoin', 'ethereum', 'binancecoin']) {
  return useQuery({
    queryKey: ['cryptoMarkets', ids.sort().join(',')],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&per_page=${ids.length}&page=1&sparkline=false&price_change_percentage=24h`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          if (response.status === 429 || response.status >= 500) {
            throw new Error('API rate limit or server error');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Invalid data format');
        }

        clearTimeout(timeoutId);
        return data.map((coin: any) => ({
          symbol: coin.symbol?.toUpperCase() || '',
          name: coin.name || '',
          price: coin.current_price || 0,
          change24h: coin.price_change_percentage_24h || 0,
          marketCap: coin.market_cap || 0,
        }));
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name !== 'AbortError' && !error.message?.includes('fetch') && error.name !== 'TypeError') {
          console.error('Error fetching crypto markets:', error);
        }
        throw error;
      }
    },
    enabled: ids.length > 0,
    staleTime: 15 * 60 * 1000, // 15 минут
    retry: 2,
  });
}

