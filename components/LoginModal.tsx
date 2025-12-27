'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import TonConnectButtonWrapper from './TonConnectButton';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { connect, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Блокировать скролл фона когда модальное окно открыто и сбросить состояние
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Сбросить состояние при открытии модального окна
      setError(null);
      setShowInstructions(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleConnect = async (walletType: 'metamask' | 'walletconnect' = 'metamask') => {
    setError(null);
    setShowInstructions(true);
    
    try {
      await connect(walletType);
      setShowInstructions(false);
      // Небольшая задержка перед закрытием, чтобы состояние обновилось
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err: any) {
      setShowInstructions(false);
      setError(err.message || 'Failed to connect wallet');
    }
  };

  if (!mounted) return null;

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          {/* Modal */}
          <motion.div
            className="relative bg-primary-gray rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-primary-gray-light">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    Connect Wallet
                  </h2>
                  <p className="text-primary-gray-lighter mt-2 text-sm">
                    Choose your preferred wallet provider
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary-gray-light transition-colors text-primary-gray-lighter hover:text-white"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
              {/* Инструкции при подключении */}
              <AnimatePresence>
                {showInstructions && loading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
                  >
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-accent-yellow mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-white mb-2 text-sm">Check your wallet</p>
                        <div className="text-xs text-accent-yellow space-y-1">
                          <p>1. Open your wallet extension</p>
                          <p>2. Approve the connection request</p>
                          <p>3. Sign the authentication message</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-primary-gray border border-accent-yellow rounded-xl"
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <svg className="w-5 h-5 text-accent-yellow mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-white mb-1 text-sm">
                          {error.includes('pending') ? 'Connection Request Pending' : 'Connection Error'}
                        </p>
                        <p className="text-xs text-accent-yellow">{error}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setError(null);
                        handleConnect('metamask');
                      }}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-accent-yellow text-white text-sm font-medium rounded-lg hover:bg-accent-yellow-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Connecting...' : 'Try Again'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wallet Options */}
              <div className="space-y-3">
                {/* MetaMask */}
                <motion.button
                  onClick={() => handleConnect('metamask')}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-5 border-2 border-primary-gray-light rounded-2xl hover:border-accent-yellow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center group-hover:bg-primary-gray transition-colors border border-primary-gray-light">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                        <path d="M22 12L12 2L2 12L6 12L6 22L10 22L10 16L14 16L14 22L18 22L18 12Z" fill="#E2761B"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white text-base">MetaMask</div>
                      <div className="text-sm text-primary-gray-lighter">Connect using MetaMask</div>
                    </div>
                  </div>
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-primary-gray-lighter" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-primary-gray-lighter group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </motion.button>

                {/* TON Wallet */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-5 border-2 border-primary-gray-light rounded-2xl hover:border-accent-yellow transition-all group"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center group-hover:bg-primary-gray transition-colors border border-primary-gray-light">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#0088CC"/>
                        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">TON</text>
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-white text-base">TON Wallet</div>
                      <div className="text-sm text-primary-gray-lighter">Connect using TON wallet</div>
                    </div>
                  </div>
                  <TonConnectButtonWrapper 
                    onConnect={(address) => {
                      setTimeout(() => {
                        onClose();
                      }, 500);
                    }}
                  />
                </motion.div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-black border-t border-primary-gray-light">
              <p className="text-xs text-primary-gray-lighter text-center">
                Don't have a wallet?{' '}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-medium hover:underline"
                >
                  Install MetaMask
                </a>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
