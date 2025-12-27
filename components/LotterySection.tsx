'use client';

import { useState } from 'react';

export default function LotterySection() {
  const [ticketCount, setTicketCount] = useState(1);
  const ticketPrice = 0.01; // ETH

  const handleBuyTickets = () => {
    // TODO: Implement lottery ticket purchase
    console.log('Buying tickets:', ticketCount);
    alert(`Purchasing ${ticketCount} ticket(s) for ${ticketCount * ticketPrice} ETH`);
  };

  return (
    <section className="relative py-20">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
      <div className="relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-accent-yellow mb-4">
            Decentralized Lottery
          </h1>
          <p className="text-xl text-primary-gray-lighter">
            Fair, transparent, and secure lottery powered by Chainlink VRF
          </p>
        </div>

        <div className="bg-primary-gray rounded-2xl p-8 md:p-12 mb-8 border border-primary-gray-light">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-yellow mb-2">0.01 ETH</div>
              <div className="text-sm text-primary-gray-lighter">Ticket Price</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-yellow mb-2">100</div>
              <div className="text-sm text-primary-gray-lighter">Max Tickets</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-yellow mb-2">50</div>
              <div className="text-sm text-primary-gray-lighter">Tickets Sold</div>
            </div>
          </div>

          <div className="bg-black rounded-xl p-6 mb-6 border border-primary-gray-light">
            <h3 className="text-lg font-semibold text-accent-yellow mb-4">Purchase Tickets</h3>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-primary-gray-lighter">Number of Tickets:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={ticketCount}
                onChange={(e) => setTicketCount(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 bg-primary-gray border border-primary-gray-light rounded-lg text-center text-white"
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-primary-gray-lighter">Total Cost:</span>
              <span className="text-xl font-bold text-accent-yellow">
                {(ticketCount * ticketPrice).toFixed(4)} ETH
              </span>
            </div>
            <button
              onClick={handleBuyTickets}
              className="w-full py-3 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light transition-colors"
            >
              Buy Tickets
            </button>
          </div>

          <div className="text-sm text-primary-gray-lighter space-y-2">
            <p>• Winners are selected using Chainlink VRF for fairness</p>
            <p>• All transactions are transparent and verifiable on blockchain</p>
            <p>• Prize pool is distributed automatically to the winner</p>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

