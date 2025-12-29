'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useInvestmentPool } from '@/hooks/useInvestmentPool';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { ethers } from 'ethers';
import KYCBadge from './KYCBadge';
import { DashboardSkeleton } from './SkeletonLoader';
import Avatar from './Avatar';
import EmailVerificationBanner from './EmailVerificationBanner';
import { logger } from '@/lib/logger';

// Lazy load heavy tabs for code splitting
const ProfileTab = dynamic(() => import('./ProfileTab'), { ssr: false });
const ReferralsTab = dynamic(() => import('./ReferralsTab'), { ssr: false });
const TransactionsTab = dynamic(() => import('./TransactionsTab'), { ssr: false });
const PortfolioChart = dynamic(() => import('./PortfolioChart'), { ssr: false });

function DashboardSection() {
  const { user, refreshBalance } = useAuth();
  const account = user?.address || null;
  const isConnected = user?.isConnected || false;
  const { profile } = useProfile(account);

  const { 
    getUserInvestments,
    getUserStats,
    poolStats,
    loading: contractLoading 
  } = useInvestmentPool();

  const [userStats, setUserStats] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [taiTokenBalance, setTaiTokenBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'investments' | 'referrals' | 'transactions' | 'profile'>('overview');
  const [kycBannerDismissed, setKycBannerDismissed] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const stats = await getUserStats(account);
      setUserStats(stats);

      const userInvestments = await getUserInvestments(account);
      setInvestments(userInvestments);
      
      // Загрузить баланс $TAI токенов из портфеля
      if (profile) {
        const portfolio = profile.portfolio || [];
        const taiAsset = portfolio.find(asset => asset.symbol === 'TAI' && asset.type === 'token');
        setTaiTokenBalance(taiAsset ? taiAsset.quantity : 0);
      }
      
      await refreshBalance();
    } catch (error: unknown) {
      logger.error('Error loading dashboard data', error, { account });
    } finally {
      setLoading(false);
    }
  }, [account, getUserStats, getUserInvestments, profile, refreshBalance]);

  useEffect(() => {
    if (account && isConnected) {
      loadData();
      
      // Check if KYC banner was dismissed (within last 24 hours)
      if (typeof window !== 'undefined' && account) {
        const dismissedTime = localStorage.getItem(`kyc_reminder_dismissed_${account}`);
        if (dismissedTime) {
          const dismissedTimestamp = parseInt(dismissedTime, 10);
          const hoursSinceDismissal = (Date.now() - dismissedTimestamp) / (1000 * 60 * 60);
          // Show again after 24 hours
          if (hoursSinceDismissal < 24) {
            setKycBannerDismissed(true);
          } else {
            // Remove old dismissal entry
            localStorage.removeItem(`kyc_reminder_dismissed_${account}`);
          }
        }
      }
    } else {
      setLoading(false);
    }
  }, [account, isConnected, loadData]);

  // Обновить баланс токенов при переходе на Overview
  useEffect(() => {
    if (account && activeTab === 'overview' && profile) {
      const portfolio = profile.portfolio || [];
      const taiAsset = portfolio.find(asset => asset.symbol === 'TAI' && asset.type === 'token');
      setTaiTokenBalance(taiAsset ? taiAsset.quantity : 0);
    }
  }, [account, activeTab, profile]);

  const formatAddress = useCallback((address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Все хуки должны быть вызваны ДО любых условных возвратов
  const activeInvestments = useMemo(() => 
    investments.filter(inv => !inv.withdrawn && Date.now() < inv.withdrawTime * 1000),
    [investments]
  );
  
  const totalProfit = useMemo(() => 
    investments.reduce((sum, inv) => {
      if (inv.withdrawn) {
        return sum + (parseFloat(inv.estimatedReturn) - parseFloat(inv.amount));
      }
      return sum;
    }, 0),
    [investments]
  );

  // ProtectedRoute already handles authentication check, but keep this as a fallback
  if (!isConnected) {
    return null; // ProtectedRoute will handle the redirect/authentication
  }

  if (loading || contractLoading) {
    return (
      <section className="relative py-12">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <DashboardSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-12">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
      <div className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              {user && (
                <Avatar
                  name={user.name || account || ''}
                  address={account || undefined}
                  picture={user.picture}
                  size={64}
                  className="ring-2 ring-accent-yellow/50"
                />
              )}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-accent-yellow mb-2">Investor Dashboard</h1>
                <p className="text-primary-gray-lighter">
                  Welcome back, {user?.name || formatAddress(account || '')}
                </p>
              </div>
            </div>
              {account && <KYCBadge size="md" />}
            </div>
            
            {/* Email Verification Banner - Show for Google users */}
            <EmailVerificationBanner />
            
            {/* KYC Reminder Banner */}
          {account && !profile?.kycStatus?.verified && !kycBannerDismissed && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-400 mb-1">Identity Verification Recommended</h3>
                    <p className="text-sm text-yellow-300/80 mb-2">
                      Verify your identity to unlock full platform features, invest over €1,000, and withdraw funds. The process takes just 1-2 minutes.
                    </p>
                    <Link
                      href="/dashboard?tab=profile&section=kyc"
                      className="inline-block px-4 py-2 bg-yellow-500 text-black text-sm font-medium rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                      Verify Now
                    </Link>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Store dismissal in localStorage and hide banner
                    if (typeof window !== 'undefined' && account) {
                      localStorage.setItem(`kyc_reminder_dismissed_${account}`, Date.now().toString());
                      setKycBannerDismissed(true);
                    }
                  }}
                  className="text-yellow-400/60 hover:text-yellow-400 transition-colors"
                  title="Dismiss for 24 hours"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light hover:border-accent-yellow/50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-primary-gray-lighter mb-1">Wallet Balance</p>
                    <p className="text-2xl font-bold text-white group-hover:text-accent-yellow transition-colors">
                      {user?.balance ? parseFloat(user.balance).toFixed(4) : '0.0000'} ETH
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-gray-light rounded-lg flex items-center justify-center group-hover:bg-accent-yellow/20 transition-colors">
                    <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light hover:border-accent-yellow/50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-primary-gray-lighter mb-1">Total Invested</p>
                    <p className="text-2xl font-bold text-white group-hover:text-accent-yellow transition-colors">
                      {userStats ? parseFloat(userStats.totalInvestedAmount).toFixed(4) : '0.0000'} ETH
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-gray-light rounded-lg flex items-center justify-center group-hover:bg-accent-yellow/20 transition-colors">
                    <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light hover:border-accent-yellow/50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-primary-gray-lighter mb-1">Active Investments</p>
                    <p className="text-2xl font-bold text-white group-hover:text-accent-yellow transition-colors">
                      {userStats ? userStats.activeCount : 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-gray-light rounded-lg flex items-center justify-center group-hover:bg-accent-yellow/20 transition-colors">
                    <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light hover:border-accent-yellow/50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-primary-gray-lighter mb-1">Total Profit</p>
                    <p className="text-2xl font-bold text-accent-yellow">
                      +{totalProfit.toFixed(4)} ETH
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-gray-light rounded-lg flex items-center justify-center group-hover:bg-accent-yellow/20 transition-colors">
                    <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light hover:border-accent-yellow/50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-primary-gray-lighter mb-1">$TAI Tokens</p>
                    <p className="text-2xl font-bold text-accent-yellow">
                      {taiTokenBalance.toFixed(2)} $TAI
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-gray-light rounded-lg flex items-center justify-center group-hover:bg-accent-yellow/20 transition-colors">
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
              
              {/* KYC Quick Link if not verified */}
              {account && !profile?.kycStatus?.verified && (
                <div className="mt-4 pt-4 border-t border-primary-gray-light">
                  <Link
                    href="/dashboard?tab=profile&section=kyc"
                    className="flex items-center justify-between p-4 border-2 border-yellow-500/50 rounded-lg hover:border-yellow-500 hover:bg-yellow-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-white mb-1">Verify Your Identity</div>
                        <div className="text-sm text-primary-gray-lighter">Unlock full platform features</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
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
                    const totalDays = Math.ceil((investment.withdrawTime - investment.depositTime) / (60 * 60 * 24));
                    const elapsedDays = totalDays - daysRemaining;
                    const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
                    const profit = parseFloat(investment.estimatedReturn) - parseFloat(investment.amount);
                    const profitPercent = (profit / parseFloat(investment.amount)) * 100;
                    
                    return (
                      <div key={actualIndex} className="p-4 bg-black rounded-lg border border-primary-gray-light hover:border-accent-yellow/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
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
                            <p className="text-sm text-green-400">+{profitPercent.toFixed(2)}%</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-primary-gray-lighter">
                            <span>{daysRemaining} days remaining</span>
                            <span>{progress.toFixed(1)}% complete</span>
                          </div>
                          <div className="w-full bg-primary-gray-light rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-accent-yellow to-accent-yellow-dark h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Portfolio Chart */}
            {account && (
              <PortfolioChart address={account} investments={investments} />
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
