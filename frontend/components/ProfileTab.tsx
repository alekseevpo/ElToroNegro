'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    type UserProfile,
    isValidReferralCode,
  } from '@/lib/profile-utils';
import { useProfile } from '@/hooks/useProfile';
import { useProfileMutation } from '@/hooks/useProfileMutation';
import KYCVerification from './KYCVerification';
import Avatar from './Avatar';
import KYCBadge from './KYCBadge';
import { AVAILABLE_AVATARS, getAvatarEmoji } from '@/lib/avatars';
import { hashPasswordForStorage } from '@/lib/password-utils';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';

interface ProfileTabProps {
  account: string;
}

export default function ProfileTab({ account }: ProfileTabProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { profile, loading: profileLoading, error: profileError, refetch } = useProfile(account);
  const { createProfile, updateProfile, loading: mutationLoading, error: mutationError } = useProfileMutation();
  
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [selectingAvatar, setSelectingAvatar] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [connectingSocial, setConnectingSocial] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'profile' | 'kyc'>('profile');

  const loading = profileLoading || mutationLoading;
  const error = profileError || mutationError;

  // Check URL params for KYC section
  useEffect(() => {
    const section = searchParams?.get('section');
    if (section === 'kyc') {
      setActiveSection('kyc');
    }
  }, [searchParams]);

  // Initialize inputs when profile loads
  useEffect(() => {
    if (profile) {
      setUsernameInput(profile.username);
      setNameInput(profile.name || user?.name || '');
      setEmailInput(profile.email || '');
    } else if (!profileLoading && account) {
      // No profile exists, set default username
      const defaultUsername = `user_${account.slice(2, 8)}`;
      setUsernameInput(defaultUsername);
    }
  }, [profile, profileLoading, account, user]);

  // Handle referral code from URL
  useEffect(() => {
    if (!account || !profile) return;
    
    const refFromUrl = searchParams?.get('ref');
    if (refFromUrl && !profile.referredBy) {
      handleApplyReferralCode(refFromUrl);
    }
  }, [account, profile, searchParams]);

  const handleApplyReferralCode = async (referralCode: string) => {
    if (!account || !isValidReferralCode(referralCode)) return;
    
    const updated = await updateProfile(account, { referredBy: referralCode });
    if (updated) {
      setMessage({ type: 'success', text: 'Referral code applied successfully!' });
      refetch();
    }
  };

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) {
      setMessage({ type: 'error', text: 'Username cannot be empty' });
      return;
    }

    if (!account) {
      setMessage({ type: 'error', text: 'Account address is required' });
      return;
    }

    if (!profile) {
      // Create new profile
      const refFromUrl = searchParams?.get('ref');
      const newProfile = await createProfile({
        address: account,
        username: usernameInput.trim(),
        referredBy: refFromUrl || undefined,
      });
      
      if (newProfile) {
        setMessage({ type: 'success', text: 'Username saved successfully!' });
        refetch();
      } else {
        setMessage({ type: 'error', text: mutationError || 'Failed to create profile' });
      }
    } else {
      setMessage({ type: 'error', text: 'Username cannot be changed after creation' });
    }
    setEditingUsername(false);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      setMessage({ type: 'error', text: 'Display name cannot be empty' });
      return;
    }

    if (!profile || !account) {
      setMessage({ type: 'error', text: 'Profile not found' });
      return;
    }

    const updated = await updateProfile(account, { name: nameInput.trim() });
    if (updated) {
      setMessage({ type: 'success', text: 'Display name updated successfully!' });
      setEditingName(false);
      refetch();
    } else {
      setMessage({ type: 'error', text: mutationError || 'Failed to update display name' });
    }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    if (!profile || !account) {
      setMessage({ type: 'error', text: 'Profile not found' });
      return;
    }

    const updated = await updateProfile(account, { avatar: avatarId });
    if (updated) {
      setMessage({ type: 'success', text: 'Avatar updated successfully!' });
      setSelectingAvatar(false);
      refetch();
    } else {
      setMessage({ type: 'error', text: mutationError || 'Failed to update avatar' });
    }
  };

  const handleSaveEmail = async () => {
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    if (!profile || !account) {
      setMessage({ type: 'error', text: 'Profile not found' });
      return;
    }

    const updated = await updateProfile(account, { email: emailInput.trim().toLowerCase() });
    if (updated) {
      setMessage({ type: 'success', text: 'Email updated successfully!' });
      setEditingEmail(false);
      setEmailInput('');
      refetch();
    } else {
      setMessage({ type: 'error', text: mutationError || 'Failed to update email' });
    }
  };

  const handleSavePassword = async () => {
    if (!passwordInput || passwordInput.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    if (passwordInput !== confirmPasswordInput) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (!profile) {
      setMessage({ type: 'error', text: 'Profile not found' });
      return;
    }

    try {
      const passwordHash = await hashPasswordForStorage(passwordInput);
      const updated = await updateProfile(account, { passwordHash });
      if (updated) {
        setMessage({ type: 'success', text: 'Password set successfully!' });
        setEditingPassword(false);
        setPasswordInput('');
        setConfirmPasswordInput('');
        refetch();
      } else {
        setMessage({ type: 'error', text: mutationError || 'Failed to set password' });
      }
    } catch (error: unknown) {
      const { message } = handleError(error);
      logger.error('Error hashing password', error);
      setMessage({ type: 'error', text: message || 'Failed to set password. Please try again.' });
    }
  };

  const handleEnterReferralCode = async () => {
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

    if (!account) {
      setMessage({ type: 'error', text: 'Account address is required' });
      return;
    }

    // Update profile with referral code
    if (profile) {
      const updated = await updateProfile(account, { referredBy: referralCodeInput.trim().toUpperCase() });
      if (updated) {
        setMessage({ type: 'success', text: 'Referral code applied successfully!' });
        setReferralCodeInput('');
        refetch();
      } else {
        setMessage({ type: 'error', text: mutationError || 'Failed to apply referral code' });
      }
    } else {
      // Create profile with referral code
      const defaultUsername = `user_${account.slice(2, 8)}`;
      const newProfile = await createProfile({
        address: account,
        username: defaultUsername,
        referredBy: referralCodeInput.trim().toUpperCase(),
      });
      if (newProfile) {
        setMessage({ type: 'success', text: 'Referral code applied successfully!' });
        setReferralCodeInput('');
        refetch();
      } else {
        setMessage({ type: 'error', text: mutationError || 'Failed to create profile' });
      }
    }
  };

  const handleConnectWallet = async (walletType: 'coinbase' | 'trustwallet') => {
    if (!account || !profile) {
      setMessage({ type: 'error', text: 'Profile not found' });
      return;
    }

    setConnectingWallet(walletType);
    setMessage(null);
    
    // Simulate wallet connection (in production, implement actual wallet connection)
    setTimeout(async () => {
      // For demo purposes, use a mock address
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      const wallets = { ...profile.wallets, [walletType]: mockAddress };
      const updated = await updateProfile(account, { wallets });
      if (updated) {
        setMessage({ type: 'success', text: `${walletType} connected successfully!` });
        refetch();
      } else {
        setMessage({ type: 'error', text: mutationError || `Failed to connect ${walletType}` });
      }
      setConnectingWallet(null);
    }, 1000);
  };

  const handleDisconnectWallet = async (walletType: 'coinbase' | 'trustwallet') => {
    if (!account || !profile) {
      setMessage({ type: 'error', text: 'Profile not found' });
      return;
    }

    const wallets = { ...profile.wallets };
    delete wallets[walletType];
    const updated = await updateProfile(account, { wallets });
    if (updated) {
      setMessage({ type: 'success', text: `${walletType} disconnected successfully!` });
      refetch();
    } else {
      setMessage({ type: 'error', text: mutationError || `Failed to disconnect ${walletType}` });
    }
  };

  const handleConnectSocial = async (socialType: 'twitter' | 'telegram' | 'discord' | 'email') => {
    if (!account || !profile) {
      setMessage({ type: 'error', text: 'Profile not found' });
      return;
    }

    setConnectingSocial(socialType);
    setMessage(null);
    
    // Prompt for social ID
    const socialId = prompt(`Enter your ${socialType} username/ID:`);
    if (socialId && socialId.trim()) {
      const socialConnections = { ...profile.socialConnections, [socialType]: socialId.trim() };
      const updated = await updateProfile(account, { socialConnections });
      if (updated) {
        setMessage({ type: 'success', text: `${socialType} connected successfully!` });
        refetch();
      } else {
        setMessage({ type: 'error', text: mutationError || `Failed to connect ${socialType}` });
      }
    }
    setConnectingSocial(null);
  };

  const handleDisconnectSocial = async (socialType: 'twitter' | 'telegram' | 'discord' | 'email') => {
    if (!account || !profile) {
      setMessage({ type: 'error', text: 'Profile not found' });
      return;
    }

    const socialConnections = { ...profile.socialConnections };
    delete socialConnections[socialType];
    const updated = await updateProfile(account, { socialConnections });
    if (updated) {
      setMessage({ type: 'success', text: `${socialType} disconnected successfully!` });
      refetch();
    } else {
      setMessage({ type: 'error', text: mutationError || `Failed to disconnect ${socialType}` });
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
          logger.debug('Fallback copy failed', { error: err });
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
      logger.error('Failed to copy referral code', error);
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
          logger.debug('Fallback copy failed', { error: err });
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
      logger.error('Failed to copy referral link', error);
      setMessage({ type: 'error', text: 'Failed to copy referral link. Please try again.' });
    }
  };

  const kycStatus = profile?.kycStatus || null;
  const isVerified = profile?.kycStatus?.verified || false;
  const kycHistory = profile?.kycHistory || [];

  const handleKYCComplete = () => {
    refetch(); // Reload profile to get updated KYC status
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


  // Calculate profile stats
  const portfolio = profile?.portfolio || [];
  const totalPortfolioValue = portfolio.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
  const memberSince = profile ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';

  return (
    <div className="space-y-6">
      {/* Profile Header with Avatar */}
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar
            name={user?.name || profile?.username || account}
            address={account}
            picture={user?.picture}
            size={80}
            className="ring-2 ring-accent-yellow/50"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">
                {user?.name || profile?.username || `User ${account.slice(0, 6)}...${account.slice(-4)}`}
              </h1>
              {account && <KYCBadge />}
            </div>
            <p className="text-primary-gray-lighter mb-1 font-mono text-sm">{account}</p>
            <p className="text-sm text-primary-gray-lighter">Member since {memberSince}</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-right">
              <p className="text-xs text-primary-gray-lighter">Account Balance</p>
              <p className="text-xl font-bold text-accent-yellow">
                {user?.balance ? parseFloat(user.balance).toFixed(4) : '0.0000'} ETH
              </p>
            </div>
            {totalPortfolioValue > 0 && (
              <div className="text-right">
                <p className="text-xs text-primary-gray-lighter">Portfolio Value</p>
                <p className="text-lg font-semibold text-white">
                  €{totalPortfolioValue.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-primary-gray rounded-xl p-4 border border-primary-gray-light">
          <p className="text-sm text-primary-gray-lighter mb-1">Total Investments</p>
          <p className="text-2xl font-bold text-white">
            {profile?.transactions?.filter(t => t.type === 'investment').length || 0}
          </p>
        </div>
        <div className="bg-primary-gray rounded-xl p-4 border border-primary-gray-light">
          <p className="text-sm text-primary-gray-lighter mb-1">Referrals</p>
          <p className="text-2xl font-bold text-white">
            {profile?.referrals?.length || 0}
          </p>
        </div>
        <div className="bg-primary-gray rounded-xl p-4 border border-primary-gray-light">
          <p className="text-sm text-primary-gray-lighter mb-1">Connected Wallets</p>
          <p className="text-2xl font-bold text-white">
            {Object.values(profile?.wallets || {}).filter(Boolean).length + (user?.isConnected ? 1 : 0)}
          </p>
        </div>
        <div className="bg-primary-gray rounded-xl p-4 border border-primary-gray-light">
          <p className="text-sm text-primary-gray-lighter mb-1">Social Connections</p>
          <p className="text-2xl font-bold text-white">
            {Object.values(profile?.socialConnections || {}).filter(Boolean).length}
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <h2 className="text-xl font-bold text-white mb-6">Basic Information</h2>
        
        <div className="space-y-4">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
              Avatar
            </label>
            {!selectingAvatar ? (
              <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-primary-gray-light">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{getAvatarEmoji(profile?.avatar)}</div>
                  <div>
                    <p className="font-semibold text-white">
                      {profile?.avatar ? AVAILABLE_AVATARS.find(a => a.id === profile.avatar)?.name : 'Default Avatar'}
                    </p>
                    <p className="text-xs text-primary-gray-lighter">
                      {profile?.avatar ? AVAILABLE_AVATARS.find(a => a.id === profile.avatar)?.category : 'No avatar selected'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectingAvatar(true)}
                  className="px-3 py-1 text-sm text-accent-yellow hover:text-accent-yellow-light font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="p-4 bg-black rounded-lg border border-primary-gray-light">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Select Avatar</h3>
                  <button
                    onClick={() => setSelectingAvatar(false)}
                    className="text-primary-gray-lighter hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto">
                  {AVAILABLE_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleSelectAvatar(avatar.id)}
                      className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                        profile?.avatar === avatar.id
                          ? 'border-accent-yellow bg-accent-yellow/20'
                          : 'border-primary-gray-light hover:border-accent-yellow/50'
                      }`}
                      title={avatar.name}
                    >
                      <div className="text-3xl mb-1">{avatar.emoji}</div>
                      <div className="text-xs text-primary-gray-lighter truncate">{avatar.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-1 text-xs text-primary-gray-lighter">
              Choose a character from movies, series, anime, or games
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
              Display Name
            </label>
            {!editingName ? (
              <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-primary-gray-light">
                <p className="font-semibold text-white">
                  {profile?.name || user?.name || profile?.username || `User ${account.slice(0, 6)}...${account.slice(-4)}`}
                </p>
                <button
                  onClick={() => {
                    setEditingName(true);
                    setNameInput(profile?.name || user?.name || profile?.username || '');
                  }}
                  className="px-3 py-1 text-sm text-accent-yellow hover:text-accent-yellow-light font-medium"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your display name"
                  className="flex-1 px-4 py-2 bg-black border border-primary-gray-light rounded-lg focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow text-white placeholder-gray-500"
                />
                <button
                  onClick={handleSaveName}
                  className="px-4 py-2 bg-accent-yellow text-black rounded-lg hover:bg-accent-yellow-light transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameInput('');
                  }}
                  className="px-4 py-2 bg-primary-gray-light text-white rounded-lg hover:bg-primary-gray transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <p className="mt-1 text-xs text-primary-gray-lighter">
              This is how your name appears to other users
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
              Username {profile?.username && <span className="text-primary-gray-lighter text-xs">(cannot be changed)</span>}
            </label>
            {!profile?.username || editingUsername ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter username"
                  className="flex-1 px-4 py-2 bg-black border border-primary-gray-light rounded-lg focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow text-white placeholder-gray-500"
                  disabled={!!profile.username}
                />
                <button
                  onClick={handleSaveUsername}
                  className="px-4 py-2 bg-accent-yellow text-black rounded-lg hover:bg-accent-yellow-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!!profile.username}
                >
                  {profile.username ? 'Locked' : 'Save'}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-black rounded-lg border border-primary-gray-light flex items-center justify-between">
                <p className="font-semibold text-white">{profile.username}</p>
                <span className="text-xs text-primary-gray-lighter">Immutable</span>
              </div>
            )}
            <p className="mt-1 text-xs text-primary-gray-lighter">
              Your unique username identifier (set once and cannot be changed)
            </p>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
              Email Address
            </label>
            {!editingEmail ? (
              <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-primary-gray-light">
                <p className="font-semibold text-white">
                  {profile?.email || user?.address || 'Not set'}
                </p>
                <button
                  onClick={() => {
                    setEditingEmail(true);
                    setEmailInput(profile?.email || user?.address || '');
                  }}
                  className="px-3 py-1 text-sm text-accent-yellow hover:text-accent-yellow-light font-medium"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-black border border-primary-gray-light rounded-lg focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow text-white placeholder-gray-500"
                />
                <button
                  onClick={handleSaveEmail}
                  className="px-4 py-2 bg-accent-yellow text-black rounded-lg hover:bg-accent-yellow-light transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingEmail(false);
                    setEmailInput('');
                  }}
                  className="px-4 py-2 bg-primary-gray-light text-white rounded-lg hover:bg-primary-gray transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <p className="mt-1 text-xs text-primary-gray-lighter">
              Your email address for account recovery and notifications
            </p>
          </div>

          {/* Password - Show only if no password set (wallet/Google auth) or allow change */}
          {(user?.authType === 'wallet' || user?.authType === 'google' || !profile?.passwordHash) && (
            <div>
              <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
                {profile?.passwordHash ? 'Change Password' : 'Set Password'}
              </label>
              {!editingPassword ? (
                <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-primary-gray-light">
                  <p className="font-semibold text-white">
                    {profile?.passwordHash ? '••••••••' : 'No password set'}
                  </p>
                  <button
                    onClick={() => {
                      setEditingPassword(true);
                      setPasswordInput('');
                      setConfirmPasswordInput('');
                    }}
                    className="px-3 py-1 text-sm text-accent-yellow hover:text-accent-yellow-light font-medium"
                  >
                    {profile?.passwordHash ? 'Change' : 'Set'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 bg-black border border-primary-gray-light rounded-lg focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow text-white placeholder-gray-500"
                  />
                  <input
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 bg-black border border-primary-gray-light rounded-lg focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow text-white placeholder-gray-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePassword}
                      className="flex-1 px-4 py-2 bg-accent-yellow text-black rounded-lg hover:bg-accent-yellow-light transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingPassword(false);
                        setPasswordInput('');
                        setConfirmPasswordInput('');
                      }}
                      className="px-4 py-2 bg-primary-gray-light text-white rounded-lg hover:bg-primary-gray transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-primary-gray-lighter">
                {profile?.passwordHash 
                  ? 'Change your account password. Minimum 6 characters.'
                  : 'Set a password to enable email/password login. Minimum 6 characters.'}
              </p>
            </div>
          )}

          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-primary-gray-lighter mb-2">Primary Wallet Address</label>
            <div className="p-3 bg-black rounded-lg border border-primary-gray-light flex items-center justify-between">
              <p className="font-mono text-sm text-white">{account}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(account);
                  setMessage({ type: 'success', text: 'Address copied to clipboard!' });
                }}
                className="px-3 py-1 text-xs text-accent-yellow hover:text-accent-yellow-light font-medium"
              >
                Copy
              </button>
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

      {/* KYC Verification Section */}
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Identity Verification (KYC)</h2>
            <p className="text-sm text-primary-gray-lighter mt-1">
              Verify your identity to unlock full platform features
            </p>
          </div>
          {account && <KYCBadge />}
        </div>

        {activeSection === 'kyc' ? (
          <div className="mt-4">
            {!isVerified ? (
              <KYCVerification 
                onComplete={handleKYCComplete}
                onError={(error) => setMessage({ type: 'error', text: error })}
              />
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Verified</h3>
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
                <button
                  onClick={() => setActiveSection('profile')}
                  className="mt-4 px-4 py-2 text-sm text-primary-gray-lighter hover:text-white font-medium"
                >
                  ← Back to Profile
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {!isVerified ? (
              <div className="mt-4">
                <button
                  onClick={() => setActiveSection('kyc')}
                  className="inline-block px-6 py-3 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light transition-colors"
                >
                  Start Verification
                </button>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-400">Verified</p>
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
                </div>
              </div>
            )}

            {/* KYC History */}
            {kycHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-primary-gray-light">
                <h3 className="text-lg font-semibold text-white mb-4">Verification History</h3>
                <div className="space-y-3">
                  {kycHistory.map((entry, index) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'verified':
                          return 'bg-green-500/20 text-green-400 border-green-500/30';
                        case 'failed':
                        case 'expired':
                        case 'canceled':
                          return 'bg-red-500/20 text-red-400 border-red-500/30';
                        case 'processing':
                        case 'pending':
                        case 'requires_input':
                          return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                        default:
                          return 'bg-primary-gray-light text-primary-gray-lighter border-primary-gray-light';
                      }
                    };

                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case 'verified':
                          return (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          );
                        case 'failed':
                        case 'expired':
                        case 'canceled':
                          return (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          );
                        case 'processing':
                        case 'pending':
                          return (
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356-2A8.001 8.001 0 004 12c0 2.114.816 4.021 2.174 5.485M16 16v5h.582m-15.356-2A8.001 8.001 0 0120 12c0-2.114-.816-4.021-2.174-5.485" />
                            </svg>
                          );
                        default:
                          return (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          );
                      }
                    };

                    return (
                      <div
                        key={entry.verificationId || index}
                        className={`p-4 rounded-lg border ${getStatusColor(entry.status)}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-0.5">
                              {getStatusIcon(entry.status)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold capitalize">{entry.status.replace('_', ' ')}</p>
                                <span className="text-xs opacity-70">via {entry.provider}</span>
                              </div>
                              <p className="text-xs opacity-80 mb-1">
                                Started: {new Date(entry.verificationDate).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {entry.completedDate && (
                                <p className="text-xs opacity-80 mb-1">
                                  Completed: {new Date(entry.completedDate).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                              {entry.error && (
                                <p className="text-xs opacity-90 mt-1 italic">
                                  Error: {entry.error}
                                </p>
                              )}
                              {entry.verificationId && (
                                <p className="text-xs opacity-60 mt-1 font-mono">
                                  ID: {entry.verificationId.slice(0, 20)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

