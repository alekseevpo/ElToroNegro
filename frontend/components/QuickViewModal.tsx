'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

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

interface QuickViewModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ asset, isOpen, onClose }: QuickViewModalProps) {
  const router = useRouter();

  if (!asset) return null;

  const isPositive = asset.change >= 0;

  const handleViewDetails = () => {
    onClose();
    router.push(`/assets/${asset.symbol.toLowerCase()}`);
  };

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
            <div className="bg-primary-gray rounded-2xl p-6 w-full max-w-md border border-primary-gray-light shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{asset.name}</h2>
                    <span className="px-3 py-1 bg-primary-gray-light rounded-lg text-sm text-primary-gray-lighter">
                      {asset.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-3xl font-bold text-accent-yellow">
                      ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
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

              {/* Quick Info */}
              <div className="space-y-4 mb-6">
                <div className="bg-black rounded-xl p-4 border border-primary-gray-light">
                  <div className="text-sm text-primary-gray-lighter mb-1">Minimum Investment</div>
                  <div className="text-xl font-bold text-white">${asset.minInvestment.toLocaleString()}</div>
                </div>
                <div className="bg-black rounded-xl p-4 border border-primary-gray-light">
                  <div className="text-sm text-primary-gray-lighter mb-1">Current Price</div>
                  <div className="text-xl font-bold text-white">
                    ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-primary-gray-light text-white font-semibold rounded-lg hover:bg-primary-gray-light/80 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleViewDetails}
                  className="flex-1 px-6 py-3 bg-accent-yellow text-black font-semibold rounded-lg hover:bg-accent-yellow-light transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

