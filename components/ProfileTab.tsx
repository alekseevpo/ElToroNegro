'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserProfile,
  initializeProfile,
  updateProfile,
  connectWallet,
  connectSocial,
  disconnectWallet,
  disconnectSocial,
  type UserProfile,
  isValidReferralCode,
  getKYCStatus,
  isKYCVerified,
} from '@/lib/profile-utils';
import KYCVerification from './KYCVerification';

interface ProfileTabProps {
  account: string;
}

export default function ProfileTab({ account }: ProfileTabProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [connectingSocial, setConnectingSocial] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'profile' | 'kyc'>('profile');

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  // Check URL params for KYC section
  useEffect(() => {
    const section = searchParams?.get('section');
    if (section === 'kyc') {
      setActiveSection('kyc');
    }
  }, [searchParams]);

  const loadProfile = () => {
    if (!account) {
      setLoading(false);
      return;
    }

    let userProfile = getUserProfile(account);
    
    // Check for referral code from URL or localStorage
    const refFromUrl = searchParams?.get('ref');
    const pendingRef = refFromUrl || localStorage.getItem(`pending_ref_${account.toLowerCase()}`);
    
    // If no profile exists, create one with default username
    if (!userProfile) {
      const defaultUsername = `user_${account.slice(2, 8)}`;
      userProfile = initializeProfile(account, defaultUsername, pendingRef || undefined);
      // Clear pending referral after using it
      if (pendingRef) {
        localStorage.removeItem(`pending_ref_${account.toLowerCase()}`);
      }
    } else if (!userProfile.referredBy && pendingRef) {
      // Profile exists but no referral code, apply pending one
      const updated = updateProfile(account, { referredBy: pendingRef });
      if (updated) {
        userProfile = updated;
        localStorage.removeItem(`pending_ref_${account.toLowerCase()}`);
        setMessage({ type: 'success', text: 'Referral code applied successfully!' });
      }
    }
    
    setProfile(userProfile);
    setUsernameInput(userProfile.username);
    setLoading(false);
  };

  const handleSaveUsername = () => {
    if (!usernameInput.trim()) {
      setMessage({ type: 'error', text: 'Username cannot be empty' });
      return;
    }

    if (!profile) {
      // Create new profile
      const newProfile = initializeProfile(account, usernameInput.trim());
      setProfile(newProfile);
      setMessage({ type: 'success', text: 'Username saved successfully!' });
    } else {
      setMessage({ type: 'error', text: 'Username cannot be changed after creation' });
    }
    setEditingUsername(false);
  };

  const handleEnterReferralCode = () => {
    if (!referralCodeInput.trim()) {
      setMessage({ type: 'error', text: 'Please enter a referral code' });
      return;
    }

    if (!isValidReferralCode(referralCodeInput.trim().toUpperCase())) {
      setMessage({ type: 'error', text: 'Invalid referral code format' });
      return;
    }

    if (profile && profile.referredBy) {
      setMessage({ type: 'error', text: 'You have already entered a referral code' });
      return;
    }

    // Update profile with referral code
    if (profile) {
      const updated = updateProfile(account, { referredBy: referralCodeInput.trim().toUpperCase() });
      if (updated) {
        setProfile(updated);
        setMessage({ type: 'success', text: 'Referral code applied successfully!' });
        setReferralCodeInput('');
      }
    } else {
      // Create profile with referral code
      const defaultUsername = `user_${account.slice(2, 8)}`;
      const newProfile = initializeProfile(account, defaultUsername, referralCodeInput.trim().toUpperCase());
      setProfile(newProfile);
      setMessage({ type: 'success', text: 'Referral code applied successfully!' });
      setReferralCodeInput('');
    }
  };

  const handleConnectWallet = async (walletType: 'coinbase' | 'trustwallet') => {
    setConnectingWallet(walletType);
    setMessage(null);
    
    // Simulate wallet connection (in production, implement actual wallet connection)
    setTimeout(() => {
      // For demo purposes, use a mock address
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      const updated = connectWallet(account, walletType, mockAddress);
      if (updated) {
        setProfile(updated);
        setMessage({ type: 'success', text: `${walletType} connected successfully!` });
      }
      setConnectingWallet(null);
    }, 1000);
  };

  const handleDisconnectWallet = (walletType: 'coinbase' | 'trustwallet') => {
    const updated = disconnectWallet(account, walletType);
    if (updated) {
      setProfile(updated);
      setMessage({ type: 'success', text: `${walletType} disconnected successfully!` });
    }
  };

  const handleConnectSocial = (socialType: 'twitter' | 'telegram' | 'discord' | 'email') => {
    setConnectingSocial(socialType);
    setMessage(null);
    
    // Prompt for social ID
    const socialId = prompt(`Enter your ${socialType} username/ID:`);
    if (socialId && socialId.trim()) {
      const updated = connectSocial(account, socialType, socialId.trim());
      if (updated) {
        setProfile(updated);
        setMessage({ type: 'success', text: `${socialType} connected successfully!` });
      }
    }
    setConnectingSocial(null);
  };

  const handleDisconnectSocial = (socialType: 'twitter' | 'telegram' | 'discord' | 'email') => {
    const updated = disconnectSocial(account, socialType);
    if (updated) {
      setProfile(updated);
      setMessage({ type: 'success', text: `${socialType} disconnected successfully!` });
    }
  };

  const copyReferralCode = async () => {
    if (!profile?.referralCode) return;
    
    const codeToCopy = profile.referralCode.trim();
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(codeToCopy);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = codeToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
      }
      
      // Show success message
      setMessage({ type: 'success', text: 'Referral code copied to clipboard!' });
      
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setMessage({ type: 'error', text: 'Failed to copy referral code. Please try again.' });
    }
  };

  const copyReferralLink = async () => {
    if (!profile?.referralCode) return;
    
    const link = `${window.location.origin}?ref=${profile.referralCode}`;
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
      }
      
      // Show success message
      setMessage({ type: 'success', text: 'Referral link copied to clipboard!' });
      
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setMessage({ type: 'error', text: 'Failed to copy referral link. Please try again.' });
    }
  };

  const kycStatus = account ? getKYCStatus(account) : null;
  const isVerified = account ? isKYCVerified(account) : false;

  const handleKYCComplete = () => {
    loadProfile(); // Reload profile to get updated KYC status
    setActiveSection('profile');
    setMessage({ type: 'success', text: 'Identity verification completed successfully!' });
  };

  if (loading) {
    return (
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <p className="text-primary-gray-lighter">Loading profile...</p>
      </div>
    );
  }

  // KYC Section View
  if (activeSection === 'kyc') {
    return (
      <div className="space-y-6">
        <div className="bg-primary-gray rounded-xl shadow-sm border border-primary-gray-light">
          <div className="p-6 border-b border-primary-gray-light">
            <button
              onClick={() => setActiveSection('profile')}
              className="text-primary-gray-lighter hover:text-black mb-4 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Profile</span>
            </button>
            <h2 className="text-2xl font-bold text-black">Identity Verification</h2>
          </div>
          
          <div className="p-6">
            {!isVerified ? (
              <KYCVerification 
                onComplete={handleKYCComplete}
                onError={(error) => setMessage({ type: 'error', text: error })}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Verified</h3>
                <p className="text-primary-gray-lighter mb-4">
                  Your identity has been verified successfully.
                </p>
                {kycStatus?.verificationDate && (
                  <p className="text-sm text-primary-gray-lighter">
                    Verified on {new Date(kycStatus.verificationDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <p className="text-primary-gray-lighter">Error loading profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <h2 className="text-xl font-bold text-white mb-6">Basic Information</h2>
        
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
              Username {profile.username && <span className="text-primary-gray-lighter text-xs">(cannot be changed)</span>}
            </label>
            {!profile.username || editingUsername ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter username"
                  className="flex-1 px-4 py-2 border border-primary-gray-light rounded-lg focus:ring-2 focus:ring-accent-yellow focus:border-transparent"
                  disabled={!!profile.username}
                />
                <button
                  onClick={handleSaveUsername}
                  className="px-4 py-2 bg-accent-yellow text-black rounded-lg hover:bg-accent-yellow-light transition-colors"
                  disabled={!!profile.username}
                >
                  {profile.username ? 'Locked' : 'Save'}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-black rounded-lg border border-primary-gray-light flex items-center justify-between">
                <p className="font-semibold text-black">{profile.username}</p>
                <span className="text-xs text-primary-gray-lighter">Immutable</span>
              </div>
            )}
          </div>

          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-primary-gray-lighter mb-2">Primary Wallet Address</label>
            <div className="p-3 bg-black rounded-lg border border-primary-gray-light">
              <p className="font-mono text-sm text-white">{account}</p>
            </div>
          </div>

          {/* Account Balance */}
          <div>
            <label className="block text-sm font-medium text-primary-gray-lighter mb-2">Account Balance</label>
            <div className="p-3 bg-black rounded-lg border border-primary-gray-light">
              <p className="text-lg font-semibold text-white">
                {user?.balance ? parseFloat(user.balance).toFixed(4) : '0.0000'} ETH
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <h2 className="text-xl font-bold text-white mb-6">Referral Code</h2>
        
        <div className="space-y-4">
          {/* My Referral Code */}
          <div>
            <label className="block text-sm font-medium text-primary-gray-lighter mb-2">Your Referral Code</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-black rounded-lg border border-primary-gray-light">
                <p className="font-mono text-lg font-bold text-white">{profile.referralCode}</p>
              </div>
              <button
                onClick={copyReferralCode}
                className="px-4 py-2 bg-accent-yellow text-black rounded-lg hover:bg-accent-yellow-light transition-colors"
              >
                Copy
              </button>
            </div>
            <button
              onClick={copyReferralLink}
              className="mt-2 text-sm text-accent-yellow hover:text-accent-yellow-light font-medium"
            >
              Copy Referral Link →
            </button>
          </div>

          {/* Enter Referral Code */}
          {!profile.referredBy && (
            <div>
              <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
                Enter Referral Code (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  className="flex-1 px-4 py-2 bg-black border border-primary-gray-light rounded-lg focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow font-mono text-white"
                  maxLength={9}
                />
                <button
                  onClick={handleEnterReferralCode}
                  className="px-4 py-2 bg-accent-yellow text-black rounded-lg hover:bg-accent-yellow-light transition-colors"
                >
                  Apply
                </button>
              </div>
              <p className="mt-1 text-xs text-primary-gray-lighter">
                Enter the referral code of the user who invited you to increase their bonus
              </p>
            </div>
          )}

          {/* Referred By */}
          {profile.referredBy && (
            <div>
              <label className="block text-sm font-medium text-primary-gray-lighter mb-2">Referred By</label>
              <div className="p-3 bg-black rounded-lg border border-primary-gray-light">
                <p className="font-mono font-semibold text-white">{profile.referredBy}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connected Wallets */}
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <h2 className="text-xl font-bold text-white mb-6">Connected Wallets</h2>
        
        <div className="space-y-3">
          {/* MetaMask - always shown if connected */}
          {user?.isConnected && (
            <div className="flex items-center justify-between p-4 border border-primary-gray-light rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-black border border-primary-gray-light rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-gray-lighter" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 12L12 2L2 12L6 12L6 22L10 22L10 16L14 16L14 22L18 22L18 12Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">MetaMask</p>
                  <p className="text-sm text-primary-gray-lighter">{account.slice(0, 6)}...{account.slice(-4)}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-accent-yellow text-black text-xs font-medium rounded-full">Connected</span>
            </div>
          )}

          {/* Coinbase Wallet */}
          <div className="flex items-center justify-between p-4 border border-primary-gray-light rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black border border-primary-gray-light rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-gray-lighter" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect width="24" height="24" rx="4" strokeWidth="1.5"/>
                  <text x="12" y="17" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold">CB</text>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">Coinbase Wallet</p>
                <p className="text-sm text-primary-gray-lighter">
                  {profile.wallets.coinbase ? `${profile.wallets.coinbase.slice(0, 6)}...${profile.wallets.coinbase.slice(-4)}` : 'Not connected'}
                </p>
              </div>
            </div>
            {profile.wallets.coinbase ? (
              <button
                onClick={() => handleDisconnectWallet('coinbase')}
                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 font-medium"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => handleConnectWallet('coinbase')}
                disabled={connectingWallet === 'coinbase'}
                className="px-4 py-2 bg-accent-yellow text-black text-sm rounded-lg hover:bg-accent-yellow-light transition-colors disabled:opacity-50"
              >
                {connectingWallet === 'coinbase' ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>

          {/* Trust Wallet */}
          <div className="flex items-center justify-between p-4 border border-primary-gray-light rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black border border-primary-gray-light rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-gray-lighter" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
                  <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold">TW</text>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">Trust Wallet</p>
                <p className="text-sm text-primary-gray-lighter">
                  {profile.wallets.trustwallet ? `${profile.wallets.trustwallet.slice(0, 6)}...${profile.wallets.trustwallet.slice(-4)}` : 'Not connected'}
                </p>
              </div>
            </div>
            {profile.wallets.trustwallet ? (
              <button
                onClick={() => handleDisconnectWallet('trustwallet')}
                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 font-medium"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => handleConnectWallet('trustwallet')}
                disabled={connectingWallet === 'trustwallet'}
                className="px-4 py-2 bg-accent-yellow text-black text-sm rounded-lg hover:bg-accent-yellow-light transition-colors disabled:opacity-50"
              >
                {connectingWallet === 'trustwallet' ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Social Connections */}
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <h2 className="text-xl font-bold text-white mb-6">Social Connections</h2>
        
        <div className="space-y-3">
          {[
            { key: 'twitter', label: 'Twitter', icon: '𝕏' },
            { key: 'telegram', label: 'Telegram', icon: '✈' },
            { key: 'discord', label: 'Discord', icon: '💬' },
            { key: 'email', label: 'Email', icon: '✉' },
          ].map((social) => {
            const socialKey = social.key as 'twitter' | 'telegram' | 'discord' | 'email';
            const isConnected = !!profile.socialConnections[socialKey];
            const socialId = profile.socialConnections[socialKey];
            
            return (
              <div key={social.key} className="flex items-center justify-between p-4 border border-primary-gray-light rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-black border border-primary-gray-light rounded-lg flex items-center justify-center text-primary-gray-lighter font-bold">
                    {social.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{social.label}</p>
                    <p className="text-sm text-primary-gray-lighter">
                      {isConnected ? `@${socialId}` : 'Not connected'}
                    </p>
                  </div>
                </div>
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnectSocial(socialKey)}
                    className="px-4 py-2 text-sm text-red-400 hover:text-red-300 font-medium"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnectSocial(socialKey)}
                    disabled={connectingSocial === socialKey}
                    className="px-4 py-2 bg-accent-yellow text-black text-sm rounded-lg hover:bg-accent-yellow-light transition-colors disabled:opacity-50 font-medium"
                  >
                    {connectingSocial === socialKey ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

