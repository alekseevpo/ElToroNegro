/**
 * Price API utilities for fetching real-time asset prices
 */

export interface AssetPriceData {
  price: number;
  change24h: number;
  lastUpdated: number;
}

// Mapping of asset symbols to CoinGecko IDs for crypto
const CRYPTO_MAPPING: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'WBTC': 'wrapped-bitcoin',
  'BNB': 'binancecoin',
};

// Cache for prices to avoid too many API calls
const priceCache: Map<string, { data: AssetPriceData; timestamp: number }> = new Map();
const CACHE_DURATION = 900000; // 15 minutes cache to reduce API calls (оптимизировано с 10 минут)

/**
 * Fetch cryptocurrency price from CoinGecko
 */
export const fetchCryptoPrice = async (symbol: string): Promise<AssetPriceData | null> => {
  const coinId = CRYPTO_MAPPING[symbol.toUpperCase()];
  if (!coinId) return null;

  // Check cache first
  const cached = priceCache.get(coinId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=eur&include_24hr_change=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );
    
    if (!response.ok) {
      // If rate limited or server error, return cached data if available
      if (response.status === 429 || response.status >= 500) {
        if (cached) {
          return cached.data;
        }
      }
      return null;
    }

    const data = await response.json();
    
    // Check if response is valid JSON and contains coin data
    if (!data || typeof data !== 'object') {
      if (cached) return cached.data;
      return null;
    }
    
    const coinData = data[coinId];
    if (!coinData || coinData.eur === undefined) {
      if (cached) return cached.data;
      return null;
    }

    const priceData: AssetPriceData = {
      price: coinData.eur || 0,
      change24h: coinData.eur_24h_change || 0,
      lastUpdated: Date.now(),
    };

    // Update cache
    priceCache.set(coinId, { data: priceData, timestamp: Date.now() });
    
    clearTimeout(timeoutId);
    return priceData;
  } catch (error: any) {
    // Handle AbortError (timeout) or network errors silently
    if (error.name === 'AbortError' || error.name === 'TypeError') {
      // Return cached data if available on network errors
      if (cached) {
        return cached.data;
      }
    }
    // Only log unexpected errors
    if (error.name !== 'AbortError' && !error.message?.includes('fetch')) {
      console.error(`Error fetching ${symbol} price:`, error);
    }
    return null;
  }
};

/**
 * Fetch multiple cryptocurrency prices at once
 */
export const fetchMultipleCryptoPrices = async (symbols: string[]): Promise<Record<string, AssetPriceData>> => {
  const coinIds = symbols
    .map(s => CRYPTO_MAPPING[s.toUpperCase()])
    .filter(Boolean);

  if (coinIds.length === 0) return {};

  // Check cache for all symbols
  const cached: Record<string, AssetPriceData> = {};
  const toFetch: string[] = [];

  coinIds.forEach(coinId => {
    const cachedData = priceCache.get(coinId);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      const symbol = Object.keys(CRYPTO_MAPPING).find(k => CRYPTO_MAPPING[k] === coinId);
      if (symbol) {
        cached[symbol] = cachedData.data;
      }
    } else {
      toFetch.push(coinId);
    }
  });

  if (toFetch.length === 0) return cached;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${toFetch.join(',')}&vs_currencies=eur&include_24hr_change=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );
    
    if (!response.ok) {
      // If rate limited or server error, return cached data
      if (response.status === 429 || response.status >= 500) {
        return cached;
      }
      return cached;
    }

    const data = await response.json();
    
    // Check if response is valid
    if (!data || typeof data !== 'object') {
      return cached;
    }
    
    const results: Record<string, AssetPriceData> = { ...cached };

    Object.entries(data).forEach(([coinId, coinData]: [string, any]) => {
      const symbol = Object.keys(CRYPTO_MAPPING).find(k => CRYPTO_MAPPING[k] === coinId);
      if (symbol && coinData && coinData.eur !== undefined) {
        const priceData: AssetPriceData = {
          price: coinData.eur || 0,
          change24h: coinData.eur_24h_change || 0,
          lastUpdated: Date.now(),
        };
        results[symbol] = priceData;
        priceCache.set(coinId, { data: priceData, timestamp: Date.now() });
      }
    });
    
    clearTimeout(timeoutId);
    return results;
  } catch (error: any) {
    // Handle errors silently and return cached data
    if (error.name !== 'AbortError' && !error.message?.includes('fetch')) {
      // Only log unexpected errors
      console.error('Error fetching crypto prices:', error);
    }
    return cached;
  }
};

/**
 * Convert USD to EUR (simple conversion, in production should use real exchange rate API)
 */
export const usdToEur = (usd: number): number => {
  // Approximate conversion rate (should be fetched from API in production)
  const eurRate = 0.92;
  return usd * eurRate;
};

/**
 * Generate mock price data for non-crypto assets (stocks, commodities)
 * In production, these should come from a real API like Alpha Vantage, Yahoo Finance, etc.
 * 
 * Uses deterministic seed based on asset ID to ensure consistent values between server and client
 * IMPORTANT: This function must be fully deterministic to avoid hydration errors
 */
export const getMockPriceData = (basePrice: number, volatility: number = 0.02, seed?: string): AssetPriceData => {
  // Use deterministic "random" based on seed to ensure SSR/CSR consistency
  // If no seed provided, use basePrice as seed for consistency
  const seedValue = seed || basePrice.toString();
  
  // Simple hash function for deterministic pseudo-random
  let hash = 0;
  for (let i = 0; i < seedValue.length; i++) {
    const char = seedValue.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use ONLY deterministic variation based on seed (no time-based values)
  // This ensures server and client render the same values
  const deterministic = Math.abs(hash) % 10000;
  
  // Normalize to -1 to 1 range (fully deterministic)
  const normalized = (deterministic / 10000) * 2 - 1;
  
  // Generate realistic price variation (±2% by default)
  const variation = normalized * volatility;
  const change24h = variation * 100;
  const price = basePrice * (1 + variation);

  return {
    price: Math.round(price * 100) / 100,
    change24h: Math.round(change24h * 100) / 100,
    // Use a fixed timestamp for SSR/CSR consistency (only lastUpdated differs, which is fine)
    lastUpdated: 0,
  };
};

