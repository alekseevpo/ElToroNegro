'use client';

import { useState, useEffect } from 'react';
import { useInvestmentPool } from '@/hooks/useInvestmentPool';
import { useAuth } from '@/contexts/AuthContext';
import { addTransaction, isKYCVerified } from '@/lib/profile-utils';

interface UserInvestment {
  amount: string;
  depositTime: number;
  withdrawTime: number;
  withdrawn: boolean;
  estimatedReturn: string;
}

export default function MyInvestmentsSection() {
  const { user, connect } = useAuth();
  const account = user?.address || null;
  const isConnected = user?.isConnected || false;
  const { 
    getUserInvestments,
    getUserStats,
    withdraw,
    withdrawAll,
    loading: contractLoading 
  } = useInvestmentPool();

  const [investments, setInvestments] = useState<UserInvestment[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawingIndex, setWithdrawingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (account && isConnected) {
      loadInvestments();
    } else {
      setLoading(false);
    }
  }, [account, isConnected]);

  const loadInvestments = async () => {
    if (!account) return;

    setLoading(true);
    try {
      const stats = await getUserStats(account);
      setUserStats(stats);

      const userInvestments = await getUserInvestments(account);
      setInvestments(userInvestments);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to load investments' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (index: number) => {
    if (!account || !isConnected) {
      await connect();
      return;
    }

    // Check KYC verification for withdrawals
    if (!isKYCVerified(account)) {
      setMessage({ 
        type: 'error', 
        text: 'Identity verification is required for withdrawals. Please verify your identity in your profile.' 
      });
      return;
    }

    setWithdrawingIndex(index);
    setMessage(null);

    try {
      const tx = await withdraw(index);
      const investment = availableInvestments[index];
      
      // Record transaction
      if (account && tx && investment) {
        addTransaction(account, {
          type: 'withdrawal',
          status: 'completed',
          amount: investment.estimatedReturn,
          currency: 'ETH',
          description: `Withdrew investment of ${investment.amount} ETH (return: ${investment.estimatedReturn} ETH)`,
          paymentMethod: 'crypto',
          txHash: tx.hash,
        });
      }
      
      setMessage({ type: 'success', text: 'Successfully withdrew investment!' });
      await loadInvestments();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Withdrawal failed' });
    } finally {
      setWithdrawingIndex(null);
    }
  };

  const handleWithdrawAll = async () => {
    if (!account || !isConnected) {
      await connect();
      return;
    }

    // Check KYC verification for withdrawals
    if (!isKYCVerified(account)) {
      setMessage({ 
        type: 'error', 
        text: 'Identity verification is required for withdrawals. Please verify your identity in your profile.' 
      });
      return;
    }

    setWithdrawingIndex(-1);
    setMessage(null);

    try {
      const tx = await withdrawAll();
      
      // Record transaction
      if (account && tx && userStats) {
        const totalAmount = userStats.totalAvailableToWithdraw;
        addTransaction(account, {
          type: 'withdrawal',
          status: 'completed',
          amount: totalAmount,
          currency: 'ETH',
          description: `Withdrew all available investments (${totalAmount} ETH)`,
          paymentMethod: 'crypto',
          txHash: tx.hash,
        });
      }
      
      setMessage({ type: 'success', text: 'Successfully withdrew all available investments!' });
      await loadInvestments();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Withdrawal failed' });
    } finally {
      setWithdrawingIndex(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canWithdraw = (withdrawTime: number) => {
    return Date.now() >= withdrawTime * 1000;
  };

  const availableInvestments = investments.filter(inv => !inv.withdrawn && canWithdraw(inv.withdrawTime));
  const activeInvestments = investments.filter(inv => !inv.withdrawn && !canWithdraw(inv.withdrawTime));

  if (!isConnected) {
    return (
      <section className="relative py-20">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
        <div className="relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-accent-yellow mb-4">My Investments</h1>
            <p className="text-xl text-primary-gray-lighter mb-8">Please connect your wallet to view your investments</p>
            <button
              onClick={() => connect()}
              className="px-8 py-3 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (loading || contractLoading) {
    return (
      <section className="relative py-20">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
        <div className="relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-primary-gray-lighter">Loading investments...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-20">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
      <div className="relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-accent-yellow mb-4">My Investments</h1>
          
          {userStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-primary-gray rounded-lg border border-primary-gray-light">
                <p className="text-sm text-primary-gray-lighter">Total Investments</p>
                <p className="text-2xl font-bold text-white">{userStats.totalCount}</p>
              </div>
              <div className="p-4 bg-primary-gray rounded-lg border border-primary-gray-light">
                <p className="text-sm text-primary-gray-lighter">Active</p>
                <p className="text-2xl font-bold text-white">{userStats.activeCount}</p>
              </div>
              <div className="p-4 bg-primary-gray rounded-lg border border-primary-gray-light">
                <p className="text-sm text-primary-gray-lighter">Total Invested</p>
                <p className="text-2xl font-bold text-white">
                  {parseFloat(userStats.totalInvestedAmount).toFixed(4)} ETH
                </p>
              </div>
              <div className="p-4 bg-primary-gray rounded-lg border border-accent-yellow">
                <p className="text-sm text-primary-gray-lighter">Available</p>
                <p className="text-2xl font-bold text-accent-yellow">
                  {parseFloat(userStats.totalAvailableToWithdraw).toFixed(4)} ETH
                </p>
              </div>
            </div>
          )}

          {availableInvestments.length > 0 && (
            <button
              onClick={handleWithdrawAll}
              disabled={withdrawingIndex === -1}
              className="mb-6 px-6 py-3 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {withdrawingIndex === -1 ? 'Withdrawing...' : `Withdraw All (${availableInvestments.length})`}
            </button>
          )}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-primary-gray border border-accent-yellow text-accent-yellow' 
            : 'bg-primary-gray border border-red-500 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Available to Withdraw */}
        {availableInvestments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-accent-yellow mb-4">Available to Withdraw</h2>
            <div className="space-y-4">
              {availableInvestments.map((investment, index) => {
                const actualIndex = investments.findIndex(inv => inv === investment);
                return (
                  <div key={actualIndex} className="p-6 border-2 border-accent-yellow bg-primary-gray rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">Investment #{actualIndex + 1}</h3>
                        <p className="text-sm text-primary-gray-lighter">Deposited: {formatDate(investment.depositTime)}</p>
                      </div>
                      <span className="px-3 py-1 bg-accent-yellow text-black rounded-full text-sm font-medium">
                        Ready
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-primary-gray-lighter">Invested</p>
                        <p className="text-lg font-bold text-white">{parseFloat(investment.amount).toFixed(4)} ETH</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-gray-lighter">Return</p>
                        <p className="text-lg font-bold text-accent-yellow">{parseFloat(investment.estimatedReturn).toFixed(4)} ETH</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-gray-lighter">Profit</p>
                        <p className="text-lg font-bold text-accent-yellow">
                          +{(parseFloat(investment.estimatedReturn) - parseFloat(investment.amount)).toFixed(4)} ETH
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-gray-lighter">Withdraw Time</p>
                        <p className="text-sm font-medium text-white">{formatDate(investment.withdrawTime)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleWithdraw(actualIndex)}
                      disabled={withdrawingIndex === actualIndex}
                      className="w-full py-2 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light disabled:opacity-50"
                    >
                      {withdrawingIndex === actualIndex ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Investments */}
        {activeInvestments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-accent-yellow mb-4">Active Investments</h2>
            <div className="space-y-4">
              {activeInvestments.map((investment, index) => {
                const actualIndex = investments.findIndex(inv => inv === investment);
                const daysRemaining = Math.ceil((investment.withdrawTime * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={actualIndex} className="p-6 border-2 border-primary-gray-light bg-primary-gray rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">Investment #{actualIndex + 1}</h3>
                        <p className="text-sm text-primary-gray-lighter">Deposited: {formatDate(investment.depositTime)}</p>
                      </div>
                      <span className="px-3 py-1 bg-primary-gray-light text-accent-yellow border border-accent-yellow rounded-full text-sm font-medium">
                        {daysRemaining} days left
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-primary-gray-lighter">Invested</p>
                        <p className="text-lg font-bold text-white">{parseFloat(investment.amount).toFixed(4)} ETH</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-gray-lighter">Expected Return</p>
                        <p className="text-lg font-bold text-accent-yellow">{parseFloat(investment.estimatedReturn).toFixed(4)} ETH</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-gray-lighter">Withdraw Available</p>
                        <p className="text-sm font-medium text-white">{formatDate(investment.withdrawTime)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Withdrawn Investments */}
        {investments.filter(inv => inv.withdrawn).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-accent-yellow mb-4">Withdrawn Investments</h2>
            <div className="space-y-4">
              {investments.filter(inv => inv.withdrawn).map((investment, index) => {
                const actualIndex = investments.findIndex(inv => inv === investment);
                return (
                  <div key={actualIndex} className="p-6 border border-primary-gray-light bg-black rounded-xl opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">Investment #{actualIndex + 1}</h3>
                        <p className="text-sm text-primary-gray-lighter">Deposited: {formatDate(investment.depositTime)}</p>
                      </div>
                      <span className="px-3 py-1 bg-primary-gray text-primary-gray-lighter border border-primary-gray-light rounded-full text-sm font-medium">
                        Withdrawn
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {investments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-primary-gray-lighter mb-4">No investments yet</p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light"
            >
              Start Investing
            </a>
          </div>
        )}
      </div>
      </div>
    </section>
  );
}

