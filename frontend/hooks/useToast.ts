'use client';

import { useState, useCallback } from 'react';
import { ToastMessage } from '@/components/Toast';

export function useToast() {
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

  return {
    toast,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideToast,
  };
}

