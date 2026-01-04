/**
 * Server-side API route for fetching quotes from TradingView
 * Uses TradingView's symbol search and quotes endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

// Mapping of our symbols to TradingView symbols
const TRADINGVIEW_SYMBOL_MAP: Record<string, Record<string, string>> = {
  stocks: {
    'AAPL': 'NASDAQ:AAPL',
    'MSFT': 'NASDAQ:MSFT',
    'GOOGL': 'NASDAQ:GOOGL',
  },
  commodities: {
    'XAU': 'TVC:GOLD',
    'CL': 'TVC:USOIL',
  },
  crypto: {
    'BTC': 'BINANCE:BTCUSDT',
    'ETH': 'BINANCE:ETHUSDT',
    'USDT': 'BINANCE:USDTUSDC',
    'WBTC': 'BINANCE:WBTCUSDT',
    'BNB': 'BINANCE:BNBUSDT',
  },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const category = searchParams.get('category') as 'stocks' | 'commodities' | 'crypto' | null;

  if (!symbol || !category) {
    return NextResponse.json(
      { error: 'Symbol and category parameters are required' },
      { status: 400 }
    );
  }

  const tvSymbol = TRADINGVIEW_SYMBOL_MAP[category]?.[symbol.toUpperCase()];
  if (!tvSymbol) {
    return NextResponse.json(
      { error: `Symbol ${symbol} is not supported for category ${category}` },
      { status: 400 }
    );
  }

  try {
    // TradingView Symbol Search API (unofficial but widely used)
    // This endpoint returns symbol information including current price
    const response = await fetch(
      `https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(tvSymbol)}&exchange=&lang=en&search_type=undefined&domain=production&sort_by_country=US`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error(`TradingView API error: ${response.status}`);
    }

    const searchData = await response.json();
    
    if (!searchData || !Array.isArray(searchData) || searchData.length === 0) {
      throw new Error('No symbol data found');
    }

    // Get the first matching symbol
    const symbolData = searchData[0];
    
    // Try to get quotes from TradingView's quote endpoint
    // Note: This is an unofficial endpoint, may require authentication for some symbols
    try {
      const quoteResponse = await fetch(
        `https://scanner.tradingview.com/symbol?exchange=${symbolData.exchange || ''}&symbol=${symbolData.symbol || tvSymbol}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (quoteResponse.ok) {
        const quoteData = await quoteResponse.json();
        
        if (quoteData && quoteData.close !== undefined) {
          const currentPrice = quoteData.close;
          const previousClose = quoteData.prev_close || currentPrice;
          const change24h = previousClose > 0 
            ? ((currentPrice - previousClose) / previousClose) * 100 
            : 0;

          return NextResponse.json(
            {
              symbol: symbol.toUpperCase(),
              price: currentPrice,
              change24h: change24h,
              lastUpdated: Date.now(),
              source: 'tradingview',
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
              },
            }
          );
        }
      }
    } catch (quoteError) {
      // Fallback to symbol search data if quote endpoint fails
      console.warn('TradingView quote endpoint failed, using symbol search data:', quoteError);
    }

    // Fallback: Return symbol search data (may not have real-time price)
    return NextResponse.json(
      {
        symbol: symbol.toUpperCase(),
        price: symbolData.close_price || 0,
        change24h: 0, // Symbol search doesn't provide 24h change
        lastUpdated: Date.now(),
        source: 'tradingview_search',
        note: 'Price may not be real-time',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error(`Error fetching TradingView quote for ${symbol}:`, error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch price from TradingView',
        symbol: symbol.toUpperCase(),
      },
      { status: 500 }
    );
  }
}

