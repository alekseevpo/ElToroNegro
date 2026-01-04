'use client';

import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useInvestmentPool } from '@/hooks/useInvestmentPool';
import { useAuth } from '@/contexts/AuthContext';
import { useMultipleCryptoPrices } from '@/hooks/useCryptoPrices';
import { useMultipleStockPrices, useMultipleCommodityPrices } from '@/hooks/useStockPrices';
import { getMockPriceData, fetchStockPrice, fetchCommodityPrice, type AssetPriceData } from '@/lib/price-api';
import { addTransaction, addToPortfolio, isKYCVerified } from '@/lib/profile-utils';
import dynamic from 'next/dynamic';
import KYCGate from './KYCGate';
import { useToast } from '@/hooks/useToast';
import QuickViewModal from './QuickViewModal';
import { useRouter } from 'next/navigation';

// Lazy load CardPaymentForm - only load when needed (contains Stripe.js)
const CardPaymentForm = dynamic(() => import('./CardPaymentForm'), {
  ssr: false,
});
import { useETHPrice } from '@/hooks/useETHPrice';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';

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
  // Stocks - Base prices are fallback values (updated Jan 2025)
  // Real prices come from API when available
  { id: '1', name: 'Apple Inc.', symbol: 'AAPL', category: 'stocks', price: 272.10, change: -0.44, minInvestment: 10, basePrice: 272.10 },
  { id: '2', name: 'Microsoft', symbol: 'MSFT', category: 'stocks', price: 420.00, change: 1.2, minInvestment: 10, basePrice: 420.00 },
  { id: '3', name: 'Google', symbol: 'GOOGL', category: 'stocks', price: 155.00, change: -0.3, minInvestment: 10, basePrice: 155.00 },
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

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'stocks' | 'commodities' | 'crypto' | 'cloud-storage' | 'innovative-projects'>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [quickViewModalOpen, setQuickViewModalOpen] = useState(false);
  const [assetForQuickView, setAssetForQuickView] = useState<Asset | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const router = useRouter();
  const [userStats, setUserStats] = useState<any>(null);
  const [userInvestments, setUserInvestments] = useState<any[]>([]);
  const [isInvesting, setIsInvesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  
  // Get real-time ETH price in USD
  const { price: ethPriceInUsd, isLoading: ethPriceLoading } = useETHPrice();
  
  // Мемоизируем списки активов по категориям
  const cryptoAssets = useMemo(() => baseAssets.filter(a => a.category === 'crypto'), []);
  const stockAssets = useMemo(() => baseAssets.filter(a => a.category === 'stocks'), []);
  const commodityAssets = useMemo(() => baseAssets.filter(a => a.category === 'commodities'), []);
  
  const cryptoSymbols = useMemo(() => cryptoAssets.map(a => a.symbol), [cryptoAssets]);
  const stockSymbols = useMemo(() => stockAssets.map(a => a.symbol), [stockAssets]);
  const commoditySymbols = useMemo(() => commodityAssets.map(a => a.symbol), [commodityAssets]);
  
  const { data: cryptoPrices = {}, isLoading: cryptoPricesLoading } = useMultipleCryptoPrices(cryptoSymbols);
  const { data: stockPrices = {}, isLoading: stockPricesLoading } = useMultipleStockPrices(stockSymbols);
  const { data: commodityPrices = {}, isLoading: commodityPricesLoading } = useMultipleCommodityPrices(commoditySymbols);
  
  const pricesLoading = cryptoPricesLoading || stockPricesLoading || commodityPricesLoading;

  // Мемоизируем mock данные для не-крипто активов, чтобы избежать бесконечных ререндеров
  // Используем asset.id как seed для детерминированной генерации (избегаем проблем гидратации)
  const mockPriceCache = useMemo(() => {
    const cache: Record<string, AssetPriceData> = {};
    baseAssets.forEach(asset => {
      if (asset.basePrice && asset.category !== 'crypto') {
        // Генерируем стабильные mock данные один раз с детерминированным seed
        cache[asset.id] = getMockPriceData(asset.basePrice, 0.02, asset.id);
      }
    });
    return cache;
  }, []);

  // Обновляем цены активов при изменении данных из React Query
  // Используем useMemo для вычисления assets, чтобы избежать лишних ререндеров
  // Используем assets напрямую в рендере вместо state, чтобы избежать бесконечных циклов
  // ВАЖНО: На сервере cryptoPrices будет пустым, поэтому используем начальные значения из baseAssets
  const assets = useMemo(() => {
    // На сервере (SSR) cryptoPrices пустой, поэтому используем начальные значения
    const isServer = typeof window === 'undefined';
    
    return baseAssets.map(asset => {
      // Для крипто-активов: используем реальные цены только на клиенте, если они доступны
      if (asset.category === 'crypto' && !isServer && cryptoPrices[asset.symbol]) {
        const priceData = cryptoPrices[asset.symbol];
        return {
          ...asset,
          price: priceData.price, // Price is already in USD from CoinGecko
          change: priceData.change24h,
          priceData,
        };
      } 
      // Для акций: используем реальные цены из API
      else if (asset.category === 'stocks' && !isServer && stockPrices[asset.symbol]) {
        const priceData = stockPrices[asset.symbol];
        // Only use API data if it's valid and recent (within last 2 hours)
        if (priceData && priceData.price > 0 && priceData.lastUpdated && (Date.now() - priceData.lastUpdated) < 7200000) {
          return {
            ...asset,
            price: priceData.price, // Price is in USD from API
            change: priceData.change24h,
            priceData,
          };
        }
        // If API data is stale or invalid, log warning and use basePrice
        if (isServer === false) {
          console.warn(`Stock price API data for ${asset.symbol} is stale or invalid. Using base price: $${asset.basePrice}`);
        }
      }
      // Для товаров: используем реальные цены из CoinGecko
      else if (asset.category === 'commodities' && !isServer && commodityPrices[asset.symbol]) {
        const priceData = commodityPrices[asset.symbol];
        return {
          ...asset,
          price: priceData.price, // Price is in USD from CoinGecko
          change: priceData.change24h,
          priceData,
        };
      }
      // Fallback: используем mock данные только если реальные данные недоступны
      else if (asset.basePrice && asset.category !== 'crypto' && asset.category !== 'stocks' && asset.category !== 'commodities') {
        // Для cloud-storage и innovative-projects используем mock данные
        const mockData = mockPriceCache[asset.id] || getMockPriceData(asset.basePrice, 0.02, asset.id);
        return {
          ...asset,
          price: mockData.price,
          change: mockData.change24h,
          priceData: mockData,
        };
      }
      // Если реальные данные еще не загружены, используем начальные значения
      return asset;
    });
  }, [cryptoPrices, stockPrices, commodityPrices, mockPriceCache]);

  // Мемоизируем loadUserData чтобы избежать бесконечных циклов
  const loadUserData = useCallback(async () => {
    if (!account) return;

    try {
      const stats = await getUserStats(account);
      setUserStats(stats);

      const investments = await getUserInvestments(account);
      setUserInvestments(investments);
    } catch (error) {
      logger.error('Error loading user data', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]); // getUserStats и getUserInvestments стабильны из хука

  useEffect(() => {
    if (account && isConnected) {
      loadUserData();
    }
  }, [account, isConnected, loadUserData]);

  const handleInvest = async () => {
    if (paymentMethod === 'card') {
      // Card payment is handled by CardPaymentForm's onSuccess callback
      return;
    }

    if (!isConnected) {
      await connect();
      return;
    }

    if (!selectedAsset || !investmentAmount) {
      setMessage({ type: 'error', text: 'Please select an asset and enter investment amount' });
      setValidationError('Please enter an investment amount');
      return;
    }

    const amount = parseFloat(investmentAmount);
    
    // Validate amount
    if (isNaN(amount)) {
      setMessage({ type: 'error', text: 'Please enter a valid number' });
      setValidationError('Please enter a valid number');
      return;
    }
    
    if (amount <= 0) {
      setMessage({ type: 'error', text: 'Amount must be greater than 0' });
      setValidationError('Amount must be greater than 0');
      return;
    }
    
    const minAmount = parseFloat(minInvestment || '0');
    if (amount < minAmount) {
      const errorMsg = `Minimum investment is ${minAmount} ETH${ethPriceInUsd ? ` (~$${(minAmount * ethPriceInUsd).toFixed(2)})` : ''}`;
      setMessage({ type: 'error', text: errorMsg });
      setValidationError(errorMsg);
      return;
    }
    
    // Clear validation error if all checks pass
    setValidationError(null);

    // Check KYC for investments > $1000
    // Use real-time ETH price or fallback to 2500 if not available
    const ethToUsdRate = ethPriceInUsd || 2500;
    const usdAmount = amount * ethToUsdRate;
    const kycRequired = usdAmount > 1000;

    if (kycRequired && account && !isKYCVerified(account)) {
      setMessage({ 
        type: 'error', 
        text: 'Identity verification is required for investments over $1,000. Please verify your identity in your profile.' 
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

  // Handle successful card payment
  const handleCardPaymentSuccess = async (paymentIntentId: string, amount: number) => {
    if (!selectedAsset || !account) {
      showError('Please select an asset and ensure you are logged in');
      return;
    }

    // Convert USD to ETH using real-time rate
    // Use real-time ETH price or fallback to 2500 if not available
    const ethToUsdRate = ethPriceInUsd || 2500;
    const ethAmount = (amount / ethToUsdRate).toFixed(6);

    setIsInvesting(true);
    setMessage(null);

    try {
      // Record transaction for card payment
      addTransaction(account, {
        type: 'investment',
        status: 'completed',
        amount: ethAmount,
        currency: 'USD',
        description: `Investment of $${amount.toFixed(2)}${selectedAsset ? ` in ${selectedAsset.name}` : ''}`,
        paymentMethod: 'card',
        stripeSessionId: paymentIntentId,
        metadata: {
          assetName: selectedAsset?.name,
          assetSymbol: selectedAsset?.symbol,
          usdAmount: amount,
          ethAmount: ethAmount,
        },
      });

      // Add to portfolio
      const portfolioType = selectedAsset.category === 'crypto' ? 'crypto' : 
                           selectedAsset.category === 'stocks' ? 'stock' : 
                           selectedAsset.category === 'commodities' ? 'commodity' : 
                           'stock'; // Default for cloud-storage and innovative-projects
      
      addToPortfolio(account, {
        symbol: selectedAsset.symbol,
        name: selectedAsset.name,
        type: portfolioType,
        quantity: parseFloat(ethAmount),
        purchasePrice: parseFloat(ethAmount),
        currentPrice: parseFloat(ethAmount),
        totalCost: parseFloat(ethAmount),
        purchaseDate: Date.now(),
        currency: 'USD',
        interestEarned: 0,
      });

      showSuccess(`Successfully invested $${amount.toFixed(2)} (${ethAmount} ETH) in ${selectedAsset.name}!`);
      setMessage({ type: 'success', text: `Successfully invested $${amount.toFixed(2)}!` });
      setInvestmentAmount('');
      await loadUserData();
    } catch (error: unknown) {
      const { message } = handleError(error);
      logger.error('Error processing card payment', error, { assetId: selectedAsset?.id, amount });
      showError(message || 'Failed to process investment');
      setMessage({ type: 'error', text: message || 'Failed to process investment' });
    } finally {
      setIsInvesting(false);
    }
  };

  const handleCardPaymentError = (error: string) => {
    showError(error);
    setMessage({ type: 'error', text: error });
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
        <div className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-accent-yellow mb-4">
            Investment Options
          </h2>
          <p className="text-xl text-primary-gray-lighter max-w-2xl mx-auto">
            Choose from a variety of tokenized assets. Start with as little as {minInvestment || '0.004'} ETH (~$10).
          </p>
          
          {/* ETH Price Display */}
          {ethPriceInUsd && (
            <div className="mt-4 text-sm text-primary-gray-lighter">
              <span className="text-accent-yellow font-medium">Current ETH Price: </span>
              <span>${ethPriceInUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              {ethPriceLoading && (
                <span className="ml-2 text-xs text-primary-gray-lighter">(updating...)</span>
              )}
            </div>
          )}
          
          {poolStats && (
            <div className="mt-6 text-sm text-gray-500">
              <p>Interest Rate: {poolStats.interestRate.toFixed(2)}% per week</p>
              <p>Investment Period: {daysUntilWithdraw} days</p>
            </div>
          )}
        </div>

        {/* Wallet Connection Status */}
        {!isConnected && (
          <div className="mb-8 text-center">
            <p className="text-accent-yellow mb-4">Please connect your wallet to invest</p>
            <button
              onClick={() => connect()}
              className="px-6 py-2 bg-accent-yellow text-black rounded-lg hover:bg-accent-yellow-light animate-pulse-heartbeat"
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
              onClick={() => {
                // Navigate to asset detail page
                router.push(`/assets/${asset.symbol.toLowerCase()}`);
              }}
              className="p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] border-primary-gray-light hover:border-accent-yellow hover:shadow-xl bg-black"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{asset.name}</h3>
                  <p className="text-sm text-primary-gray-lighter">{asset.symbol}</p>
                </div>
                <div 
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    asset.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                  suppressHydrationWarning
                >
                  {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                </div>
              </div>
              <div 
                className="text-2xl font-bold text-accent-yellow mb-2"
                suppressHydrationWarning
              >
                ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-primary-gray-lighter">
                Min: ${asset.minInvestment}
              </div>
              {pricesLoading && asset.priceData && (
                <div className="mt-2 text-xs text-primary-gray-lighter">Updating...</div>
              )}
              {asset.category === 'stocks' && !asset.priceData && !pricesLoading && (
                <div className="mt-2 text-xs text-yellow-400/70 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Price may not be real-time
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-primary-gray-light">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssetForQuickView(asset);
                    setQuickViewModalOpen(true);
                  }}
                  className="w-full py-2 bg-accent-yellow text-black font-semibold rounded-lg hover:bg-accent-yellow-light transition-colors"
                >
                  Quick View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick View Modal */}
        <QuickViewModal
          asset={assetForQuickView}
          isOpen={quickViewModalOpen}
          onClose={() => {
            setQuickViewModalOpen(false);
            setAssetForQuickView(null);
          }}
        />

        {/* Investment Form */}
        {selectedAsset && (
          <div className="max-w-md mx-auto p-8 bg-primary-gray rounded-2xl border border-primary-gray-light">
            <h3 className="text-2xl font-bold text-accent-yellow mb-6 text-center">
              Invest in {selectedAsset.name}
            </h3>
            <div className="space-y-4">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === 'wallet'
                        ? 'border-accent-yellow bg-black'
                        : 'border-primary-gray-light hover:border-accent-yellow'
                    }`}
                  >
                    <div className="text-lg mb-1">💼</div>
                    <div className="font-semibold text-white text-sm">Wallet</div>
                    <div className="text-xs text-primary-gray-lighter">ETH</div>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-accent-yellow bg-black'
                        : 'border-primary-gray-light hover:border-accent-yellow'
                    }`}
                  >
                    <div className="text-lg mb-1">💳</div>
                    <div className="font-semibold text-white text-sm">Card</div>
                    <div className="text-xs text-primary-gray-lighter">USD</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
                  Investment Amount {paymentMethod === 'wallet' ? '(ETH)' : '(USD)'}
                </label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInvestmentAmount(value);
                    setValidationError(null);
                    
                    // Real-time validation
                    if (value && value.trim() !== '') {
                      const numValue = parseFloat(value);
                      
                      // Check if it's a valid number
                      if (isNaN(numValue)) {
                        setValidationError('Please enter a valid number');
                        return;
                      }
                      
                      // Check if it's negative
                      if (numValue < 0) {
                        setValidationError('Amount cannot be negative');
                        return;
                      }
                      
                      // Check minimum amount
                      const minAmount = paymentMethod === 'wallet' 
                        ? parseFloat(minInvestment || '0.004')
                        : 10;
                      
                      if (numValue > 0 && numValue < minAmount) {
                        setValidationError(
                          paymentMethod === 'wallet'
                            ? `Minimum investment is ${minAmount} ETH`
                            : `Minimum investment is $${minAmount}`
                        );
                        return;
                      }
                      
                      // Check for very large numbers (reasonable limit)
                      if (numValue > 1000000) {
                        setValidationError('Amount is too large. Please contact support for large investments.');
                        return;
                      }
                    }
                  }}
                  placeholder={paymentMethod === 'wallet' 
                    ? `Minimum: ${minInvestment || '0.004'} ETH`
                    : 'Minimum: $10'}
                  min={paymentMethod === 'wallet' ? (minInvestment || 0.004) : 10}
                  step={paymentMethod === 'wallet' ? '0.001' : '0.01'}
                  className={`w-full px-4 py-3 bg-black border rounded-lg focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow text-white ${
                    validationError 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-primary-gray-light'
                  }`}
                  disabled={paymentMethod === 'wallet' ? (!isConnected || isInvesting) : isInvesting}
                />
                {validationError && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {validationError}
                  </p>
                )}
                {!validationError && (
                  <p className="mt-1 text-xs text-primary-gray-lighter">
                    Minimum: {paymentMethod === 'wallet' 
                      ? ethPriceInUsd 
                        ? `${minInvestment || '0.004'} ETH (~$${((parseFloat(minInvestment || '0.004')) * ethPriceInUsd).toFixed(2)})`
                        : `${minInvestment || '0.004'} ETH (~$10)`
                      : '$10'}
                  </p>
                )}
              </div>
              
              {poolStats && investmentAmount && parseFloat(investmentAmount) >= (paymentMethod === 'wallet' ? parseFloat(minInvestment || '0') : 10) && (
                <div className="pt-4 border-t border-primary-gray-light">
                  <div className="flex justify-between text-sm text-primary-gray-lighter mb-2">
                    <span>Your Investment:</span>
                    <span className="font-medium text-white">
                      {paymentMethod === 'wallet' 
                        ? `${investmentAmount} ETH${ethPriceInUsd ? ` (~$${(parseFloat(investmentAmount) * ethPriceInUsd).toFixed(2)})` : ''}`
                        : `$${investmentAmount}${ethPriceInUsd ? ` (~${(parseFloat(investmentAmount) / ethPriceInUsd).toFixed(6)} ETH)` : ''}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-primary-gray-lighter mb-2">
                    <span>Interest Rate:</span>
                    <span className="font-medium text-white">{poolStats.interestRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-sm text-primary-gray-lighter mb-4">
                    <span>Estimated Return:</span>
                    <span className="font-medium text-accent-yellow">
                      {paymentMethod === 'wallet'
                        ? `${((parseFloat(investmentAmount) * poolStats.interestRate) / 100).toFixed(6)} ETH`
                        : `$${((parseFloat(investmentAmount) * poolStats.interestRate) / 100).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="text-xs text-primary-gray-lighter">
                    After {daysUntilWithdraw} days you can withdraw your investment + interest
                  </div>
                </div>
              )}
              
              {/* Payment Form or Invest Button */}
              {(() => {
                const amount = parseFloat(investmentAmount || '0');
                // Use real-time ETH price or fallback to 2500 if not available
                const ethToUsdRate = ethPriceInUsd || 2500;
                const usdAmount = paymentMethod === 'wallet' 
                  ? amount * ethToUsdRate 
                  : amount;
                const kycRequired = usdAmount > 1000;
                const isVerified = account ? isKYCVerified(account) : false;
                const isUserLoggedIn = account && (isConnected || user?.authType === 'google');

                // Card payment form
                if (paymentMethod === 'card') {
                  if (!isUserLoggedIn) {
                    return (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-300 text-sm mb-3">Please log in to pay with card</p>
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                          className="w-full py-3 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light transition-colors"
                        >
                          Log In
                        </button>
                      </div>
                    );
                  }

                  // Validate amount for card payment
                  if (!amount || amount <= 0) {
                    return (
                      <div className="p-4 bg-primary-gray-light border border-primary-gray-light rounded-lg">
                        <p className="text-primary-gray-lighter text-sm">Please enter an amount</p>
                      </div>
                    );
                  }
                  
                  if (amount < 10) {
                    return (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-300 text-sm font-medium mb-1">Amount below minimum</p>
                        <p className="text-red-300/80 text-xs">Minimum investment is $10</p>
                      </div>
                    );
                  }
                  
                  if (amount > 1000000) {
                    return (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-300 text-sm font-medium mb-1">Amount is very large</p>
                        <p className="text-yellow-300/80 text-xs">For investments over $1,000,000, please contact support</p>
                      </div>
                    );
                  }

                  if (kycRequired && !isVerified) {
                    return (
                      <KYCGate 
                        requiredAmount={1000}
                        message={`To invest $${amount.toFixed(2)}, identity verification is required. This helps us comply with financial regulations and protect all users.`}
                      >
                        <CardPaymentForm
                          amount={amount}
                          onSuccess={handleCardPaymentSuccess}
                          onError={handleCardPaymentError}
                          metadata={{
                            assetName: selectedAsset?.name,
                            assetSymbol: selectedAsset?.symbol,
                            userId: account,
                          }}
                        />
                      </KYCGate>
                    );
                  }

                  return (
                    <>
                      {kycRequired && isVerified && (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                          <div className="flex items-center gap-2 text-sm text-green-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Your identity is verified. You can proceed with this investment.</span>
                          </div>
                        </div>
                      )}
                      {!kycRequired && amount > 0 && usdAmount > 500 && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                          <div className="flex items-start gap-2 text-sm text-yellow-300">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <p className="font-medium mb-1">Identity verification recommended</p>
                              <p className="text-xs text-yellow-300/80">For investments over $1,000, identity verification is required. Consider verifying now to avoid delays.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <CardPaymentForm
                        amount={amount}
                        onSuccess={handleCardPaymentSuccess}
                        onError={handleCardPaymentError}
                        metadata={{
                          assetName: selectedAsset?.name,
                          assetSymbol: selectedAsset?.symbol,
                          userId: account,
                        }}
                      />
                    </>
                  );
                }

                // Wallet payment button
                if (kycRequired && !isVerified && isConnected) {
                  return (
                    <KYCGate 
                      requiredAmount={1000}
                      message={`To invest ${amount.toFixed(4)} ETH (~$${usdAmount.toFixed(2)}), identity verification is required. This helps us comply with financial regulations and protect all users.`}
                    >
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
                    </KYCGate>
                  );
                }

                return (
                  <>
                    {kycRequired && isVerified && (
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-sm text-green-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Your identity is verified. You can proceed with this investment.</span>
                        </div>
                      </div>
                    )}
                    {!kycRequired && amount > 0 && usdAmount > 500 && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                        <div className="flex items-start gap-2 text-sm text-yellow-300">
                          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <p className="font-medium mb-1">Identity verification recommended</p>
                            <p className="text-xs text-yellow-300/80">For investments over $1,000, identity verification is required. Consider verifying now to avoid delays.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleInvest}
                      disabled={
                        !isConnected || 
                        isInvesting || 
                        contractLoading || 
                        !investmentAmount || 
                        !!validationError ||
                        (paymentMethod === 'wallet' && parseFloat(investmentAmount) < parseFloat(minInvestment || '0'))
                      }
                      className="w-full py-3 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {!isConnected 
                        ? 'Connect Wallet' 
                        : isInvesting 
                          ? 'Investing...' 
                          : validationError
                            ? 'Fix errors to continue'
                            : 'Invest Now'}
                    </button>
                  </>
                );
              })()}
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
