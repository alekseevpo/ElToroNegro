'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdvancedChart from '@/components/AdvancedChart';
import { useMultipleStockPrices, useMultipleCommodityPrices } from '@/hooks/useStockPrices';
import { useMultipleCryptoPrices } from '@/hooks/useCryptoPrices';

// Asset descriptions
const assetDescriptions: Record<string, string> = {
  'AAPL': 'Apple Inc. is a multinational technology company that designs, develops, and sells consumer electronics, computer software, and online services. Known for innovative products like iPhone, iPad, Mac, and services like Apple Music and iCloud.',
  'MSFT': 'Microsoft Corporation is a technology company that develops, manufactures, licenses, supports and sells computer software, consumer electronics and personal computers. Best known for Windows OS, Office suite, Azure cloud services, and Xbox gaming.',
  'GOOGL': 'Alphabet Inc. (Google) is a multinational technology conglomerate. It provides internet-related services and products, including search engine, cloud computing, software, and hardware. Major products include Google Search, YouTube, Android, and Google Cloud.',
  'XAU': 'Gold is a precious metal that has been used as a store of value and medium of exchange for thousands of years. It is considered a safe-haven asset and hedge against inflation and currency fluctuations.',
  'CL': 'Crude Oil is a naturally occurring petroleum product composed of hydrocarbon deposits. It is a major energy source and commodity, with prices influenced by supply, demand, geopolitical events, and economic conditions.',
  'BTC': 'Bitcoin is the first and largest cryptocurrency by market capitalization. It is a decentralized digital currency that operates on a peer-to-peer network without a central authority. Known for its limited supply of 21 million coins.',
};

// Base assets data
const baseAssets: Record<string, any> = {
  'AAPL': { name: 'Apple Inc.', symbol: 'AAPL', category: 'stocks', minInvestment: 10, basePrice: 272.10 },
  'MSFT': { name: 'Microsoft', symbol: 'MSFT', category: 'stocks', minInvestment: 10, basePrice: 420.00 },
  'GOOGL': { name: 'Google', symbol: 'GOOGL', category: 'stocks', minInvestment: 10, basePrice: 155.00 },
  'XAU': { name: 'Gold', symbol: 'XAU', category: 'commodities', minInvestment: 10, basePrice: 2045.50 },
  'CL': { name: 'Crude Oil', symbol: 'CL', category: 'commodities', minInvestment: 10, basePrice: 82.40 },
  'BTC': { name: 'Bitcoin', symbol: 'BTC', category: 'crypto', minInvestment: 10, basePrice: 43500.00 },
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params.symbol as string)?.toUpperCase();
  
  const [asset, setAsset] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // Fetch prices
  const { data: stockPrices = {} } = useMultipleStockPrices(symbol && baseAssets[symbol]?.category === 'stocks' ? [symbol] : []);
  const { data: commodityPrices = {} } = useMultipleCommodityPrices(symbol && baseAssets[symbol]?.category === 'commodities' ? [symbol] : []);
  const { data: cryptoPrices = {} } = useMultipleCryptoPrices(symbol && baseAssets[symbol]?.category === 'crypto' ? [symbol] : []);

  // Memoize price data to prevent unnecessary re-renders
  const priceData = useMemo(() => {
    if (!symbol || !baseAssets[symbol]) return null;
    
    const baseAsset = baseAssets[symbol];
    let price = baseAsset.basePrice;
    let change = 0;
    let priceDataObj = null;

    // Get real price from API
    if (baseAsset.category === 'stocks' && stockPrices[symbol]) {
      priceDataObj = stockPrices[symbol];
      price = priceDataObj.price;
      change = priceDataObj.change24h;
    } else if (baseAsset.category === 'commodities' && commodityPrices[symbol]) {
      priceDataObj = commodityPrices[symbol];
      price = priceDataObj.price;
      change = priceDataObj.change24h;
    } else if (baseAsset.category === 'crypto' && cryptoPrices[symbol]) {
      priceDataObj = cryptoPrices[symbol];
      price = priceDataObj.price;
      change = priceDataObj.change24h;
    }

    return {
      ...baseAsset,
      price,
      change,
      priceData: priceDataObj,
    };
  }, [symbol, stockPrices, commodityPrices, cryptoPrices]);

  // Use ref to track previous asset to prevent unnecessary updates
  const prevAssetRef = useRef<any>(null);

  useEffect(() => {
    if (!symbol || !baseAssets[symbol]) {
      router.push('/');
      return;
    }

    // Only update if asset data actually changed
    if (priceData && (
      !prevAssetRef.current ||
      prevAssetRef.current.price !== priceData.price ||
      prevAssetRef.current.change !== priceData.change ||
      prevAssetRef.current.symbol !== priceData.symbol
    )) {
      setAsset(priceData);
      prevAssetRef.current = priceData;
    }
  }, [symbol, priceData, router]);

  useEffect(() => {
    if (!asset) return;

    // AbortController to cancel requests if component unmounts or asset changes
    const abortController = new AbortController();

    // Fetch news from API
    setIsLoadingNews(true);
    fetch(`/api/assets/${asset.symbol}/news?category=${asset.category}`, {
      signal: abortController.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((newsData) => {
        if (abortController.signal.aborted) return;
        setNews(Array.isArray(newsData) ? newsData : []);
        setIsLoadingNews(false);
      })
      .catch((error) => {
        if (abortController.signal.aborted) return;
        if (error.name !== 'AbortError') {
          console.error('Error fetching news:', error);
        }
        setNews([]);
        setIsLoadingNews(false);
      });

    // Cleanup: cancel requests if component unmounts or asset changes
    return () => {
      abortController.abort();
    };
  }, [asset?.symbol, asset?.category]);

  if (!asset) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-yellow mx-auto mb-4"></div>
            <p className="text-primary-gray-lighter">Loading asset information...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const isPositive = asset.change >= 0;
  const description = assetDescriptions[asset.symbol] || `Investment opportunity in ${asset.name}.`;

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="relative py-20">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-primary-gray-lighter hover:text-accent-yellow transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Investments
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white">{asset.name}</h1>
              <span className="px-4 py-2 bg-primary-gray-light rounded-lg text-sm text-primary-gray-lighter">
                {asset.symbol}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-accent-yellow">
                ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`px-4 py-2 rounded-lg text-lg font-semibold ${
                isPositive 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {isPositive ? '+' : ''}{asset.change.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-primary-gray rounded-2xl p-6 border border-primary-gray-light">
                <h2 className="text-2xl font-bold text-white mb-4">About</h2>
                <p className="text-primary-gray-lighter leading-relaxed">{description}</p>
              </div>

              {/* Chart */}
              <div className="bg-primary-gray rounded-2xl p-6 border border-primary-gray-light">
                <h2 className="text-2xl font-bold text-white mb-4">Price Chart</h2>
                <AdvancedChart
                  symbol={asset.symbol}
                  category={asset.category}
                  height={500}
                  useTradingView={true}
                />
              </div>

              {/* News Section */}
              <div className="bg-primary-gray rounded-2xl p-6 border border-primary-gray-light">
                <h2 className="text-2xl font-bold text-white mb-4">Latest News</h2>
                {isLoadingNews ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-yellow mx-auto mb-3"></div>
                      <p className="text-primary-gray-lighter text-sm">Loading news...</p>
                    </div>
                  </div>
                ) : news.length > 0 ? (
                  <div className="space-y-4">
                    {news.map((item, index) => (
                      <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-black rounded-xl border border-primary-gray-light hover:border-accent-yellow transition-colors group"
                      >
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.title}
                            className="w-full h-48 object-cover rounded-lg mb-3"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-accent-yellow transition-colors">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-primary-gray-lighter mb-2 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-primary-gray-lighter">
                          <span>{item.source}</span>
                          <span>{new Date(item.publishedAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-primary-gray-lighter">
                    No news available at the moment
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Investment Info */}
              <div className="bg-primary-gray rounded-2xl p-6 border border-primary-gray-light">
                <h3 className="text-xl font-bold text-white mb-4">Investment Details</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-primary-gray-lighter mb-1">Minimum Investment</div>
                    <div className="text-2xl font-bold text-white">${asset.minInvestment.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-primary-gray-lighter mb-1">Current Price</div>
                    <div className="text-2xl font-bold text-white">
                      ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-primary-gray-lighter mb-1">24h Change</div>
                    <div className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{asset.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="w-full mt-6 py-3 bg-accent-yellow text-black font-semibold rounded-lg hover:bg-accent-yellow-light transition-colors"
                >
                  Invest Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}


