'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import TonConnectButtonWrapper from './TonConnectButton';
import { logger } from '@/lib/logger';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { connect, onTonConnect } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [savedEmail, setSavedEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [tonConnectUI] = useTonConnectUI();
  const tonUserAddress = useTonAddress();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setError(null);
      setEmail('');
      setPassword('');
      setStep('email');
      setSavedEmail('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Listen for TON connection
  useEffect(() => {
    if (tonUserAddress && isOpen) {
      setIsLoading(false);
      setError(null);
      
      // Call the auth context handler to set user
      if (onTonConnect) {
        onTonConnect(tonUserAddress);
      }
      
      // Close modal after successful connection
      setTimeout(() => {
        onClose();
      }, 500);
    }
  }, [tonUserAddress, isOpen, onTonConnect, onClose]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Redirect to our API route which will redirect to Google OAuth
      window.location.href = '/api/auth/google';
      // Note: setIsLoading won't be called here as page will redirect
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google Sign-In');
      setIsLoading(false);
    }
  };

  const handleEmailContinue = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setIsLoading(true);
    
    // Simulate email validation (TODO: Replace with actual API call)
    setTimeout(() => {
      setSavedEmail(email);
      setStep('password');
      setIsLoading(false);
    }, 500);
  };

  const handlePasswordSubmit = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError(null);
    setIsLoading(true);

    // TODO: Replace with actual authentication API call
    // For now, simulate authentication
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Call actual authentication endpoint
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: savedEmail, password }),
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.error);

      // For demo purposes, accept any password (replace with actual validation)
      // In production, validate password against backend
      logger.debug('Authenticating user', { email: savedEmail });
      
      // After successful authentication, redirect to dashboard
      onClose();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setPassword('');
    setError(null);
  };

  const handleWalletConnect = async (walletType: 'metamask' | 'ton' = 'metamask') => {
    setError(null);
    setIsLoading(true);

    try {
      if (walletType === 'metamask') {
        // Check if MetaMask is installed
        if (typeof window === 'undefined' || !(window as any).ethereum) {
          setError('MetaMask is not installed. Please install MetaMask extension to continue.');
          setIsLoading(false);
          return;
        }

        // Connect MetaMask wallet
        await connect('metamask');
        
        // Close modal after successful connection
        setTimeout(() => {
          onClose();
        }, 300);
      } else if (walletType === 'ton') {
        // Open TON Connect modal
        try {
          await tonConnectUI.openModal();
          // Don't set loading to false here - wait for connection callback
          // The useEffect hook will handle closing the modal when tonUserAddress is set
        } catch (err: any) {
          setError(err.message || 'Failed to open TON Connect modal. Please make sure you have a TON wallet installed.');
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      // Handle specific error cases
      let errorMessage = 'Failed to connect wallet';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 4001) {
        errorMessage = 'Connection request was rejected. Please try again.';
      } else if (err.code === -32002) {
        errorMessage = 'Connection request is pending. Please check your wallet and approve the connection.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-primary-gray rounded-2xl p-8 w-full max-w-md mx-4 border border-primary-gray-light shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-primary-gray-lighter hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-6">
          Welcome to El Toro Negro
        </h2>

        {/* Google Sign-In Button - Only show on email step */}
        {step === 'email' && (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative flex items-center my-6">
              <div className="flex-grow border-t border-primary-gray-light"></div>
              <span className="flex-shrink mx-4 text-sm text-primary-gray-lighter">OR</span>
              <div className="flex-grow border-t border-primary-gray-light"></div>
            </div>
          </>
        )}

        {/* Email Input Step */}
        {step === 'email' && (
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-primary-gray-lighter mb-2">
              Email address
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailContinue()}
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-black border border-primary-gray-light rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow outline-none"
                autoComplete="email"
              />
              <button
                onClick={handleEmailContinue}
                disabled={isLoading || !email}
                className="px-6 py-2 bg-accent-yellow hover:bg-accent-yellow-dark text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Password Input Step */}
        {step === 'password' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-primary-gray-lighter">
                Password
              </label>
              <button
                onClick={handleBackToEmail}
                className="text-xs text-accent-yellow hover:text-accent-yellow-dark transition-colors"
              >
                ← Back
              </button>
            </div>
            <div className="mb-2">
              <p className="text-xs text-primary-gray-lighter">
                Signing in as: <span className="text-white">{savedEmail}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter your password"
                className="flex-1 px-4 py-2 bg-black border border-primary-gray-light rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow outline-none"
                autoComplete="current-password"
              />
              <button
                onClick={handlePasswordSubmit}
                disabled={isLoading || !password}
                className="px-6 py-2 bg-accent-yellow hover:bg-accent-yellow-dark text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </div>
        )}

        {/* Wallet Options - Only show on email step */}
        {step === 'email' && (
          <div className="flex items-center justify-center gap-6 mb-6">
          {/* MetaMask */}
          <button
            onClick={() => handleWalletConnect('metamask')}
            disabled={isLoading}
            className="flex items-center justify-center w-16 h-16 rounded-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Connect MetaMask"
          >
            <img 
              src="/metamask-icon.svg"
              alt="MetaMask"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </button>

          {/* Telegram/TON Wallet */}
          <button
            onClick={() => handleWalletConnect('ton')}
            disabled={isLoading}
            className="flex items-center justify-center w-16 h-16 rounded-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Connect via Telegram"
          >
            <img 
              src="/telegram-icon.png"
              alt="Telegram"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </button>
        </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Terms */}
        <p className="text-xs text-primary-gray-lighter text-center">
          By connecting, you agree to our{' '}
          <a href="/terms" className="text-accent-yellow hover:underline">
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-accent-yellow hover:underline">
            Privacy
          </a>
        </p>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
