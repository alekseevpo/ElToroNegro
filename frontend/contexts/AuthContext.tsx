'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, formatEther } from 'ethers';
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
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';

interface User {
  address: string;
  balance: string;
  isConnected: boolean;
  authType?: 'wallet' | 'google' | 'ton';
  name?: string;
  picture?: string;
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
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
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
      // Check for email/password session first
      if (typeof window !== 'undefined') {
        const authSessionStr = sessionStorage.getItem('auth_session');
        if (authSessionStr) {
          try {
            const authSession = JSON.parse(authSessionStr);
            if (authSession.expiresAt > Date.now()) {
              // Valid email session
              setUser({
                address: authSession.address,
                balance: '0',
                isConnected: true,
                authType: authSession.authType || 'email',
                name: authSession.name,
                email: authSession.email,
              });
              setLoading(false);
              return;
            } else {
              // Expired session
              sessionStorage.removeItem('auth_session');
            }
          } catch (error) {
            logger.error('Error parsing auth session', error);
            sessionStorage.removeItem('auth_session');
          }
        }
      }

      // Check for Google session
      if (typeof window !== 'undefined') {
        const googleSessionStr = sessionStorage.getItem('google_session');
        if (googleSessionStr) {
          try {
            const googleSession = JSON.parse(googleSessionStr);
            if (googleSession.expiresAt > Date.now()) {
              // Valid Google session
              setUser({
                address: googleSession.email,
                balance: '0',
                isConnected: true,
                authType: 'google',
                name: googleSession.name,
                picture: googleSession.picture,
              });
              setLoading(false);
              return;
            } else {
              // Expired session
              sessionStorage.removeItem('google_session');
            }
          } catch (error) {
            logger.error('Error parsing Google session', error);
            sessionStorage.removeItem('google_session');
          }
        }
      }

      // Check for stored ETH session (secure authentication with signature)
      const storedSession = getStoredSession();
      if (storedSession) {
        // Validate session (check expiration and signature)
        const isValid = await validateSession(storedSession);
        if (isValid && typeof window !== 'undefined' && (window as any).ethereum) {
          const ethereum = (window as any).ethereum;
          const provider = new BrowserProvider(ethereum);
          const accounts = await provider.listAccounts();
          
          // Verify the address matches the stored session
          if (accounts.length > 0 && 
              accounts[0].address.toLowerCase() === storedSession.address.toLowerCase()) {
            // Reconnect using existing session (no new signature needed)
            const balance = await provider.getBalance(storedSession.address);
            const balanceInEth = formatEther(balance);
            
            setUser({
              address: storedSession.address,
              balance: balanceInEth,
              isConnected: true,
              authType: 'wallet',
            });
            setProvider(provider);
            setLoading(false);
            return;
          }
        }
        // Session is invalid or address doesn't match, clear it
        clearSession();
      }

      // Check for TON session
      if (typeof window !== 'undefined') {
        const tonSessionStr = sessionStorage.getItem('ton_session');
        if (tonSessionStr) {
          try {
            const tonSession = JSON.parse(tonSessionStr);
            if (tonSession.expiresAt > Date.now()) {
              // Valid TON session
              setUser({
                address: tonSession.address,
                balance: '0',
                isConnected: true,
                authType: 'ton',
              });
              setLoading(false);
              return;
            } else {
              // Expired session
              sessionStorage.removeItem('ton_session');
            }
          } catch (error) {
            logger.error('Error parsing TON session', error);
            sessionStorage.removeItem('ton_session');
          }
        }
      }
    } catch (error) {
      logger.error('Error checking saved connection', error);
      clearSession();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('ton_session');
        sessionStorage.removeItem('google_session');
      }
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async (
    provider: BrowserProvider, 
    address: string,
    requireSignature: boolean = true
  ) => {
    try {
      const balance = await provider.getBalance(address);
      const balanceInEth = formatEther(balance);

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
        authType: 'wallet',
      };

      setUser(userData);
      setProvider(provider);
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Error connecting wallet', error);
      throw new Error(message || 'Failed to connect wallet');
      throw error;
    }
  };

  const connect = async (walletType: 'metamask' | 'walletconnect' | 'ton' = 'metamask', retryCount = 0): Promise<void> => {
    // Предотвратить множественные запросы
    if (isConnecting && retryCount === 0) {
      logger.warn('Connection already in progress');
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
                const provider = new BrowserProvider(ethereum);
                const balance = await provider.getBalance(storedSession.address);
                const balanceInEth = formatEther(balance);
                
                setUser({
                  address: storedSession.address,
                  balance: balanceInEth,
                  isConnected: true,
                });
                setProvider(provider);
                return;
              }
            } catch (err) {
              logger.debug('Error checking existing accounts', { error: err });
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
          
          const provider = new BrowserProvider(ethereum);
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
    } catch (error: unknown) {
      const { message, code } = handleError(error);
      logger.error('Connection error', error, { walletType });
      const errorMessage = code === 'USER_REJECTED'
        ? 'User rejected the connection request'
        : (error as { code?: number })?.code === -32002
        ? 'MetaMask connection is pending. Please check your MetaMask extension and approve the connection request, then try again.'
        : message || 'Failed to connect wallet';
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
    // Also clear TON and Google sessions
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ton_session');
      sessionStorage.removeItem('google_session');
      localStorage.removeItem('user_data');
    }
  };

  const refreshBalance = async () => {
    if (!user || !provider) return;

    try {
      const balance = await provider.getBalance(user.address);
      const balanceInEth = formatEther(balance);

      setUser({
        ...user,
        balance: balanceInEth,
      });
    } catch (error) {
      logger.error('Error refreshing balance', error, { address: user?.address });
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
  const handleTonConnect = async (address: string) => {
    try {
      // For TON wallet, we'll store the address differently
      // Since TON uses different address format, we'll treat it as a connected user
      // TODO: Fetch actual TON balance from TON API if needed
      setUser({
        address,
        balance: '0', // TON balance would need separate API call to TON blockchain
        isConnected: true,
        authType: 'ton',
      });
      
      // Store TON connection in sessionStorage (simpler than ETH signature flow)
      if (typeof window !== 'undefined') {
        const tonSession = {
          address: address.toLowerCase(),
          walletType: 'ton',
          connectedAt: Date.now(),
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        };
        sessionStorage.setItem('ton_session', JSON.stringify(tonSession));
      }
    } catch (error) {
      logger.error('Error handling TON connection', error, { address });
      throw error;
    }
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

