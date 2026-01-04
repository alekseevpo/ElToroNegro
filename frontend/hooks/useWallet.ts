'use client';

import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Проверить подключение при загрузке
    checkConnection();

    // Слушать изменения аккаунтов
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return;
    }

    try {
      const ethereum = (window as any).ethereum;
      const provider = new BrowserProvider(ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        setAccount(accounts[0].address);
        setProvider(provider);
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
      setProvider(null);
    } else {
      setAccount(accounts[0]);
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        setProvider(new BrowserProvider((window as any).ethereum));
      }
    }
  };

  const handleChainChanged = () => {
    // Перезагрузить страницу при смене сети
    window.location.reload();
  };

  const connect = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('Please install MetaMask!');
    }

    setLoading(true);
    setError(null);

    try {
      const ethereum = (window as any).ethereum;
      const provider = new BrowserProvider(ethereum);
      
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);
      setProvider(provider);

      return address;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    account,
    provider,
    loading,
    error,
    connect,
    disconnect,
    formatAddress,
    isConnected: !!account,
  };
};

