'use client';

import { memo } from 'react';
import { useCryptoMarkets } from '@/hooks/useCryptoPrices';

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
}

function Features() {
  // Используем React Query для кэширования и управления состоянием
  const { data: cryptoData = [], isLoading: loading, error } = useCryptoMarkets(['bitcoin', 'ethereum', 'binancecoin']);

  // Fallback данные в случае ошибки
  const fallbackData: CryptoData[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: 43500, change24h: 2.5, marketCap: 850000000000 },
    { symbol: 'ETH', name: 'Ethereum', price: 2650, change24h: 1.8, marketCap: 320000000000 },
    { symbol: 'BNB', name: 'Binance Coin', price: 315, change24h: -0.5, marketCap: 47000000000 },
  ];

  const displayData = error ? fallbackData : cryptoData;

  const features = [
    {
      title: 'Low Minimum Investment',
      description: 'Start with just €10. No barriers to entry.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Weekly Returns',
      description: 'Invest for one week and earn returns. Flexible terms.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: 'Diverse Assets',
      description: 'Stocks, commodities, crypto. All in one platform.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      title: 'Transparent',
      description: 'All transactions on blockchain. Fully auditable.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      title: 'Secure',
      description: 'Smart contracts ensure your funds are safe.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Easy Withdrawal',
      description: 'Withdraw your funds plus returns anytime after 7 days.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="relative py-20">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm"></div>
      <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-accent-yellow mb-4">
            Why Choose Us
          </h2>
          <p className="text-xl text-primary-gray-lighter max-w-2xl mx-auto">
            We make investing accessible, transparent, and profitable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-8 bg-primary-gray rounded-2xl border-2 border-primary-gray-light hover:border-accent-yellow hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-black border-2 border-primary-gray-light rounded-xl flex items-center justify-center text-accent-yellow mb-5 group-hover:border-accent-yellow transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-primary-gray-lighter leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Crypto Market Data from CoinMarketCap/CoinGecko */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-accent-yellow mb-2">
              Top Cryptocurrencies
            </h3>
            <p className="text-primary-gray-lighter">
              Real-time data from CoinGecko API
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-yellow"></div>
              <p className="mt-4 text-primary-gray-lighter">Loading market data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayData.map((crypto, index) => (
                <div 
                  key={index}
                  className="p-6 bg-primary-gray rounded-xl border-2 border-primary-gray-light hover:border-accent-yellow hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">{crypto.name}</h4>
                      <p className="text-sm text-primary-gray-lighter">{crypto.symbol}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      crypto.change24h >= 0 
                        ? 'bg-primary-gray-light text-accent-yellow border border-accent-yellow' 
                        : 'bg-primary-gray-light text-accent-yellow-dark border border-accent-yellow-dark'
                    }`}>
                      {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-primary-gray-lighter">Price</p>
                      <p className="text-xl font-bold text-accent-yellow">
                        ${crypto.price.toLocaleString('en-US', { 
                          minimumFractionDigits: crypto.price > 1000 ? 0 : 2, 
                          maximumFractionDigits: crypto.price > 1000 ? 0 : 2 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-gray-lighter">Market Cap</p>
                      <p className="text-base font-semibold text-white">
                        ${(crypto.marketCap / 1e9).toFixed(2)}B
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </section>
  );
}

export default memo(Features);
