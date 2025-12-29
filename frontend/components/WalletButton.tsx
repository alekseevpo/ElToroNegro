'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from './LoginModal';

export default function WalletButton() {
  const { user, disconnect, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const formatAddress = (address: string) => {
    if (!address) return '';
    // For email addresses (Google auth), show first part before @
    if (address.includes('@')) {
      return address.split('@')[0];
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleLogOut = () => {
    disconnect();
    // Redirect to home page after logout
    router.push('/');
  };

  if (user && user.isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <div className="px-4 py-2 bg-primary-gray rounded-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-white">
            {user.name || formatAddress(user.address)}
          </span>
          {user.balance && user.balance !== '0' && (
            <span className="text-xs text-primary-gray-lighter">({parseFloat(user.balance).toFixed(4)} ETH)</span>
          )}
        </div>
        <button
          onClick={handleLogOut}
          className="px-3 py-2 text-sm text-primary-gray-lighter hover:text-accent-yellow hover:bg-primary-gray rounded-lg transition-colors"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={loading}
        className="px-4 py-2 bg-accent-yellow text-black text-sm font-medium rounded-lg hover:bg-accent-yellow-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </button>
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

