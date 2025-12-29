'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getPortfolioStats, getUserTransactions } from '@/lib/profile-utils';
import { useETHPrice } from '@/hooks/useETHPrice';

interface PortfolioChartProps {
  address: string;
  investments?: any[];
  className?: string;
}

interface ChartDataPoint {
  date: string;
  portfolioValue: number;
  totalInvested: number;
  profit: number;
}

export default function PortfolioChart({ address, investments = [], className = '' }: PortfolioChartProps) {
  // Get ETH price for conversion
  const { price: ethPriceInEur } = useETHPrice();
  
  // Generate chart data from transactions and investments
  const chartData = useMemo(() => {
    if (!address) return [];

    const transactions = getUserTransactions(address);
    
    // Get investment transactions only
    const investmentTransactions = transactions.filter(t => 
      t.type === 'investment' && t.status === 'completed'
    );

    // If no transactions, return current portfolio value only
    if (investmentTransactions.length === 0) {
      const stats = getPortfolioStats(address);
      return [{
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolioValue: stats.totalValue,
        totalInvested: stats.totalCost,
        profit: stats.totalProfit,
      }];
    }

    // Sort transactions by date
    const sortedTransactions = [...investmentTransactions].sort((a, b) => a.timestamp - b.timestamp);

    // Generate data points: create a point for each transaction and current state
    const dataPoints: ChartDataPoint[] = [];
    let cumulativeInvested = 0;
    let cumulativeValue = 0;

    // Conversion rate (use real price or fallback)
    const ethToEur = ethPriceInEur || 25000;
    
    // Add points for each transaction
    sortedTransactions.forEach((transaction, index) => {
      let amount = parseFloat(transaction.amount);
      
      // Convert to EUR if transaction is in ETH
      if (transaction.currency === 'ETH') {
        amount = amount * ethToEur;
      }
      
      cumulativeInvested += amount;
      
      // Estimate value growth (simplified - in production, this should track actual values)
      // For now, we'll use a simple growth estimate based on interest rate
      // This is a simplified version - in production, you'd track actual portfolio values over time
      cumulativeValue += amount * 1.1; // Simplified 10% growth (should use actual interest rate)
      
      const date = new Date(transaction.timestamp);
      dataPoints.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolioValue: cumulativeValue,
        totalInvested: cumulativeInvested,
        profit: cumulativeValue - cumulativeInvested,
      });
    });

    // Add current portfolio state as final point
    const currentStats = getPortfolioStats(address);
    if (currentStats.totalValue > 0) {
      // Convert portfolio stats to EUR if needed (portfolio stats are typically in EUR already)
      dataPoints.push({
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolioValue: currentStats.totalValue,
        totalInvested: currentStats.totalCost,
        profit: currentStats.totalProfit,
      });
    }

    // If we have less than 2 points, duplicate the last point to make a visible line
    if (dataPoints.length === 1) {
      dataPoints.unshift({
        ...dataPoints[0],
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolioValue: dataPoints[0].portfolioValue * 0.95, // Slightly lower for visual effect
        profit: dataPoints[0].profit * 0.95,
      });
    }

    return dataPoints;
  }, [address, investments, ethPriceInEur]);

  const currentStats = useMemo(() => {
    if (!address) return null;
    return getPortfolioStats(address);
  }, [address]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-black border border-primary-gray-light rounded-lg p-3 shadow-lg">
          <p className="text-primary-gray-lighter text-xs mb-2">{data.date}</p>
          <div className="space-y-1">
            <p className="text-white text-sm">
              <span className="text-primary-gray-lighter">Value: </span>
              <span className="font-semibold">€{data.portfolioValue.toFixed(2)}</span>
            </p>
            <p className="text-white text-sm">
              <span className="text-primary-gray-lighter">Invested: </span>
              <span className="font-semibold">€{data.totalInvested.toFixed(2)}</span>
            </p>
            <p className={`text-sm font-semibold ${data.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              <span className="text-primary-gray-lighter">Profit: </span>
              {data.profit >= 0 ? '+' : ''}€{data.profit.toFixed(2)}
              {data.totalInvested > 0 && (
                <span className="ml-1">
                  ({((data.profit / data.totalInvested) * 100).toFixed(2)}%)
                </span>
              )}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!address || chartData.length === 0) {
    return (
      <div className={`bg-primary-gray rounded-xl p-6 border border-primary-gray-light ${className}`}>
        <div className="text-center py-8">
          <p className="text-primary-gray-lighter">No portfolio data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-primary-gray rounded-xl p-6 border border-primary-gray-light ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-accent-yellow mb-2">Portfolio Growth</h3>
        {currentStats && (
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-primary-gray-lighter">Current Value: </span>
              <span className="font-semibold text-white">
                €{currentStats.totalValue.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-primary-gray-lighter">Total Invested: </span>
              <span className="font-semibold text-white">
                €{currentStats.totalCost.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-primary-gray-lighter">Profit: </span>
              <span className={`font-semibold ${currentStats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {currentStats.totalProfit >= 0 ? '+' : ''}€{currentStats.totalProfit.toFixed(2)}
                <span className="ml-1">
                  ({currentStats.totalProfitPercent >= 0 ? '+' : ''}{currentStats.totalProfitPercent.toFixed(2)}%)
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FFB800" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6B7280" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9CA3AF' }}
            tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#9CA3AF' }}
            iconType="line"
          />
          <Area
            type="monotone"
            dataKey="portfolioValue"
            stroke="#FFB800"
            strokeWidth={2}
            fill="url(#colorValue)"
            name="Portfolio Value"
          />
          <Area
            type="monotone"
            dataKey="totalInvested"
            stroke="#6B7280"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#colorInvested)"
            name="Total Invested"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

