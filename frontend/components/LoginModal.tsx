'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import TonConnectButtonWrapper from './TonConnectButton';
import { logger } from '@/lib/logger';
import { hashPasswordForStorage } from '@/lib/password-utils';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'signup'; // 'login' for existing users, 'signup' for new users
}

export default function LoginModal({ isOpen, onClose, mode = 'login' }: LoginModalProps) {
  const { connect, onTonConnect } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [savedEmail, setSavedEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');

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
      setConfirmPassword('');
      setStep('email');
      setSavedEmail('');
      setIsSignUp(mode === 'signup');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, mode]);

  // Listen for TON connection
  useEffect(() => {
    if (tonUserAddress && isOpen) {
      setIsLoading(false);
      setError(null);
      
      // Call the auth context handler to set user
      if (onTonConnect) {
        onTonConnect(tonUserAddress);
      }
      
      // Close modal and redirect to dashboard after successful connection
      setTimeout(() => {
        onClose();
        router.push('/dashboard');
      }, 500);
    }
  }, [tonUserAddress, isOpen, onTonConnect, onClose, router]);

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

    // For signup, check password confirmation
    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Registration flow
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: savedEmail, 
            password,
            name: savedEmail.split('@')[0], // Use email prefix as default name
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to register');
        }

        logger.info('User registered successfully', { email: savedEmail });
        
        // After registration, automatically log in
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: savedEmail, password }),
        });

        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
          throw new Error(loginData.error || 'Registration successful, but login failed');
        }

        // Store session data
        if (typeof window !== 'undefined') {
          const sessionData = {
            address: loginData.address,
            email: loginData.email,
            name: loginData.name,
            authType: 'email',
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
          };
          sessionStorage.setItem('auth_session', JSON.stringify(sessionData));
          
          // Trigger page reload to update auth state
          window.location.href = '/dashboard';
          return;
        }
      } else {
        // Login flow
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: savedEmail, password }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Invalid email or password');
        }

        // Store session data
        if (typeof window !== 'undefined') {
          const sessionData = {
            address: data.address,
            email: data.email,
            name: data.name,
            authType: 'email',
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
          };
          sessionStorage.setItem('auth_session', JSON.stringify(sessionData));
          
          // Trigger page reload to update auth state
          window.location.href = '/dashboard';
          return;
        }
      }
    } catch (err: any) {
      setError(err.message || (isSignUp ? 'Failed to register' : 'Invalid email or password'));
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleWalletConnect = async (walletType: 'metamask' | 'ton' | 'coinbase' = 'metamask') => {
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
        
        // Close modal and redirect to dashboard after successful connection
        setTimeout(() => {
          onClose();
          router.push('/dashboard');
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
      } else if (walletType === 'coinbase') {
        // Coinbase Wallet connection (works through window.ethereum)
        if (typeof window === 'undefined' || !(window as any).ethereum) {
          setError('No Ethereum wallet detected. Please install Coinbase Wallet or MetaMask.');
          setIsLoading(false);
          return;
        }

        const ethereum = (window as any).ethereum;
        
        // Check if Coinbase Wallet is available (it sets isCoinbaseWallet flag)
        // Coinbase Wallet also works through window.ethereum, so we can use the same connect method
        // But we can detect it by checking ethereum.isCoinbaseWallet
        if (ethereum.isCoinbaseWallet || ethereum.providers?.some((p: any) => p.isCoinbaseWallet)) {
          // Connect through Coinbase Wallet
          await connect('metamask'); // Use same method as MetaMask since they both use window.ethereum
        } else {
          // Try to connect anyway - might work if Coinbase Wallet is the default provider
          await connect('metamask');
        }
        
        // Close modal and redirect to dashboard after successful connection
        setTimeout(() => {
          onClose();
          router.push('/dashboard');
        }, 300);
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
          {isSignUp ? 'Create Account' : 'Welcome to El Toro Negro'}
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
                {isSignUp ? 'Create Password' : 'Password'}
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
                {isSignUp ? 'Creating account for' : 'Signing in as'}: <span className="text-white">{savedEmail}</span>
              </p>
            </div>
            <div className="space-y-3">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSignUp && handlePasswordSubmit()}
                placeholder={isSignUp ? 'Create a password (min 6 characters)' : 'Enter your password'}
                className="w-full px-4 py-2 bg-black border border-primary-gray-light rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow outline-none"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              {isSignUp && (
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2 bg-black border border-primary-gray-light rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow outline-none"
                  autoComplete="new-password"
                />
              )}
              <button
                onClick={handlePasswordSubmit}
                disabled={isLoading || !password || (isSignUp && !confirmPassword)}
                className="w-full px-6 py-2 bg-accent-yellow hover:bg-accent-yellow-dark text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading 
                  ? (isSignUp ? 'Creating account...' : 'Signing in...') 
                  : (isSignUp ? 'Create Account' : 'Sign In')
                }
              </button>
            </div>
          </div>
        )}

        {/* Wallet Options - Only show on email step */}
        {step === 'email' && (
          <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
          {/* MetaMask */}
          <button
            onClick={() => handleWalletConnect('metamask')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-primary-gray-light hover:border-accent-yellow transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Connect MetaMask"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-[#F6851B] rounded-lg">
              <span className="text-white font-bold text-xs">MM</span>
            </div>
            <span className="text-xs text-primary-gray-lighter">MetaMask</span>
          </button>

          {/* TON Wallet */}
          <button
            onClick={() => handleWalletConnect('ton')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-primary-gray-light hover:border-accent-yellow transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Connect TON Wallet"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-[#0088CC] rounded-lg">
              <span className="text-white font-bold text-xs">TON</span>
            </div>
            <span className="text-xs text-primary-gray-lighter">TON Wallet</span>
          </button>

          {/* Coinbase Wallet */}
          <button
            onClick={() => handleWalletConnect('coinbase')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-primary-gray-light hover:border-accent-yellow transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Connect Coinbase Wallet"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-[#0052FF] rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="white"/>
                <rect x="10" y="10" width="4" height="4" rx="1" fill="white"/>
              </svg>
            </div>
            <span className="text-xs text-primary-gray-lighter">Coinbase</span>
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
