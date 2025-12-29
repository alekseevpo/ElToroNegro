/**
 * React hook for fetching and managing user transactions via API
 */

import { useState, useEffect } from 'react';
import type { Transaction } from '@/lib/profile-utils';

interface UseTransactionsOptions {
  type?: Transaction['type'];
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<Transaction | null>;
  adding: boolean;
}

/**
 * Hook to fetch and manage user transactions
 * @param address - User's Ethereum address
 * @param options - Fetch options (type filter, pagination, etc.)
 */
export function useTransactions(
  address: string | null | undefined,
  options: UseTransactionsOptions = {}
): UseTransactionsReturn {
  const { type, limit = 100, offset = 0, autoFetch = true } = options;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchTransactions = async () => {
    if (!address) {
      setTransactions([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`/api/profile/${address}/transactions?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch transactions' }));
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (
    transaction: Omit<Transaction, 'id' | 'timestamp'>
  ): Promise<Transaction | null> => {
    if (!address) {
      setError('Address is required');
      return null;
    }

    setAdding(true);
    setError(null);

    try {
      const response = await fetch(`/api/profile/${address}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add transaction' }));
        throw new Error(errorData.error || 'Failed to add transaction');
      }

      const newTransaction = await response.json();
      
      // Add to local state
      setTransactions(prev => [newTransaction, ...prev]);
      setTotal(prev => prev + 1);
      setError(null);
      
      return newTransaction;
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      setError(err.message || 'Failed to add transaction');
      return null;
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, type, limit, offset, autoFetch]);

  return {
    transactions,
    total,
    loading,
    error,
    refetch: fetchTransactions,
    addTransaction,
    adding,
  };
}

