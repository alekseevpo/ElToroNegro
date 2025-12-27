'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import {
  createAuthMessage,
  requestSignature,
  createSession,
  storeSession,
  getStoredSession,
  clearSession,
  validateSession,
  AuthSession,
} from '@/lib/auth-utils';

interface User {
  address: string;
  balance: string;
  isConnected: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  connect: (walletType?: 'metamask' | 'walletconnect' | 'ton') => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  onTonConnect?: (address: string) => void; // Callback for TON wallet connection
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Проверить сохраненное соединение при загрузке
  useEffect(() => {
    checkSavedConnection();
    
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

  const checkSavedConnection = async () => {
    try {
      // Check for stored session (secure authentication with signature)
      const storedSession = getStoredSession();
      if (storedSession) {
        // Validate session (check expiration and signature)
        const isValid = await validateSession(storedSession);
        if (isValid && typeof window !== 'undefined' && (window as any).ethereum) {
          const ethereum = (window as any).ethereum;
          const provider = new ethers.BrowserProvider(ethereum);
          const accounts = await provider.listAccounts();
          
          // Verify the address matches the stored session
          if (accounts.length > 0 && 
              accounts[0].address.toLowerCase() === storedSession.address.toLowerCase()) {
            // Reconnect using existing session (no new signature needed)
            const balance = await provider.getBalance(storedSession.address);
            const balanceInEth = ethers.formatEther(balance);
            
            setUser({
              address: storedSession.address,
              balance: balanceInEth,
              isConnected: true,
            });
            setProvider(provider);
            return;
          }
        }
        // Session is invalid or address doesn't match, clear it
        clearSession();
      }
    } catch (error) {
      console.error('Error checking saved connection:', error);
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async (
    provider: ethers.BrowserProvider, 
    address: string,
    requireSignature: boolean = true
  ) => {
    try {
      const balance = await provider.getBalance(address);
      const balanceInEth = ethers.formatEther(balance);

      // If signature is required, create auth message and request signature
      if (requireSignature) {
        const authMessage = createAuthMessage(address);
        const signature = await requestSignature(provider, authMessage.message);
        
        // Create and store session
        const session = createSession(address, signature, authMessage);
        storeSession(session);
      }

      const userData: User = {
        address,
        balance: balanceInEth,
        isConnected: true,
      };

      setUser(userData);
      setProvider(provider);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const connect = async (walletType: 'metamask' | 'walletconnect' | 'ton' = 'metamask', retryCount = 0): Promise<void> => {
    // Предотвратить множественные запросы
    if (isConnecting && retryCount === 0) {
      console.warn('Connection already in progress');
      return;
    }

    setIsConnecting(true);
    setLoading(true);
    
    try {
      if (walletType === 'metamask') {
        if (typeof window === 'undefined' || !(window as any).ethereum) {
          throw new Error('MetaMask is not installed. Please install MetaMask extension.');
        }

        const ethereum = (window as any).ethereum;
        
        // Check for existing valid session first
        const storedSession = getStoredSession();
        if (storedSession) {
          const isValid = await validateSession(storedSession);
          if (isValid) {
            try {
              const existingAccounts = await ethereum.request({ 
                method: 'eth_accounts',
                params: []
              });
              
              if (existingAccounts && existingAccounts.length > 0 &&
                  existingAccounts[0].toLowerCase() === storedSession.address.toLowerCase()) {
                // Valid session exists, reconnect without new signature
                const provider = new ethers.BrowserProvider(ethereum);
                const balance = await provider.getBalance(storedSession.address);
                const balanceInEth = ethers.formatEther(balance);
                
                setUser({
                  address: storedSession.address,
                  balance: balanceInEth,
                  isConnected: true,
                });
                setProvider(provider);
                return;
              }
            } catch (err) {
              console.log('Error checking existing accounts:', err);
            }
          } else {
            // Session invalid, clear it
            clearSession();
          }
        }

        // Если нет существующих аккаунтов, запросить подключение
        try {
          const accounts = await ethereum.request({ 
            method: 'eth_requestAccounts',
            params: []
          });
          
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found. Please unlock your wallet and try again.');
          }
          
          const provider = new ethers.BrowserProvider(ethereum);
          await connectWallet(provider, accounts[0]);
        } catch (requestError: any) {
          // Обработать специфичные ошибки
          if (requestError.code === 4001) {
            throw new Error('User rejected the connection request');
          } else if (requestError.code === -32002) {
            // Если запрос уже выполняется, подождать и попробовать еще раз
            if (retryCount < 2) {
              setIsConnecting(false);
              setLoading(false);
              // Подождать 2 секунды и попробовать снова
              await new Promise(resolve => setTimeout(resolve, 2000));
              return connect(walletType, retryCount + 1);
            } else {
              throw new Error('MetaMask connection is pending. Please check your MetaMask extension and approve the connection request, then try again.');
            }
          } else {
            throw requestError;
          }
        }
      } else if (walletType === 'ton') {
        // TON Wallet connection will be handled by TonConnectButton component
        // This is a placeholder - actual connection happens via @tonconnect/ui
        throw new Error('TON Wallet connection should be initiated via TonConnectButton');
      } else if (walletType === 'walletconnect') {
        // WalletConnect можно добавить позже
        throw new Error('WalletConnect not implemented yet');
      } else {
        throw new Error('Unknown wallet type');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      const errorMessage = error.code === 4001 
        ? 'User rejected the connection request'
        : error.code === -32002
        ? 'MetaMask connection is pending. Please check your MetaMask extension and approve the connection request, then try again.'
        : error.message || 'Failed to connect wallet';
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
      setLoading(false);
    }
  };

  const disconnect = () => {
    setUser(null);
    setProvider(null);
    clearSession();
  };

  const refreshBalance = async () => {
    if (!user || !provider) return;

    try {
      const balance = await provider.getBalance(user.address);
      const balanceInEth = ethers.formatEther(balance);

      setUser({
        ...user,
        balance: balanceInEth,
      });
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else if (provider) {
      await connectWallet(provider, accounts[0]);
    }
  };

  const handleChainChanged = () => {
    // Перезагрузить страницу при смене сети
    window.location.reload();
  };

  // Обновлять баланс периодически
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 30000); // Обновлять каждые 30 секунд

    return () => clearInterval(interval);
  }, [user, provider]);

  // Комбинировать loading состояния
  const isLoading = loading || isConnecting;

  // Handler for TON wallet connection
  const handleTonConnect = (address: string) => {
    // For TON wallet, we'll store the address differently
    // Since TON uses different address format, we'll treat it as a connected user
    setUser({
      address,
      balance: '0', // TON balance would need separate API call
      isConnected: true,
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: isLoading, 
      connect, 
      disconnect, 
      refreshBalance,
      onTonConnect: handleTonConnect 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

