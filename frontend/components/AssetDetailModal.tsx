'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdvancedChart from './AdvancedChart';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  category: 'stocks' | 'commodities' | 'crypto' | 'cloud-storage' | 'innovative-projects';
  price: number;
  change: number;
  minInvestment: number;
  priceData?: any;
}

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

// Generate fallback historical data if API fails
const generateFallbackHistoricalData = (asset: Asset, days: number = 30) => {
  const data = [];
  const basePrice = asset.price;
  const volatility = Math.abs(asset.change) / 100 || 0.02;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate price with some random variation
    const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
    const price = basePrice * randomFactor;
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Number(price.toFixed(2)),
      timestamp: date.getTime(),
    });
  }
  
  return data;
};

// Asset descriptions
const assetDescriptions: Record<string, string> = {
  'AAPL': 'Apple Inc. is a multinational technology company that designs, develops, and sells consumer electronics, computer software, and online services. Known for innovative products like iPhone, iPad, Mac, and services like Apple Music and iCloud.',
  'MSFT': 'Microsoft Corporation is a technology company that develops, manufactures, licenses, supports and sells computer software, consumer electronics and personal computers. Best known for Windows OS, Office suite, Azure cloud services, and Xbox gaming.',
  'GOOGL': 'Alphabet Inc. (Google) is a multinational technology conglomerate. It provides internet-related services and products, including search engine, cloud computing, software, and hardware. Major products include Google Search, YouTube, Android, and Google Cloud.',
  'XAU': 'Gold is a precious metal that has been used as a store of value and medium of exchange for thousands of years. It is considered a safe-haven asset and hedge against inflation and currency fluctuations.',
  'CL': 'Crude Oil is a naturally occurring petroleum product composed of hydrocarbon deposits. It is a major energy source and commodity, with prices influenced by supply, demand, geopolitical events, and economic conditions.',
  'BTC': 'Bitcoin is the first and largest cryptocurrency by market capitalization. It is a decentralized digital currency that operates on a peer-to-peer network without a central authority. Known for its limited supply of 21 million coins.',
  'AWS-ST': 'AWS Storage Pool represents tokenized investment in Amazon Web Services cloud storage infrastructure. Provides exposure to the growing cloud storage market and AWS revenue streams.',
  'GCS': 'Google Cloud Storage represents tokenized investment in Google Cloud Platform storage services. Offers exposure to enterprise cloud infrastructure and data storage solutions.',
  'AZR-DC': 'Azure Data Centers represents tokenized investment in Microsoft Azure cloud infrastructure. Provides exposure to enterprise cloud computing and data center operations.',
  'AI-RL': 'AI Research Lab represents investment in cutting-edge artificial intelligence research and development. Focuses on machine learning, neural networks, and AI applications.',
  'GET': 'Green Energy Tech represents investment in renewable energy technologies including solar, wind, and battery storage solutions. Supports the transition to sustainable energy.',
  'QC': 'Quantum Computing represents investment in quantum computing research and development. Focuses on next-generation computing technology with potential to revolutionize computing.',
};

const categoryLabels: Record<string, string> = {
  'stocks': 'Stocks',
  'commodities': 'Commodities',
  'crypto': 'Cryptocurrency',
  'cloud-storage': 'Cloud Storage',
  'innovative-projects': 'Innovative Projects',
};

export default function AssetDetailModal({ asset, isOpen, onClose }: AssetDetailModalProps) {

  const description = asset ? assetDescriptions[asset.symbol] || `Investment opportunity in ${asset.name}.` : '';
  const categoryLabel = asset ? categoryLabels[asset.category] || asset.category : '';

  if (!asset) return null;

  const isPositive = asset.change >= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-primary-gray rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-primary-gray-light shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-white">{asset.name}</h2>
                    <span className="px-3 py-1 bg-primary-gray-light rounded-lg text-sm text-primary-gray-lighter">
                      {asset.symbol}
                    </span>
                    <span className="px-3 py-1 bg-accent-yellow/20 text-accent-yellow rounded-lg text-sm font-medium">
                      {categoryLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-2xl font-bold text-white">${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      isPositive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {isPositive ? '+' : ''}{asset.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-primary-gray-lighter hover:text-white transition-colors p-2"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                <p className="text-primary-gray-lighter leading-relaxed">{description}</p>
              </div>

              {/* Chart */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Price Chart</h3>
                <AdvancedChart
                  symbol={asset.symbol}
                  category={asset.category}
                  height={400}
                  useTradingView={true}
                />
              </div>

              {/* Investment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black rounded-xl p-4 border border-primary-gray-light">
                  <div className="text-sm text-primary-gray-lighter mb-1">Minimum Investment</div>
                  <div className="text-xl font-bold text-white">${asset.minInvestment.toLocaleString()}</div>
                </div>
                <div className="bg-black rounded-xl p-4 border border-primary-gray-light">
                  <div className="text-sm text-primary-gray-lighter mb-1">Current Price</div>
                  <div className="text-xl font-bold text-white">${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-accent-yellow text-black font-semibold rounded-lg hover:bg-accent-yellow-light transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

