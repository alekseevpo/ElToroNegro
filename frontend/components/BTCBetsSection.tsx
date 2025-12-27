'use client';

import { useState } from 'react';

export default function BTCBetsSection() {
  const [predictedPrice, setPredictedPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState(43500);
  const betAmount = 0.01; // ETH

  const handlePlaceBet = () => {
    if (!predictedPrice) {
      alert('Please enter predicted price');
      return;
    }
    const price = parseFloat(predictedPrice);
    if (price <= 0) {
      alert('Price must be greater than 0');
      return;
    }
    // TODO: Implement BTC bet placement
    console.log('Placing bet:', price);
    alert(`Placing bet on BTC price: $${price.toLocaleString()}`);
  };

  return (
    <section className="relative py-20">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
      <div className="relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-accent-yellow mb-4">
            Bitcoin Price Prediction
          </h1>
          <p className="text-xl text-primary-gray-lighter">
            Predict the BTC price on Friday and win the prize pool
          </p>
        </div>

        <div className="bg-primary-gray rounded-2xl p-8 md:p-12 mb-8 border border-primary-gray-light">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-yellow mb-2">${currentPrice.toLocaleString()}</div>
              <div className="text-sm text-primary-gray-lighter">Current BTC Price</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-yellow mb-2">0.01 ETH</div>
              <div className="text-sm text-primary-gray-lighter">Bet Amount</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-yellow mb-2">Fri</div>
              <div className="text-sm text-primary-gray-lighter">Result Date</div>
            </div>
          </div>

          <div className="bg-black rounded-xl p-6 mb-6 border border-primary-gray-light">
            <h3 className="text-lg font-semibold text-accent-yellow mb-4">Place Your Bet</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
                Predicted BTC Price (USD)
              </label>
              <input
                type="number"
                value={predictedPrice}
                onChange={(e) => setPredictedPrice(e.target.value)}
                placeholder="e.g., 45000"
                min="1"
                className="w-full px-4 py-3 bg-primary-gray border border-primary-gray-light rounded-lg focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow text-white"
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-primary-gray-lighter">Bet Amount:</span>
              <span className="text-xl font-bold text-accent-yellow">
                {betAmount} ETH
              </span>
            </div>
            <button
              onClick={handlePlaceBet}
              className="w-full py-3 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light transition-colors"
            >
              Place Bet
            </button>
          </div>

          <div className="text-sm text-primary-gray-lighter space-y-2">
            <p>• Betting period: Monday - Thursday</p>
            <p>• Winners are determined on Friday based on Chainlink Price Feed</p>
            <p>• Closest predictions share the prize pool</p>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

