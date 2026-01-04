'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import TradingViewChart from './TradingViewChart';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface AdvancedChartProps {
  symbol: string;
  category: 'stocks' | 'commodities' | 'crypto' | 'cloud-storage' | 'innovative-projects';
  height?: number;
  useTradingView?: boolean;
}

type Timeframe = '15m' | '1h' | '4h' | '24h' | '1W' | '1M';

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '24h', label: '24h' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
];

export default function AdvancedChart({
  symbol,
  category,
  height = 500,
  useTradingView = true,
}: AdvancedChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useTradingViewChart, setUseTradingViewChart] = useState(useTradingView);
  const [fallbackError, setFallbackError] = useState(false);

  // Check if TradingView is supported for this asset (memoized to prevent infinite loops)
  const isTradingViewSupported = useMemo(() => {
    return (
      (category === 'stocks' && ['AAPL', 'MSFT', 'GOOGL'].includes(symbol.toUpperCase())) ||
      (category === 'commodities' && ['XAU', 'CL'].includes(symbol.toUpperCase())) ||
      (category === 'crypto' && ['BTC', 'ETH', 'USDT', 'WBTC', 'BNB'].includes(symbol.toUpperCase()))
    );
  }, [category, symbol]);

  // Memoize fetchChartData to prevent recreation on every render
  const fetchChartData = useCallback(async () => {
    setIsLoading(true);
    setFallbackError(false);

    try {
      // Calculate days based on timeframe
      const daysMap: Record<Timeframe, number> = {
        '15m': 1, // Last 24 hours for 15m intervals
        '1h': 7, // Last week for 1h intervals
        '4h': 14, // Last 2 weeks for 4h intervals
        '24h': 30, // Last month for daily intervals
        '1W': 90, // Last 3 months for weekly intervals
        '1M': 365, // Last year for monthly intervals
      };

      const days = daysMap[timeframe] || 30;
      const categoryParam = category === 'stocks' ? 'stocks' : 
                           category === 'commodities' ? 'commodities' : 
                           category === 'crypto' ? 'crypto' : 'stocks';

      const response = await fetch(
        `/api/assets/${symbol}/history?category=${categoryParam}&days=${days}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        setChartData(data);
      } else {
        setFallbackError(true);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setFallbackError(true);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, symbol, category]);

  // Use ref to prevent infinite loops
  const isFetchingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) return;

    if (!useTradingViewChart || !isTradingViewSupported) {
      // Fetch data for fallback chart
      isFetchingRef.current = true;
      fetchChartData().finally(() => {
        isFetchingRef.current = false;
      });
    } else {
      // Clear chart data when using TradingView
      setChartData([]);
      setIsLoading(false);
      setFallbackError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, symbol, category, useTradingViewChart, isTradingViewSupported]);

  const handleTradingViewError = useCallback(() => {
    setUseTradingViewChart(false);
    fetchChartData();
  }, [fetchChartData]);

  const isPositive = chartData.length > 0 
    ? chartData[chartData.length - 1]?.price >= (chartData[0]?.price || 0)
    : true;
  const chartColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <div className="w-full">
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {/* TradingView Toggle */}
          {isTradingViewSupported && (
            <button
              onClick={() => {
                setUseTradingViewChart(!useTradingViewChart);
                if (!useTradingViewChart) {
                  setFallbackError(false);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                useTradingViewChart
                  ? 'bg-accent-yellow text-black'
                  : 'bg-primary-gray-light text-primary-gray-lighter hover:bg-primary-gray'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                TradingView
              </span>
            </button>
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2 bg-primary-gray-light rounded-lg p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                timeframe === tf.value
                  ? 'bg-accent-yellow text-black'
                  : 'text-primary-gray-lighter hover:text-white hover:bg-primary-gray'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-black rounded-xl p-4 border border-primary-gray-light">
        {useTradingViewChart && isTradingViewSupported ? (
          <TradingViewChart
            symbol={symbol}
            category={category as 'stocks' | 'commodities' | 'crypto'}
            timeframe={timeframe}
            height={height}
            theme="dark"
          />
        ) : (
          <>
            {isLoading ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-yellow mx-auto mb-3"></div>
                  <p className="text-primary-gray-lighter text-sm">Loading chart data...</p>
                </div>
              </div>
            ) : fallbackError || chartData.length === 0 ? (
              <div className="h-[500px] flex items-center justify-center text-primary-gray-lighter">
                <div className="text-center">
                  <p className="mb-2">Chart data unavailable</p>
                  <button
                    onClick={fetchChartData}
                    className="px-4 py-2 bg-accent-yellow text-black rounded-lg text-sm font-medium hover:bg-accent-yellow-light transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`color${symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: '#9ca3af' }}
                    domain={['dataMin - 5%', 'dataMax + 5%']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill={`url(#color${symbol})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </div>
    </div>
  );
}

