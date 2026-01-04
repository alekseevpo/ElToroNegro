'use client';

import { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol: string;
  category: 'stocks' | 'commodities' | 'crypto';
  timeframe?: string;
  height?: number;
  theme?: 'dark' | 'light';
}

// Mapping of our symbols to TradingView symbols
const TRADINGVIEW_SYMBOL_MAP: Record<string, Record<string, string>> = {
  stocks: {
    'AAPL': 'NASDAQ:AAPL',
    'MSFT': 'NASDAQ:MSFT',
    'GOOGL': 'NASDAQ:GOOGL',
  },
  commodities: {
    'XAU': 'TVC:GOLD', // Gold futures
    'CL': 'TVC:USOIL', // Crude Oil futures
  },
  crypto: {
    'BTC': 'BINANCE:BTCUSDT',
    'ETH': 'BINANCE:ETHUSDT',
    'USDT': 'BINANCE:USDTUSDC',
    'WBTC': 'BINANCE:WBTCUSDT',
    'BNB': 'BINANCE:BNBUSDT',
  },
};

// TradingView timeframe mapping
const TIMEFRAME_MAP: Record<string, string> = {
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '24h': '1D',
  '1W': '1W',
  '1M': '1M',
};

export default function TradingViewChart({
  symbol,
  category,
  timeframe = '1h',
  height = 500,
  theme = 'dark',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Get TradingView symbol
    const tvSymbol = TRADINGVIEW_SYMBOL_MAP[category]?.[symbol.toUpperCase()];
    if (!tvSymbol) {
      setError(`TradingView symbol not found for ${symbol}`);
      setIsLoading(false);
      return;
    }

    // Get TradingView timeframe
    const tvTimeframe = TIMEFRAME_MAP[timeframe] || '60';

    // Clear container
    containerRef.current.innerHTML = '';
    setIsLoading(true);
    setError(null);

    // Check if TradingView script is already loaded
    if ((window as any).TradingView) {
      // Script already loaded, create widget directly
      try {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: tvTimeframe,
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1', // Candlestick chart
          locale: 'en',
          toolbar_bg: '#1a1a1a',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: true,
          container_id: containerRef.current.id,
          height: height,
          width: '100%',
          studies: [
            'Volume@tv-basicstudies',
          ],
        });
        setIsLoading(false);
        setError(null);
      } catch (err: any) {
        console.error('Error creating TradingView widget:', err);
        setError(err.message || 'Failed to create TradingView widget');
        setIsLoading(false);
      }
      return;
    }

    // Create script element for TradingView widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (!containerRef.current || !(window as any).TradingView) {
        setError('Failed to load TradingView widget');
        setIsLoading(false);
        return;
      }

      try {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: tvTimeframe,
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1', // Candlestick chart
          locale: 'en',
          toolbar_bg: '#1a1a1a',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: true,
          container_id: containerRef.current.id,
          height: height,
          width: '100%',
          studies: [
            'Volume@tv-basicstudies',
          ],
        });
        setIsLoading(false);
        setError(null);
      } catch (err: any) {
        console.error('Error creating TradingView widget:', err);
        setError(err.message || 'Failed to create TradingView widget');
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      setError('Failed to load TradingView script');
      setIsLoading(false);
    };

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
    if (!existingScript) {
      document.body.appendChild(script);
    } else {
      // Script already exists, wait for it to load
      if ((window as any).TradingView) {
        script.onload?.();
      } else {
        existingScript.addEventListener('load', () => {
          script.onload?.();
        });
      }
    }

    return () => {
      // Cleanup - only remove script if we added it
      if (script.parentNode && !existingScript) {
        script.parentNode.removeChild(script);
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, category, timeframe, height, theme]);

  // Generate unique container ID
  const containerId = `tradingview_${symbol}_${category}_${timeframe}`.replace(/[^a-zA-Z0-9_]/g, '_');

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-yellow mx-auto mb-3"></div>
            <p className="text-primary-gray-lighter text-sm">Loading TradingView chart...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
          <div className="text-center p-4">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <p className="text-primary-gray-lighter text-xs">
              TradingView chart unavailable. Using fallback chart.
            </p>
          </div>
        </div>
      )}
      <div
        id={containerId}
        ref={containerRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: `${height}px` }}
      />
    </div>
  );
}

