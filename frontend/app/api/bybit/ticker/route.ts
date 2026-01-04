/**
 * Server-side API route for fetching Bybit ticker data
 * This avoids CORS issues when calling Bybit API from the browser
 */

import { NextRequest, NextResponse } from 'next/server';

// Mapping of crypto symbols to Bybit trading pairs
const BYBIT_SYMBOL_MAP: Record<string, string> = {
  // Cryptocurrencies
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'USDT': 'USDTUSDC', // USDT/USDC pair
  'WBTC': 'WBTCUSDT',
  'BNB': 'BNBUSDT',
  // Tokenized stocks (TradFi/xStocks on Bybit) - format: SYMBOLXUSDT
  // Only include symbols that are actually available on Bybit
  'AAPL': 'AAPLXUSDT', // Apple Inc.
  'GOOGL': 'GOOGLXUSDT', // Google (Alphabet) - Class A
  'GOOG': 'GOOGLXUSDT', // Alphabet Inc - Class C (uses GOOGL)
  'TSLA': 'TSLAXUSDT', // Tesla
  'META': 'METAXUSDT', // Meta Platforms Inc
  'AMZN': 'AMZNXUSDT', // Amazon.com Inc
  'NVDA': 'NVDAXUSDT', // NVIDIA CORP
  'CRCL': 'CRCLXUSDT', // Circle Internet Group Inc
  // Note: MSFT and MSTR may not be available on Bybit
  // Commodities (TradFi on Bybit)
  'XAU': 'XAUTUSDT', // Gold (XAUTUSDT on Bybit)
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  const bybitSymbol = BYBIT_SYMBOL_MAP[symbol.toUpperCase()];
  if (!bybitSymbol) {
    return NextResponse.json(
      { error: `Symbol ${symbol} is not supported on Bybit` },
      { status: 400 }
    );
  }

  try {
    // TradFi assets (tokenized stocks, XAU) trade on spot market with X suffix
    // Format: SYMBOLXUSDT (e.g., AAPLXUSDT, XAUTUSDT)
    const category = 'spot';
    
    // Bybit API v5 - Get ticker data
    const apiUrl = `https://api.bybit.com/v5/market/tickers?category=${category}&symbol=${bybitSymbol}`;
    const response = await fetch(
      apiUrl,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 seconds
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Bybit API HTTP error for ${symbol} (${bybitSymbol}):`, response.status, errorText);
      throw new Error(`Bybit API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Bybit API v5 response structure:
    // {
    //   "retCode": 0,
    //   "retMsg": "OK",
    //   "result": {
    //     "category": "spot" or "linear",
    //     "list": [
    //       {
    //         "symbol": "BTCUSDT",
    //         "lastPrice": "43500.50",
    //         "prevPrice24h": "43000.00",
    //         "price24hPcnt": "1.16",
    //         ...
    //       }
    //     ]
    //   }
    // }

    if (data.retCode !== 0 || !data.result?.list?.[0]) {
      console.error(`Bybit API error for ${symbol} (${bybitSymbol}), category: ${category}:`, data.retMsg || data);
      throw new Error(`Bybit API returned error: ${data.retMsg || 'Unknown error'}`);
    }

    const ticker = data.result.list[0];
    const lastPrice = parseFloat(ticker.lastPrice || '0');
    const prevPrice24h = parseFloat(ticker.prevPrice24h || lastPrice);
    const price24hPcnt = parseFloat(ticker.price24hPcnt || '0');

    // Calculate 24h change in absolute value
    const change24h = prevPrice24h > 0 
      ? ((lastPrice - prevPrice24h) / prevPrice24h) * 100 
      : price24hPcnt;

    return NextResponse.json(
      {
        symbol: symbol.toUpperCase(),
        price: lastPrice,
        change24h: change24h,
        lastUpdated: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error(`Error fetching Bybit ticker for ${symbol}:`, error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch price from Bybit',
        symbol: symbol.toUpperCase(),
      },
      { status: 500 }
    );
  }
}

