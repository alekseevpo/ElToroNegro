'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { LOTTERY_TICKET_PRICE, LOTTERY_PRIZES } from '@/lib/constants';
import { calculateExpectedValue, getPrizeStatistics } from '@/lib/lottery-utils';
import { handleError } from '@/lib/error-handler';

// Lazy load CardPaymentForm
const CardPaymentForm = dynamic(() => import('./CardPaymentForm'), {
  ssr: false,
});

interface LotteryResult {
  ticketId: string;
  prize: number;
  timestamp: number;
}

interface LotteryHistory {
  ticketId: string;
  prize: number;
  timestamp: number;
  isFreeTicket: boolean;
}

export default function InstantLottery() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [ticketCount, setTicketCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LotteryResult[]>([]);
  const [history, setHistory] = useState<LotteryHistory[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [freeTickets, setFreeTickets] = useState(0);

  // Calculate statistics
  const stats = useMemo(() => getPrizeStatistics(), []);
  const expectedValue = useMemo(() => calculateExpectedValue(), []);

  // Calculate total cost
  const totalCost = useMemo(() => {
    return ticketCount * LOTTERY_TICKET_PRICE;
  }, [ticketCount]);

  // Load free tickets from user profile
  // TODO: Load from user profile/investments
  // useEffect(() => {
  //   if (user?.address) {
  //     // Calculate free tickets based on investments
  //   }
  // }, [user]);

  const handlePlayFreeTickets = useCallback(async (count: number) => {
    if (!user?.address) {
      showError('Please login to play lottery');
      return;
    }

    if (count > freeTickets) {
      showError(`You only have ${freeTickets} free tickets available`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/lottery/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCount: count,
          userId: user.address,
          isFreeTicket: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to play lottery');
      }

      const data = await response.json();
      setResults(data.tickets);
      setHistory(prev => [
        ...data.tickets.map((t: LotteryResult) => ({
          ...t,
          isFreeTicket: true,
        })),
        ...prev,
      ]);
      setFreeTickets(prev => prev - count);

      const totalPrize = data.tickets.reduce((sum: number, t: LotteryResult) => sum + t.prize, 0);
      if (totalPrize > 0) {
        showSuccess(`Congratulations! You won ${totalPrize} USDT!`);
      } else {
        showSuccess('Tickets played! Check your results below.');
      }
    } catch (err: unknown) {
      const { message } = handleError(err);
      logger.error('Error playing free lottery tickets', err);
      showError(message || 'Failed to play lottery');
    } finally {
      setLoading(false);
    }
  }, [user, freeTickets, showSuccess, showError]);

  const handlePaymentSuccess = useCallback(async (paymentIntentId: string, amount: number) => {
    if (!user?.address) {
      showError('Please login to play lottery');
      return;
    }

    setLoading(true);
    setShowPayment(false);
    
    try {
      const response = await fetch('/api/lottery/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCount: ticketCount,
          userId: user.address,
          isFreeTicket: false,
          paymentIntentId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to play lottery');
      }

      const data = await response.json();
      setResults(data.tickets);
      setHistory(prev => [
        ...data.tickets.map((t: LotteryResult) => ({
          ...t,
          isFreeTicket: false,
        })),
        ...prev,
      ]);

      const totalPrize = data.tickets.reduce((sum: number, t: LotteryResult) => sum + t.prize, 0);
      if (totalPrize > 0) {
        showSuccess(`Congratulations! You won ${totalPrize} USDT!`);
      } else {
        showSuccess('Tickets played! Check your results below.');
      }
    } catch (err: unknown) {
      const { message } = handleError(err);
      logger.error('Error playing paid lottery tickets', err);
      showError(message || 'Failed to play lottery');
    } finally {
      setLoading(false);
    }
  }, [user, ticketCount, showSuccess, showError]);

  const handleBuyTickets = useCallback(() => {
    if (!user?.address) {
      showError('Please login to buy tickets');
      return;
    }

    if (ticketCount < 1 || ticketCount > 100) {
      showError('Please select between 1 and 100 tickets');
      return;
    }

    setShowPayment(true);
  }, [user, ticketCount, showError]);

  return (
    <section className="relative py-20">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
      <div className="relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-accent-yellow mb-4">
              Instant Lottery
            </h1>
            <p className="text-xl text-primary-gray-lighter mb-2">
              Win instantly! Every ticket is a winner 🎰
            </p>
            <p className="text-sm text-primary-gray-lighter">
              Expected value: ~{expectedValue.toFixed(2)} USDT per ticket (70% return)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Lottery Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Prize Pool Info */}
              <div className="bg-primary-gray rounded-2xl p-6 border border-primary-gray-light">
                <h2 className="text-2xl font-bold text-accent-yellow mb-4">Prize Structure</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-black/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400 mb-1">1000 USDT</div>
                    <div className="text-xs text-primary-gray-lighter">0.1% chance</div>
                  </div>
                  <div className="text-center p-4 bg-black/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400 mb-1">500 USDT</div>
                    <div className="text-xs text-primary-gray-lighter">0.1% chance</div>
                  </div>
                  <div className="text-center p-4 bg-black/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400 mb-1">100 USDT</div>
                    <div className="text-xs text-primary-gray-lighter">0.2% chance</div>
                  </div>
                  <div className="text-center p-4 bg-black/50 rounded-lg">
                    <div className="text-xl font-bold text-yellow-400 mb-1">50 USDT</div>
                    <div className="text-xs text-primary-gray-lighter">1% chance</div>
                  </div>
                  <div className="text-center p-4 bg-black/50 rounded-lg">
                    <div className="text-xl font-bold text-yellow-400 mb-1">20 USDT</div>
                    <div className="text-xs text-primary-gray-lighter">2% chance</div>
                  </div>
                  <div className="text-center p-4 bg-black/50 rounded-lg">
                    <div className="text-lg font-bold text-accent-yellow mb-1">10 USDT</div>
                    <div className="text-xs text-primary-gray-lighter">5% chance</div>
                  </div>
                </div>
                <p className="text-sm text-primary-gray-lighter mt-4 text-center">
                  Plus many more prizes from 1-7 USDT! Every ticket wins something.
                </p>
              </div>

              {/* Buy Tickets */}
              <div className="bg-primary-gray rounded-2xl p-6 border border-primary-gray-light">
                <h3 className="text-xl font-semibold text-accent-yellow mb-4">Buy Tickets</h3>
                
                {!showPayment ? (
                  <>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between">
                        <label htmlFor="ticket-count-input" className="text-sm font-medium text-primary-gray-lighter">
                          Number of Tickets:
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                            className="w-8 h-8 rounded-lg bg-black border border-primary-gray-light text-white hover:bg-primary-gray-light transition-colors"
                            aria-label="Decrease ticket count"
                          >
                            -
                          </button>
                          <input
                            id="ticket-count-input"
                            name="ticketCount"
                            type="number"
                            min="1"
                            max="100"
                            value={ticketCount}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              setTicketCount(Math.min(100, Math.max(1, value)));
                            }}
                            className="w-20 px-3 py-2 bg-black border border-primary-gray-light rounded-lg text-center text-white"
                            aria-label="Number of lottery tickets"
                          />
                          <button
                            type="button"
                            onClick={() => setTicketCount(Math.min(100, ticketCount + 1))}
                            className="w-8 h-8 rounded-lg bg-black border border-primary-gray-light text-white hover:bg-primary-gray-light transition-colors"
                            aria-label="Increase ticket count"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-black/50 rounded-lg">
                        <span className="text-sm text-primary-gray-lighter">Total Cost:</span>
                        <span className="text-2xl font-bold text-accent-yellow">
                          €{totalCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleBuyTickets}
                      disabled={loading || !user}
                      className="w-full py-4 bg-accent-yellow text-black font-semibold text-lg rounded-xl hover:bg-accent-yellow-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : `Buy ${ticketCount} Ticket${ticketCount > 1 ? 's' : ''}`}
                    </button>
                  </>
                ) : (
                  <CardPaymentForm
                    amount={totalCost}
                    onSuccess={handlePaymentSuccess}
                    onError={(error) => {
                      logger.error('Lottery payment error', new Error(error), { ticketCount, totalCost });
                      showError(error);
                      setShowPayment(false);
                      setLoading(false);
                    }}
                    metadata={{
                      type: 'lottery',
                      ticketCount: ticketCount.toString(),
                      userId: user?.address || '',
                    }}
                  />
                )}

                {/* Free Tickets */}
                {freeTickets > 0 && (
                  <div className="mt-4 pt-4 border-t border-primary-gray-light">
                    <p className="text-sm text-primary-gray-lighter mb-2">
                      You have {freeTickets} free ticket{freeTickets > 1 ? 's' : ''} from investments
                    </p>
                    <button
                      onClick={() => handlePlayFreeTickets(1)}
                      disabled={loading}
                      className="w-full py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Play 1 Free Ticket
                    </button>
                  </div>
                )}
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="bg-primary-gray rounded-2xl p-6 border border-primary-gray-light">
                  <h3 className="text-xl font-semibold text-accent-yellow mb-4">Your Results</h3>
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div
                        key={result.ticketId}
                        className="flex items-center justify-between p-3 bg-black/50 rounded-lg"
                      >
                        <div>
                          <div className="text-sm text-primary-gray-lighter">Ticket #{index + 1}</div>
                          <div className="text-xs text-primary-gray-lighter">{result.ticketId}</div>
                        </div>
                        <div className={`text-xl font-bold ${
                          result.prize >= 100 ? 'text-green-400' :
                          result.prize >= 50 ? 'text-yellow-400' :
                          'text-accent-yellow'
                        }`}>
                          {result.prize} USDT
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-primary-gray-light">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-white">Total Winnings:</span>
                        <span className="text-2xl font-bold text-green-400">
                          {results.reduce((sum, r) => sum + r.prize, 0)} USDT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statistics */}
              <div className="bg-primary-gray rounded-2xl p-6 border border-primary-gray-light">
                <h3 className="text-xl font-semibold text-accent-yellow mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-primary-gray-lighter">Ticket Price:</span>
                    <span className="font-semibold text-white">{LOTTERY_TICKET_PRICE} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-primary-gray-lighter">Expected Value:</span>
                    <span className="font-semibold text-green-400">~{expectedValue.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-primary-gray-lighter">Return Rate:</span>
                    <span className="font-semibold text-green-400">~70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-primary-gray-lighter">Win Rate:</span>
                    <span className="font-semibold text-green-400">100%</span>
                  </div>
                </div>
              </div>

              {/* Recent History */}
              {history.length > 0 && (
                <div className="bg-primary-gray rounded-2xl p-6 border border-primary-gray-light">
                  <h3 className="text-xl font-semibold text-accent-yellow mb-4">Recent History</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.slice(0, 10).map((item) => (
                      <div
                        key={item.ticketId}
                        className="flex items-center justify-between p-2 bg-black/50 rounded text-sm"
                      >
                        <div>
                          <div className={`text-xs ${item.isFreeTicket ? 'text-green-400' : 'text-primary-gray-lighter'}`}>
                            {item.isFreeTicket ? 'Free' : 'Paid'}
                          </div>
                          <div className="text-xs text-primary-gray-lighter">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          item.prize >= 100 ? 'text-green-400' :
                          item.prize >= 50 ? 'text-yellow-400' :
                          'text-accent-yellow'
                        }`}>
                          {item.prize} USDT
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-primary-gray rounded-2xl p-6 border border-primary-gray-light">
                <h3 className="text-xl font-semibold text-accent-yellow mb-4">How It Works</h3>
                <ul className="space-y-2 text-sm text-primary-gray-lighter">
                  <li>• Buy tickets for {LOTTERY_TICKET_PRICE} USDT each</li>
                  <li>• Get instant results - every ticket wins!</li>
                  <li>• Prizes range from 1 to 1000 USDT</li>
                  <li>• Free tickets from investments (1 per 10€)</li>
                  <li>• Fair and transparent random selection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

