/**
 * Server-side API route for fetching Bybit historical kline (candlestick) data
 * This avoids CORS issues when calling Bybit API from the browser
 */

import { NextRequest, NextResponse } from 'next/server';

// Mapping of crypto symbols to Bybit trading pairs
const BYBIT_SYMBOL_MAP: Record<string, string> = {
  // Cryptocurrencies
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'USDT': 'USDTUSDC',
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
  const days = parseInt(searchParams.get('days') || '30', 10);

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
    
    // Bybit API v5 - Get kline data
    // interval: D (daily), limit: number of candles (max 200)
    const limit = Math.min(days, 200);
    const apiUrl = `https://api.bybit.com/v5/market/kline?category=${category}&symbol=${bybitSymbol}&interval=D&limit=${limit}`;
    
    const response = await fetch(
      apiUrl,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 seconds
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Bybit API HTTP error for ${symbol} (${bybitSymbol}), category: ${category}:`, response.status, errorText);
      throw new Error(`Bybit API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Bybit API v5 response structure:
    // {
    //   "retCode": 0,
    //   "retMsg": "OK",
    //   "result": {
    //     "category": "spot" or "linear",
    //     "symbol": "BTCUSDT",
    //     "list": [
    //       ["1698768000000", "43500.50", "44000.00", "43000.00", "43800.00", "100.5"],
    //       // [timestamp, open, high, low, close, volume]
    //     ]
    //   }
    // }

    if (data.retCode !== 0 || !data.result?.list) {
      console.error(`Bybit API error for ${symbol} (${bybitSymbol}), category: ${category}:`, data.retMsg || data);
      throw new Error(`Bybit API returned error: ${data.retMsg || 'Unknown error'}`);
    }

    const klines = data.result.list;
    
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

    return NextResponse.json(
      historicalData,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error(`Error fetching Bybit kline for ${symbol}:`, error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch historical data from Bybit',
        symbol: symbol.toUpperCase(),
      },
      { status: 500 }
    );
  }
}

