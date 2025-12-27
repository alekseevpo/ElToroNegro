'use client';

import { useState } from 'react';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  category: 'stocks' | 'commodities' | 'crypto';
  price: number;
  change: number;
  minInvestment: number;
}

const assets: Asset[] = [
  { id: '1', name: 'Apple Inc.', symbol: 'AAPL', category: 'stocks', price: 175.50, change: 2.3, minInvestment: 10 },
  { id: '2', name: 'Microsoft', symbol: 'MSFT', category: 'stocks', price: 378.85, change: 1.8, minInvestment: 10 },
  { id: '3', name: 'Google', symbol: 'GOOGL', category: 'stocks', price: 142.30, change: -0.5, minInvestment: 10 },
  { id: '4', name: 'Gold', symbol: 'XAU', category: 'commodities', price: 2045.50, change: 0.8, minInvestment: 10 },
  { id: '5', name: 'Crude Oil', symbol: 'CL', category: 'commodities', price: 82.40, change: -1.2, minInvestment: 10 },
  { id: '6', name: 'Bitcoin', symbol: 'BTC', category: 'crypto', price: 43500.00, change: 3.5, minInvestment: 10 },
];

export default function InvestmentOptions() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'stocks' | 'commodities' | 'crypto'>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');

  const filteredAssets = selectedCategory === 'all' 
    ? assets 
    : assets.filter(asset => asset.category === selectedCategory);

  const handleInvest = () => {
    if (!selectedAsset || !investmentAmount) {
      alert('Please select an asset and enter investment amount');
      return;
    }
    const amount = parseFloat(investmentAmount);
    if (amount < selectedAsset.minInvestment) {
      alert(`Minimum investment is €${selectedAsset.minInvestment}`);
      return;
    }
    // TODO: Implement investment logic
    console.log('Investing:', { asset: selectedAsset.name, amount });
    alert(`Investment of €${amount} in ${selectedAsset.name} initiated!`);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Investment Options
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from a variety of tokenized assets. Start with as little as €10.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-8 space-x-4">
          {(['all', 'stocks', 'commodities', 'crypto'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                selectedAsset?.id === asset.id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{asset.name}</h3>
                  <p className="text-sm text-gray-600">{asset.symbol}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  asset.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {asset.change >= 0 ? '+' : ''}{asset.change}%
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                €{asset.price.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                Min: €{asset.minInvestment}
              </div>
            </div>
          ))}
        </div>

        {/* Investment Form */}
        {selectedAsset && (
          <div className="max-w-md mx-auto p-8 bg-gray-50 rounded-2xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Invest in {selectedAsset.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Amount (€)
                </label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder={`Minimum: €${selectedAsset.minInvestment}`}
                  min={selectedAsset.minInvestment}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Current Price:</span>
                  <span className="font-medium">€{selectedAsset.price.toLocaleString()}</span>
                </div>
                {investmentAmount && (
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>Estimated Shares:</span>
                    <span className="font-medium">
                      {(parseFloat(investmentAmount) / selectedAsset.price).toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleInvest}
                className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Invest Now
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

