'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { calculateReferralBonus } from '@/lib/profile-utils';
import { logger } from '@/lib/logger';

interface ReferralsTabProps {
  account: string;
}

export default function ReferralsTab({ account }: ReferralsTabProps) {
  const { profile, loading: profileLoading } = useProfile(account);
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferrals();
  }, [account, profile]);

  const loadReferrals = async () => {
    if (!account) {
      setLoading(false);
      return;
    }

    if (profile) {
      // Fetch referrals from API
      try {
        const response = await fetch(`/api/profile/${account}/referrals`);
        if (response.ok) {
          const data = await response.json();
          setReferredUsers(data.referrals || []);
        }
      } catch (error) {
        logger.error('Error loading referrals', error, { account });
      }
    }
    setLoading(false);
  };

  const totalReferrals = profile?.referrals?.length || 0;
  const bonusPercentage = calculateReferralBonus(totalReferrals);

  if (loading || profileLoading) {
    return (
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <p className="text-primary-gray-lighter">Loading referrals...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <p className="text-primary-gray-lighter">Profile not found. Please complete your profile first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-gray-lighter mb-1">Total Referrals</p>
              <p className="text-3xl font-bold text-white">{totalReferrals}</p>
            </div>
            <div className="w-12 h-12 bg-black border border-primary-gray-light rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-gray-lighter mb-1">Referral Bonus</p>
              <p className="text-3xl font-bold text-white">+{bonusPercentage.toFixed(2)}%</p>
              <p className="text-xs text-gray-500 mt-1">0.5% per referral, max 10%</p>
            </div>
            <div className="w-12 h-12 bg-black border border-primary-gray-light rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-gray-lighter mb-1">Your Referral Code</p>
              <p className="text-lg font-mono font-bold text-white">{profile.referralCode}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(profile.referralCode);
              }}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-accent-yellow transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Referral Info */}
      <div className="bg-black border border-primary-gray-light rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">How Referrals Work</h3>
        <ul className="space-y-2 text-sm text-accent-yellow">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Share your referral code with friends</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>You earn 0.5% bonus on your investment returns for each referral</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Maximum bonus is 10% (20 referrals)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>The more friends you invite, the higher your returns!</span>
          </li>
        </ul>
      </div>

      {/* Referred Users List */}
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <h2 className="text-xl font-bold text-white mb-6">Referred Users</h2>
        
        {referredUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-primary-gray-lighter mb-2">No referrals yet</p>
            <p className="text-sm text-gray-500">Start inviting friends to increase your bonus!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referredUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-primary-gray-light rounded-lg hover:bg-black transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-gray-lighter font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user.username}</p>
                    <p className="text-sm text-gray-500 font-mono">
                      {user.wallets.metamask || user.wallets.ton || 'No wallet'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-primary-gray-lighter">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-primary-gray-lighter font-medium">+0.5% bonus</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

