/**
 * Price API utilities for fetching real-time asset prices
 */

export interface AssetPriceData {
  price: number;
  change24h: number;
  lastUpdated: number;
}

// Mapping of asset symbols to CoinGecko IDs for crypto and commodities
const CRYPTO_MAPPING: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'WBTC': 'wrapped-bitcoin',
  'BNB': 'binancecoin',
};

// Mapping for commodities
// XAU (Gold) uses Bybit TradFi
// CL (Crude Oil) uses CoinGecko
const COMMODITY_MAPPING: Record<string, string> = {
  'CL': 'crude-oil', // Crude Oil (WTI) - use CoinGecko
};

// Cache for prices to avoid too many API calls
const priceCache: Map<string, { data: AssetPriceData; timestamp: number }> = new Map();
const CACHE_DURATION = 900000; // 15 minutes cache to reduce API calls (оптимизировано с 10 минут)

/**
 * Fetch cryptocurrency price from Bybit (primary) with CoinGecko fallback
 */
export const fetchCryptoPrice = async (symbol: string): Promise<AssetPriceData | null> => {
  const coinId = CRYPTO_MAPPING[symbol.toUpperCase()];
  if (!coinId) return null;

  // Check cache first
  const cached = priceCache.get(coinId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Try Bybit first (more reliable and real-time)
  try {
    const bybitResponse = await fetch(
      `/api/bybit/ticker?symbol=${symbol.toUpperCase()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout
      }
    );

    if (bybitResponse.ok) {
      const bybitData = await bybitResponse.json();
      
      if (bybitData.price && bybitData.price > 0) {
        const priceData: AssetPriceData = {
          price: bybitData.price,
          change24h: bybitData.change24h || 0,
          lastUpdated: Date.now(),
        };

        // Update cache
        priceCache.set(coinId, { data: priceData, timestamp: Date.now() });
        return priceData;
      }
    }
  } catch (error: any) {
    // Silently fall through to CoinGecko
    if (error.name !== 'AbortError') {
      console.warn(`Bybit API failed for ${symbol}, trying CoinGecko...`);
    }
  }

  // Fallback to CoinGecko
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
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
    if (!coinData || coinData.usd === undefined) {
      if (cached) return cached.data;
      return null;
    }

    const priceData: AssetPriceData = {
      price: coinData.usd || 0,
      change24h: coinData.usd_24h_change || 0,
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
 * Uses Bybit API (primary) with CoinGecko fallback
 */
export const fetchMultipleCryptoPrices = async (symbols: string[]): Promise<Record<string, AssetPriceData>> => {
  const validSymbols = symbols
    .map(s => s.toUpperCase())
    .filter(s => CRYPTO_MAPPING[s]);

  if (validSymbols.length === 0) return {};

  // Check cache for all symbols
  const cached: Record<string, AssetPriceData> = {};
  const toFetch: string[] = [];

  validSymbols.forEach(symbol => {
    const coinId = CRYPTO_MAPPING[symbol];
    const cachedData = priceCache.get(coinId);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      cached[symbol] = cachedData.data;
    } else {
      toFetch.push(symbol);
    }
  });

  if (toFetch.length === 0) return cached;

  // Try Bybit first - fetch all symbols in parallel
  const bybitResults: Record<string, AssetPriceData> = { ...cached };
  const bybitPromises = toFetch.map(async (symbol) => {
    try {
      const response = await fetch(
        `/api/bybit/ticker?symbol=${symbol}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.price && data.price > 0) {
          const priceData: AssetPriceData = {
            price: data.price,
            change24h: data.change24h || 0,
            lastUpdated: Date.now(),
          };
          bybitResults[symbol] = priceData;
          const coinId = CRYPTO_MAPPING[symbol];
          if (coinId) {
            priceCache.set(coinId, { data: priceData, timestamp: Date.now() });
          }
          return { symbol, success: true };
        }
      }
    } catch (error: any) {
      // Silently continue
    }
    return { symbol, success: false };
  });

  await Promise.all(bybitPromises);

  // Check which symbols still need to be fetched from CoinGecko
  const stillToFetch = toFetch.filter(symbol => !bybitResults[symbol]);
  
  if (stillToFetch.length === 0) {
    return bybitResults;
  }

  // Fallback to CoinGecko for remaining symbols
  const coinIds = stillToFetch.map(s => CRYPTO_MAPPING[s]);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([coinId, coinData]: [string, any]) => {
          const symbol = Object.keys(CRYPTO_MAPPING).find(k => CRYPTO_MAPPING[k] === coinId);
          if (symbol && coinData && coinData.usd !== undefined) {
            const priceData: AssetPriceData = {
              price: coinData.usd || 0,
              change24h: coinData.usd_24h_change || 0,
              lastUpdated: Date.now(),
            };
            bybitResults[symbol] = priceData;
            priceCache.set(coinId, { data: priceData, timestamp: Date.now() });
          }
        });
      }
    }
    
    clearTimeout(timeoutId);
    return bybitResults;
  } catch (error: any) {
    // Handle errors silently and return what we have
    if (error.name !== 'AbortError' && !error.message?.includes('fetch')) {
      console.error('Error fetching crypto prices from CoinGecko:', error);
    }
    clearTimeout(timeoutId);
    return bybitResults;
  }
};

/**
 * Currency conversion helper (kept for compatibility, but now we use USD directly)
 */
export const usdToEur = (usd: number): number => {
  // No conversion needed - we use USD directly now
  return usd;
};

// Stock symbols mapping (for Bybit TradFi/xStocks)
// Only include symbols that are actually available on Bybit
const STOCK_SYMBOLS: Record<string, string> = {
  'AAPL': 'AAPL', // Apple Inc.
  'GOOGL': 'GOOGL', // Google (Alphabet) - Class A
  'GOOG': 'GOOGL', // Alphabet Inc - Class C (uses GOOGL)
  'TSLA': 'TSLA', // Tesla
  'META': 'META', // Meta Platforms Inc
  'AMZN': 'AMZN', // Amazon.com Inc (AMAZON on UI)
  'NVDA': 'NVDA', // NVIDIA CORP
  'CRCL': 'CRCL', // Circle Internet Group Inc
  // Note: MSFT and MSTR may not be available on Bybit
};

/**
 * Fetch stock price from Bybit (xStocks)
 * Bybit supports tokenized stocks through their xStocks product
 */
export const fetchStockPrice = async (symbol: string): Promise<AssetPriceData | null> => {
  const stockSymbol = STOCK_SYMBOLS[symbol.toUpperCase()];
  if (!stockSymbol) return null;

  // Check cache first
  const cached = priceCache.get(`stock_${stockSymbol}`);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Try Bybit xStocks API
  try {
    const bybitResponse = await fetch(
      `/api/bybit/ticker?symbol=${stockSymbol}`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (bybitResponse.ok) {
      const bybitData = await bybitResponse.json();
      
      if (bybitData.price && bybitData.price > 0) {
        const priceData: AssetPriceData = {
          price: bybitData.price,
          change24h: bybitData.change24h || 0,
          lastUpdated: Date.now(),
        };

        priceCache.set(`stock_${stockSymbol}`, { data: priceData, timestamp: Date.now() });
        return priceData;
      }
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.warn(`Bybit API failed for stock ${symbol}`);
    }
  }

  // Return cached data if available, otherwise null
  if (cached) return cached.data;
  return null;
};

/**
 * Fetch commodity price from Bybit (for Gold/XAU) or CoinGecko (for other commodities)
 */
export const fetchCommodityPrice = async (symbol: string): Promise<AssetPriceData | null> => {
  const symbolUpper = symbol.toUpperCase();
  
  // Gold (XAU) uses Bybit TradFi
  if (symbolUpper === 'XAU') {
    // Check cache first
    const cacheKey = `commodity_${symbolUpper}`;
    const cached = priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Try Bybit TradFi API for Gold
    try {
      const bybitResponse = await fetch(
        `/api/bybit/ticker?symbol=${symbolUpper}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (bybitResponse.ok) {
        const bybitData = await bybitResponse.json();
        
        if (bybitData.price && bybitData.price > 0) {
          const priceData: AssetPriceData = {
            price: bybitData.price,
            change24h: bybitData.change24h || 0,
            lastUpdated: Date.now(),
          };

          priceCache.set(cacheKey, { data: priceData, timestamp: Date.now() });
          return priceData;
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.warn(`Bybit API failed for ${symbol}`);
      }
    }

    // Return cached data if available, otherwise null
    if (cached) return cached.data;
    return null;
  }

  const commodityId = COMMODITY_MAPPING[symbolUpper];
  if (!commodityId) return null;

  // Check cache first
  const cacheKey = `commodity_${symbolUpper}`;
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  // Other commodities (like Crude Oil) use CoinGecko
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${commodityId}&vs_currencies=usd&include_24hr_change=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      if (cached) return cached.data;
      return null;
    }

    const data = await response.json();
    
    if (!data?.[commodityId]?.usd) {
      if (cached) return cached.data;
      return null;
    }

    const commodityData = data[commodityId];
    const priceData: AssetPriceData = {
      price: commodityData.usd || 0,
      change24h: commodityData.usd_24h_change || 0,
      lastUpdated: Date.now(),
    };

    priceCache.set(cacheKey, { data: priceData, timestamp: Date.now() });
    clearTimeout(timeoutId);
    return priceData;
  } catch (error: any) {
    if (error.name !== 'AbortError' && !error.message?.includes('fetch')) {
      console.error(`Error fetching ${symbol} commodity price:`, error);
    }
    if (cached) return cached.data;
    return null;
  }
};

/**
 * Fetch historical price data for charts (30 days)
 */
export const fetchHistoricalData = async (
  symbol: string,
  category: 'stocks' | 'commodities' | 'crypto',
  days: number = 30
): Promise<Array<{ date: string; price: number; timestamp: number }> | null> => {
  try {
    if (category === 'crypto') {
      const coinId = CRYPTO_MAPPING[symbol.toUpperCase()];
      if (!coinId) return null;

      // Try Bybit first for historical data (more reliable and real-time)
      try {
        const bybitResponse = await fetch(
          `/api/bybit/kline?symbol=${symbol.toUpperCase()}&days=${days}`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (bybitResponse.ok) {
          const bybitData = await bybitResponse.json();
          
          if (Array.isArray(bybitData) && bybitData.length > 0) {
            return bybitData;
          }
        }
      } catch (error: any) {
        // Silently fall through to CoinGecko
        if (error.name !== 'AbortError') {
          console.warn(`Bybit historical data failed for ${symbol}, trying CoinGecko...`);
        }
      }

      // Fallback to CoinGecko
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data?.prices) return null;

      return data.prices.map(([timestamp, price]: [number, number]) => ({
        date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: Math.round(price * 100) / 100,
        timestamp,
      }));
    } else if (category === 'stocks') {
      const stockSymbol = STOCK_SYMBOLS[symbol.toUpperCase()];
      if (!stockSymbol) return null;

      // Try Bybit xStocks API for historical data
      try {
        const bybitResponse = await fetch(
          `/api/bybit/kline?symbol=${stockSymbol}&days=${days}`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (bybitResponse.ok) {
          const bybitData = await bybitResponse.json();
          
          if (Array.isArray(bybitData) && bybitData.length > 0) {
            return bybitData;
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.warn(`Bybit historical data failed for stock ${symbol}`);
        }
      }

      return null;
    } else if (category === 'commodities') {
      // Gold (XAU) historical data temporarily disabled - source to be determined
      if (symbol.toUpperCase() === 'XAU') {
        return null;
      }

      const commodityId = COMMODITY_MAPPING[symbol.toUpperCase()];
      if (!commodityId) return null;

      // Other commodities use CoinGecko
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${commodityId}/market_chart?vs_currency=usd&days=${days}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data?.prices) return null;

      return data.prices.map(([timestamp, price]: [number, number]) => ({
        date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: Math.round(price * 100) / 100,
        timestamp,
      }));
    }

    return null;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return null;
  }
};

/**
 * Generate mock price data for non-crypto assets (stocks, commodities)
 * FALLBACK ONLY: Use real APIs when possible
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

