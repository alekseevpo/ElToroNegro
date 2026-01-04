import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Stock symbols mapping (for Bybit xStocks)
const STOCK_SYMBOLS: Record<string, string> = {
  'AAPL': 'AAPL',
  'MSFT': 'MSFT',
  'GOOGL': 'GOOGL',
};

// Mapping for commodities in CoinGecko
// Note: XAU (Gold) uses Bybit TradFi (not CoinGecko)
const COMMODITY_MAPPING: Record<string, string> = {
  'CL': 'crude-oil', // Crude Oil (WTI) - use CoinGecko
};

// Mapping of asset symbols to CoinGecko IDs for crypto
const CRYPTO_MAPPING: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'WBTC': 'wrapped-bitcoin',
  'BNB': 'binancecoin',
};

/**
 * Fetch historical data on server (no CORS issues)
 */
async function fetchHistoricalDataServer(
  symbol: string,
  category: 'stocks' | 'commodities' | 'crypto',
  days: number = 30
): Promise<Array<{ date: string; price: number; timestamp: number }> | null> {
  try {
    if (category === 'crypto') {
      const coinId = CRYPTO_MAPPING[symbol.toUpperCase()];
      if (!coinId) return null;

      // Try Bybit first for historical data (more reliable and real-time)
      // Mapping of crypto symbols to Bybit trading pairs
      const BYBIT_SYMBOL_MAP: Record<string, string> = {
        'BTC': 'BTCUSDT',
        'ETH': 'ETHUSDT',
        'USDT': 'USDTUSDC',
        'WBTC': 'WBTCUSDT',
        'BNB': 'BNBUSDT',
      };
      
      const bybitSymbol = BYBIT_SYMBOL_MAP[symbol.toUpperCase()];
      
      if (bybitSymbol) {
        try {
          const bybitResponse = await fetch(
            `https://api.bybit.com/v5/market/kline?category=spot&symbol=${bybitSymbol}&interval=D&limit=${Math.min(days, 200)}`,
            {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              signal: AbortSignal.timeout(10000),
            }
          );

          if (bybitResponse.ok) {
            const bybitData = await bybitResponse.json();
            
            if (bybitData.retCode === 0 && bybitData.result?.list) {
              const klines = bybitData.result.list;
              
              // Convert Bybit kline format to our format
              const historicalData = klines.map((kline: string[]) => {
                const timestamp = parseInt(kline[0], 10); // timestamp in milliseconds
                const closePrice = parseFloat(kline[4]); // close price
                
                return {
                  date: new Date(timestamp).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  }),
                  price: Math.round(closePrice * 100) / 100,
                  timestamp,
                };
              }).filter((item: any) => item.price > 0);

              if (historicalData.length > 0) {
                return historicalData;
              }
            }
          }
        } catch (error: any) {
          // Silently fall through to CoinGecko
          if (error.name !== 'AbortError') {
            logger.warn('Bybit historical data failed, trying CoinGecko...', error as Error, { symbol });
          }
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
          `${request.nextUrl.origin}/api/bybit/kline?symbol=${stockSymbol}&days=${days}`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          }
        );

        if (bybitResponse.ok) {
          const bybitData = await bybitResponse.json();
          
          if (Array.isArray(bybitData) && bybitData.length > 0) {
            return bybitData;
          }
        }
      } catch (error) {
        logger.error('Bybit historical data fetch error', error as Error, { symbol: stockSymbol });
        return null;
      }

      return null;
    } else if (category === 'commodities') {
      const symbolUpper = symbol.toUpperCase();
      
      // Gold (XAU) uses Bybit TradFi
      if (symbolUpper === 'XAU') {
        // Try Bybit TradFi API for historical data
        try {
          const bybitResponse = await fetch(
            `${request.nextUrl.origin}/api/bybit/kline?symbol=${symbolUpper}&days=${days}`,
            {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
            }
          );

          if (bybitResponse.ok) {
            const bybitData = await bybitResponse.json();
            
            if (Array.isArray(bybitData) && bybitData.length > 0) {
              return bybitData;
            }
          }
        } catch (error) {
          logger.error('Bybit historical data fetch error for Gold', error as Error, { symbol });
          return null;
        }

        return null;
      }

      const commodityId = COMMODITY_MAPPING[symbolUpper];
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
    logger.error(`Error fetching historical data for ${symbol}`, error as Error);
    return null;
  }
}

/**
 * API Route to fetch historical price data for an asset
 * This runs on the server, so CORS is not an issue
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    const category = request.nextUrl.searchParams.get('category') || 'stocks';
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Fetch historical data directly (server-side, no CORS)
    const data = await fetchHistoricalDataServer(symbol.toUpperCase(), category as 'stocks' | 'commodities' | 'crypto', days);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No historical data available' },
        { status: 404 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching asset history', error as Error, { symbol: params.symbol });
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}

