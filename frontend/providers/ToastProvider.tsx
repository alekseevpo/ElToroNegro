'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastMessage } from '@/components/Toast';

interface ToastContextType {
  showToast: (message: ToastMessage) => void;
  showSuccess: (text: string, duration?: number) => void;
  showError: (text: string, duration?: number) => void;
  showInfo: (text: string, duration?: number) => void;
  showWarning: (text: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: ToastMessage) => {
    setToast(message);
  }, []);

  const showSuccess = useCallback((text: string, duration?: number) => {
    showToast({ type: 'success', text, duration });
  }, [showToast]);

  const showError = useCallback((text: string, duration?: number) => {
    showToast({ type: 'error', text, duration });
  }, [showToast]);

  const showInfo = useCallback((text: string, duration?: number) => {
    showToast({ type: 'info', text, duration });
  }, [showToast]);

  const showWarning = useCallback((text: string, duration?: number) => {
    showToast({ type: 'warning', text, duration });
  }, [showToast]);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <Toast message={toast} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

