'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { getUserTransactions, getTransactionsByType, type Transaction } from '@/lib/profile-utils';

interface TransactionsTabProps {
  account: string;
}

function TransactionsTab({ account }: TransactionsTabProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | Transaction['type']>('all');
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(() => {
    if (!account) {
      setLoading(false);
      return;
    }

    const allTransactions = getUserTransactions(account);
    const filtered = filter === 'all' 
      ? allTransactions 
      : getTransactionsByType(account, filter);
    
    setTransactions(filtered);
    setLoading(false);
  }, [account, filter]);

  useEffect(() => {
    loadTransactions();
    // Обновлять транзакции каждые 30 секунд для отображения новых (оптимизировано с 2 сек)
    const interval = setInterval(() => {
      loadTransactions();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadTransactions]);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getStatusColor = useCallback((status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getTypeLabel = useCallback((type: Transaction['type']) => {
    const labels: Record<Transaction['type'], string> = {
      token_purchase: 'Token Purchase',
      investment: 'Investment',
      withdrawal: 'Withdrawal',
      lottery_ticket: 'Lottery Ticket',
      btc_bet: 'BTC Bet',
    };
    return labels[type];
  }, []);

  const getTypeIcon = useCallback((type: Transaction['type']) => {
    switch (type) {
      case 'token_purchase':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'investment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'withdrawal':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'lottery_ticket':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'btc_bet':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  }, []);

  // Мемоизация отфильтрованных транзакций
  const filteredTransactions = useMemo(() => {
    return transactions;
  }, [transactions]);

  if (loading) {
    return (
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <p className="text-primary-gray-lighter">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <div className="flex flex-wrap gap-2">
          {(['all', 'token_purchase', 'investment', 'withdrawal', 'lottery_ticket', 'btc_bet'] as const).map((filterType) => {
            const labels: Record<string, string> = {
              all: 'All',
              token_purchase: 'Token Purchases',
              investment: 'Investments',
              withdrawal: 'Withdrawals',
              lottery_ticket: 'Lottery',
              btc_bet: 'BTC Bets',
            };
            return (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-accent-yellow hover:bg-gray-200'
                }`}
              >
                {labels[filterType]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-primary-gray rounded-xl shadow-sm border border-primary-gray-light">
        <div className="p-6 border-b border-primary-gray-light">
          <h2 className="text-xl font-bold text-white">
            Transaction History ({filteredTransactions.length})
          </h2>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-primary-gray-lighter mb-2">No transactions yet</p>
            <p className="text-sm text-gray-500">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction: Transaction) => (
              <div
                key={transaction.id}
                className="p-6 hover:bg-black transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Icon */}
                    <div className="w-10 h-10 bg-black border border-primary-gray-light rounded-lg flex items-center justify-center text-accent-yellow flex-shrink-0">
                      {getTypeIcon(transaction.type)}
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-base font-semibold text-white">
                          {getTypeLabel(transaction.type)}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-primary-gray-lighter mb-2">{transaction.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatDate(transaction.timestamp)}</span>
                        {transaction.paymentMethod && (
                          <span className="capitalize">• {transaction.paymentMethod}</span>
                        )}
                        {transaction.txHash && (
                          <a
                            href={`https://etherscan.io/tx/${transaction.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            View on Etherscan
                          </a>
                        )}
                        {transaction.stripeSessionId && (
                          <span className="text-gray-400">Stripe: {transaction.stripeSessionId.slice(0, 12)}...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right ml-4">
                    <div className={`text-lg font-bold ${
                      transaction.type === 'withdrawal' ? 'text-red-600' : 'text-white'
                    }`}>
                      {transaction.type === 'withdrawal' ? '-' : '+'}
                      {parseFloat(transaction.amount).toLocaleString('en-US', {
                        minimumFractionDigits: transaction.currency === 'EUR' ? 2 : 4,
                        maximumFractionDigits: transaction.currency === 'EUR' ? 2 : 4,
                      })} {transaction.currency}
                    </div>
                    {transaction.tokensAmount && (
                      <div className="text-sm text-gray-500 mt-1">
                        {parseFloat(transaction.tokensAmount).toFixed(2)} $TAI
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TransactionsTab);

