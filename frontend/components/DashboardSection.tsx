'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useInvestmentPool } from '@/hooks/useInvestmentPool';
import { useAuth } from '@/contexts/AuthContext';
import { ethers } from 'ethers';

// Lazy load heavy tabs for code splitting
const ProfileTab = dynamic(() => import('./ProfileTab'), { ssr: false });
const ReferralsTab = dynamic(() => import('./ReferralsTab'), { ssr: false });
const TransactionsTab = dynamic(() => import('./TransactionsTab'), { ssr: false });

function DashboardSection() {
  const { user, refreshBalance } = useAuth();
  const account = user?.address || null;
  const isConnected = user?.isConnected || false;

  const { 
    getUserInvestments,
    getUserStats,
    poolStats,
    loading: contractLoading 
  } = useInvestmentPool();

  const [userStats, setUserStats] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'investments' | 'referrals' | 'transactions' | 'profile'>('overview');

  useEffect(() => {
    if (account && isConnected) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [account, isConnected]);

  const loadData = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const stats = await getUserStats(account);
      setUserStats(stats);

      const userInvestments = await getUserInvestments(account);
      setInvestments(userInvestments);
      
      await refreshBalance();
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ProtectedRoute already handles authentication check, but keep this as a fallback
  if (!isConnected) {
    return null; // ProtectedRoute will handle the redirect/authentication
  }

  if (loading || contractLoading) {
    return (
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-primary-gray-lighter">Loading dashboard...</p>
        </div>
      </section>
    );
  }

  const activeInvestments = investments.filter(inv => !inv.withdrawn && Date.now() < inv.withdrawTime * 1000);
  const totalProfit = investments.reduce((sum, inv) => {
    if (inv.withdrawn) {
      return sum + (parseFloat(inv.estimatedReturn) - parseFloat(inv.amount));
    }
    return sum;
  }, 0);

  return (
    <section className="relative py-12">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
      <div className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-accent-yellow mb-2">Investor Dashboard</h1>
          <p className="text-primary-gray-lighter">Welcome back, {formatAddress(account || '')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-primary-gray-light">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'investments', label: 'My Investments' },
              { id: 'referrals', label: 'Referrals' },
              { id: 'transactions', label: 'Transactions' },
              { id: 'profile', label: 'Profile' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-accent-yellow text-accent-yellow'
                    : 'border-transparent text-primary-gray-lighter hover:text-white hover:border-primary-gray-light'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-gray-lighter mb-1">Wallet Balance</p>
                    <p className="text-2xl font-bold text-white">
                      {user?.balance ? parseFloat(user.balance).toFixed(4) : '0.0000'} ETH
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-gray-lighter mb-1">Total Invested</p>
                    <p className="text-2xl font-bold text-white">
                      {userStats ? parseFloat(userStats.totalInvestedAmount).toFixed(4) : '0.0000'} ETH
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-gray-light rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-gray-lighter mb-1">Active Investments</p>
                    <p className="text-2xl font-bold text-white">
                      {userStats ? userStats.activeCount : 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-gray-light rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-gray-lighter mb-1">Total Profit</p>
                    <p className="text-2xl font-bold text-accent-yellow">
                      +{totalProfit.toFixed(4)} ETH
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-gray-light rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
              <h2 className="text-xl font-bold text-accent-yellow mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/"
                  className="p-4 border-2 border-primary-gray-light rounded-lg hover:border-accent-yellow hover:bg-primary-gray-light transition-colors"
                >
                  <div className="font-semibold text-white mb-1">Invest More</div>
                  <div className="text-sm text-primary-gray-lighter">Browse investment options</div>
                </Link>
                <Link
                  href="/my-investments"
                  className="p-4 border-2 border-primary-gray-light rounded-lg hover:border-accent-yellow hover:bg-primary-gray-light transition-colors"
                >
                  <div className="font-semibold text-white mb-1">Manage Investments</div>
                  <div className="text-sm text-primary-gray-lighter">View and withdraw investments</div>
                </Link>
                <Link
                  href="/buy-tokens"
                  className="p-4 border-2 border-primary-gray-light rounded-lg hover:border-accent-yellow hover:bg-primary-gray-light transition-colors"
                >
                  <div className="font-semibold text-white mb-1">Buy Tokens</div>
                  <div className="text-sm text-primary-gray-lighter">Purchase $TAI tokens</div>
                </Link>
              </div>
            </div>

            {/* Recent Investments */}
            {activeInvestments.length > 0 && (
              <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-accent-yellow">Active Investments</h2>
                  <Link href="/my-investments" className="text-sm text-accent-yellow hover:text-accent-yellow-light font-medium">
                    View All →
                  </Link>
                </div>
                <div className="space-y-4">
                  {activeInvestments.slice(0, 3).map((investment, index) => {
                    const actualIndex = investments.findIndex(inv => inv === investment);
                    const daysRemaining = Math.ceil((investment.withdrawTime * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={actualIndex} className="p-4 bg-black rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">Investment #{actualIndex + 1}</p>
                            <p className="text-sm text-primary-gray-lighter">
                              {parseFloat(investment.amount).toFixed(4)} ETH • {formatDate(investment.depositTime)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-accent-yellow">
                              {parseFloat(investment.estimatedReturn).toFixed(4)} ETH
                            </p>
                            <p className="text-sm text-primary-gray-lighter">{daysRemaining} days left</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pool Stats */}
            {poolStats && (
              <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
                <h2 className="text-xl font-bold text-accent-yellow mb-4">Pool Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-primary-gray-lighter">Total Pool Balance</p>
                    <p className="text-lg font-bold text-white">{parseFloat(poolStats.currentBalance).toFixed(4)} ETH</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary-gray-lighter">Interest Rate</p>
                    <p className="text-lg font-bold text-white">{poolStats.interestRate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary-gray-lighter">Total Invested</p>
                    <p className="text-lg font-bold text-white">{parseFloat(poolStats.totalInvested).toFixed(4)} ETH</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary-gray-lighter">Active Investors</p>
                    <p className="text-lg font-bold text-white">{poolStats.totalActiveInvestments}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Investments Tab */}
        {activeTab === 'investments' && (
          <div>
            <Link href="/my-investments" className="inline-block mb-6 text-accent-yellow hover:text-accent-yellow-light font-medium">
              ← Go to Full Investment Details
            </Link>
            <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
              <p className="text-primary-gray-lighter">For detailed investment management, please visit the <Link href="/my-investments" className="text-accent-yellow hover:text-accent-yellow-light font-medium">My Investments</Link> page.</p>
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && account && (
          <ReferralsTab account={account} />
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && account && (
          <TransactionsTab account={account} />
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && account && (
          <ProfileTab account={account} />
        )}
      </div>
      </div>
    </section>
  );
}

export default memo(DashboardSection);
