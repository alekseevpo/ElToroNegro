'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import Link from 'next/link';
import { useInvestmentPool } from '@/hooks/useInvestmentPool';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCryptoPrice, fetchMultipleCryptoPrices, getMockPriceData, type AssetPriceData } from '@/lib/price-api';
import { addTransaction, isKYCVerified } from '@/lib/profile-utils';
import KYCGate from './KYCGate';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  category: 'stocks' | 'commodities' | 'crypto' | 'cloud-storage' | 'innovative-projects';
  price: number;
  change: number;
  minInvestment: number;
  priceData?: AssetPriceData;
  basePrice?: number; // Base price for non-crypto assets to generate variations
}

const baseAssets: Asset[] = [
  // Stocks
  { id: '1', name: 'Apple Inc.', symbol: 'AAPL', category: 'stocks', price: 175.50, change: 2.3, minInvestment: 10, basePrice: 175.50 },
  { id: '2', name: 'Microsoft', symbol: 'MSFT', category: 'stocks', price: 378.85, change: 1.8, minInvestment: 10, basePrice: 378.85 },
  { id: '3', name: 'Google', symbol: 'GOOGL', category: 'stocks', price: 142.30, change: -0.5, minInvestment: 10, basePrice: 142.30 },
  // Commodities
  { id: '4', name: 'Gold', symbol: 'XAU', category: 'commodities', price: 2045.50, change: 0.8, minInvestment: 10, basePrice: 2045.50 },
  { id: '5', name: 'Crude Oil', symbol: 'CL', category: 'commodities', price: 82.40, change: -1.2, minInvestment: 10, basePrice: 82.40 },
  // Crypto
  { id: '6', name: 'Bitcoin', symbol: 'BTC', category: 'crypto', price: 43500.00, change: 3.5, minInvestment: 10, basePrice: 43500.00 },
  // Cloud Storage
  { id: '7', name: 'AWS Storage Pool', symbol: 'AWS-ST', category: 'cloud-storage', price: 245.00, change: 4.2, minInvestment: 25, basePrice: 245.00 },
  { id: '8', name: 'Google Cloud Storage', symbol: 'GCS', category: 'cloud-storage', price: 189.50, change: 3.1, minInvestment: 25, basePrice: 189.50 },
  { id: '9', name: 'Azure Data Centers', symbol: 'AZR-DC', category: 'cloud-storage', price: 312.75, change: 5.0, minInvestment: 25, basePrice: 312.75 },
  // Innovative Projects
  { id: '10', name: 'AI Research Lab', symbol: 'AI-RL', category: 'innovative-projects', price: 1250.00, change: 12.5, minInvestment: 50, basePrice: 1250.00 },
  { id: '11', name: 'Green Energy Tech', symbol: 'GET', category: 'innovative-projects', price: 890.00, change: 8.3, minInvestment: 50, basePrice: 890.00 },
  { id: '12', name: 'Quantum Computing', symbol: 'QC', category: 'innovative-projects', price: 2100.00, change: 15.7, minInvestment: 50, basePrice: 2100.00 },
];

function InvestmentOptionsWithContract() {
  const { user, connect } = useAuth();
  const account = user?.address || null;
  const isConnected = user?.isConnected || false;
  
  const formatAddress = useCallback((address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);
  const { 
    poolStats, 
    minInvestment, 
    investmentPeriod,
    invest, 
    getUserStats,
    getUserInvestments,
    loading: contractLoading,
    error: contractError 
  } = useInvestmentPool();

  const [assets, setAssets] = useState<Asset[]>(baseAssets);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'stocks' | 'commodities' | 'crypto' | 'cloud-storage' | 'innovative-projects'>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [userStats, setUserStats] = useState<any>(null);
  const [userInvestments, setUserInvestments] = useState<any[]>([]);
  const [isInvesting, setIsInvesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [pricesLoading, setPricesLoading] = useState(true);

  // Fetch real-time prices
  useEffect(() => {
    const loadPrices = async () => {
      setPricesLoading(true);
      try {
        // Fetch crypto prices from CoinGecko
        const cryptoAssets = baseAssets.filter(a => a.category === 'crypto');
        const cryptoPrices = await fetchMultipleCryptoPrices(cryptoAssets.map(a => a.symbol));

        // Update assets with real prices
        const updatedAssets = baseAssets.map(asset => {
          if (asset.category === 'crypto' && cryptoPrices[asset.symbol]) {
            const priceData = cryptoPrices[asset.symbol];
            return {
              ...asset,
              price: priceData.price, // Price is already in EUR from CoinGecko
              change: priceData.change24h,
              priceData,
            };
          } else if (asset.basePrice) {
            // Generate mock price variations for non-crypto assets
            const mockData = getMockPriceData(asset.basePrice);
            return {
              ...asset,
              price: mockData.price,
              change: mockData.change24h,
              priceData: mockData,
            };
          }
          return asset;
        });

        setAssets(updatedAssets);
      } catch (error) {
        console.error('Error loading prices:', error);
        // Keep base prices if API fails
      } finally {
        setPricesLoading(false);
      }
    };

    loadPrices();

    // Update prices every 30 seconds
    const interval = setInterval(loadPrices, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (account && isConnected) {
      loadUserData();
    }
  }, [account, isConnected]);

  const loadUserData = async () => {
    if (!account) return;

    try {
      const stats = await getUserStats(account);
      setUserStats(stats);

      const investments = await getUserInvestments(account);
      setUserInvestments(investments);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleInvest = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    if (!selectedAsset || !investmentAmount) {
      setMessage({ type: 'error', text: 'Please select an asset and enter investment amount' });
      return;
    }

    const amount = parseFloat(investmentAmount);
    const minAmount = parseFloat(minInvestment || '0');

    if (amount < minAmount) {
      setMessage({ type: 'error', text: `Minimum investment is ${minAmount} ETH (~€10)` });
      return;
    }

    // Check KYC for investments > €1000 (approximately 0.04 ETH at ~€25k/ETH)
    const ethToEurRate = 25000; // Approximate rate, should be fetched dynamically
    const eurAmount = amount * ethToEurRate;
    const kycRequired = eurAmount > 1000;

    if (kycRequired && account && !isKYCVerified(account)) {
      setMessage({ 
        type: 'error', 
        text: 'Identity verification is required for investments over €1,000. Please verify your identity in your profile.' 
      });
      return;
    }

    setIsInvesting(true);
    setMessage(null);

    try {
      const tx = await invest(investmentAmount);
      
      // Record transaction
      if (account && tx) {
        addTransaction(account, {
          type: 'investment',
          status: 'completed',
          amount: investmentAmount,
          currency: 'ETH',
          description: `Investment of ${investmentAmount} ETH${selectedAsset ? ` in ${selectedAsset.name}` : ''}`,
          paymentMethod: 'crypto',
          txHash: tx.hash,
          metadata: {
            assetName: selectedAsset?.name,
            assetSymbol: selectedAsset?.symbol,
          },
        });
      }
      
      setMessage({ type: 'success', text: `Successfully invested ${investmentAmount} ETH!` });
      setInvestmentAmount('');
      await loadUserData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Investment failed' });
    } finally {
      setIsInvesting(false);
    }
  };

  const filteredAssets = selectedCategory === 'all' 
    ? assets 
    : assets.filter(asset => asset.category === selectedCategory);

  const daysUntilWithdraw = investmentPeriod > 0 
    ? Math.ceil(investmentPeriod / (24 * 60 * 60))
    : 7;

  return (
    <section className="relative py-20">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-accent-yellow mb-4">
            Investment Options
          </h2>
          <p className="text-xl text-primary-gray-lighter max-w-2xl mx-auto">
            Choose from a variety of tokenized assets. Start with as little as {minInvestment || '0.004'} ETH (~€10).
          </p>
          
          {poolStats && (
            <div className="mt-6 text-sm text-gray-500">
              <p>Interest Rate: {poolStats.interestRate.toFixed(2)}% per week</p>
              <p>Investment Period: {daysUntilWithdraw} days</p>
            </div>
          )}
        </div>

        {/* Wallet Connection Status */}
        {!isConnected && (
          <div className="mb-8 p-4 bg-primary-gray border border-accent-yellow rounded-lg text-center">
            <p className="text-accent-yellow mb-4">Please connect your wallet to invest</p>
            <button
              onClick={() => connect()}
              className="px-6 py-2 bg-accent-yellow text-black rounded-lg hover:bg-accent-yellow-light"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* User Stats */}
        {isConnected && userStats && (
          <div className="mb-8 p-6 bg-primary-gray border border-primary-gray-light rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-accent-yellow">Your Investments</h3>
              <Link 
                href="/my-investments"
                className="text-sm text-primary-gray-lighter hover:text-accent-yellow font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-primary-gray-lighter">Total Investments</p>
                <p className="text-xl font-bold text-white">{userStats.totalCount}</p>
              </div>
              <div>
                <p className="text-primary-gray-lighter">Active</p>
                <p className="text-xl font-bold text-white">{userStats.activeCount}</p>
              </div>
              <div>
                <p className="text-primary-gray-lighter">Total Invested</p>
                <p className="text-xl font-bold text-white">{parseFloat(userStats.totalInvestedAmount).toFixed(4)} ETH</p>
              </div>
              <div>
                <p className="text-primary-gray-lighter">Available</p>
                <p className="text-xl font-bold text-white">{parseFloat(userStats.totalAvailableToWithdraw).toFixed(4)} ETH</p>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center mb-8 gap-3">
          {(['all', 'stocks', 'commodities', 'crypto', 'cloud-storage', 'innovative-projects'] as const).map((category) => {
            const categoryLabels: Record<string, string> = {
              'all': 'All',
              'stocks': 'Stocks',
              'commodities': 'Commodities',
              'crypto': 'Crypto',
              'cloud-storage': 'Cloud Storage',
              'innovative-projects': 'Innovative Projects'
            };
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  selectedCategory === category
                    ? 'bg-accent-yellow text-black'
                    : 'bg-primary-gray text-primary-gray-lighter hover:bg-primary-gray-light hover:text-white'
                }`}
              >
                {categoryLabels[category]}
              </button>
            );
          })}
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                selectedAsset?.id === asset.id
                  ? 'border-accent-yellow bg-primary-gray shadow-lg'
                  : 'border-primary-gray-light hover:border-accent-yellow hover:shadow-xl bg-black'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{asset.name}</h3>
                  <p className="text-sm text-primary-gray-lighter">{asset.symbol}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  asset.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                </div>
              </div>
              <div className="text-2xl font-bold text-accent-yellow mb-2">
                €{asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-primary-gray-lighter">
                Min: €{asset.minInvestment}
              </div>
              {pricesLoading && asset.priceData && (
                <div className="mt-2 text-xs text-primary-gray-lighter">Updating...</div>
              )}
            </div>
          ))}
        </div>

        {/* Investment Form */}
        {selectedAsset && (
          <div className="max-w-md mx-auto p-8 bg-primary-gray rounded-2xl border border-primary-gray-light">
            <h3 className="text-2xl font-bold text-accent-yellow mb-6 text-center">
              Invest in {selectedAsset.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
                  Investment Amount (ETH)
                </label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder={`Minimum: ${minInvestment || '0.004'} ETH`}
                  min={minInvestment || 0.004}
                  step="0.001"
                  className="w-full px-4 py-3 bg-black border border-primary-gray-light rounded-lg focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow text-white"
                  disabled={!isConnected || isInvesting}
                />
                <p className="mt-1 text-xs text-primary-gray-lighter">
                  Minimum: {minInvestment || '0.004'} ETH (~€10)
                </p>
              </div>
              
              {poolStats && investmentAmount && parseFloat(investmentAmount) >= parseFloat(minInvestment || '0') && (
                <div className="pt-4 border-t border-primary-gray-light">
                  <div className="flex justify-between text-sm text-primary-gray-lighter mb-2">
                    <span>Your Investment:</span>
                    <span className="font-medium text-white">{investmentAmount} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm text-primary-gray-lighter mb-2">
                    <span>Interest Rate:</span>
                    <span className="font-medium text-white">{poolStats.interestRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-sm text-primary-gray-lighter mb-4">
                    <span>Estimated Return:</span>
                    <span className="font-medium text-accent-yellow">
                      {((parseFloat(investmentAmount) * poolStats.interestRate) / 100).toFixed(6)} ETH
                    </span>
                  </div>
                  <div className="text-xs text-primary-gray-lighter">
                    After {daysUntilWithdraw} days you can withdraw your investment + interest
                  </div>
                </div>
              )}
              
              <button
                onClick={handleInvest}
                disabled={!isConnected || isInvesting || contractLoading || !investmentAmount}
                className="w-full py-3 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isConnected 
                  ? 'Connect Wallet' 
                  : isInvesting 
                    ? 'Investing...' 
                    : 'Invest Now'}
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {contractError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {contractError}
          </div>
        )}
          </div>
      </div>
    </section>
  );
}

export default memo(InvestmentOptionsWithContract);
