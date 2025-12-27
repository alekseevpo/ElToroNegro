'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getInvestmentPoolContract, getSigner } from '@/lib/contracts';

interface PoolStats {
  totalInvested: string;
  totalWithdrawn: string;
  totalActiveInvestments: number;
  currentBalance: string;
  interestRate: number;
  platformFeePercent: number;
}

interface UserInvestment {
  amount: string;
  depositTime: number;
  withdrawTime: number;
  withdrawn: boolean;
  estimatedReturn: string;
}

interface UserStats {
  totalCount: number;
  activeCount: number;
  totalInvestedAmount: string;
  totalAvailableToWithdraw: string;
}

export const useInvestmentPool = (contractAddress?: string) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [minInvestment, setMinInvestment] = useState<string>('0');
  const [investmentPeriod, setInvestmentPeriod] = useState<number>(0);

  useEffect(() => {
    const initContract = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Установить значения по умолчанию сразу
        setMinInvestment('0.004');
        setInvestmentPeriod(7 * 24 * 60 * 60);
        
        const poolContract = await getInvestmentPoolContract(contractAddress);
        
        if (!poolContract) {
          // Контракт не развернут или адрес не указан - это нормально
          console.debug('InvestmentPool contract not available (not deployed yet)');
          return;
        }

        setContract(poolContract);

        try {
          // Загрузить начальные данные
          const min = await poolContract.MIN_INVESTMENT();
          setMinInvestment(ethers.formatEther(min));

          const period = await poolContract.INVESTMENT_PERIOD();
          setInvestmentPeriod(Number(period));

          await loadPoolStats(poolContract);
        } catch (err: any) {
          console.warn('Contract methods not available or contract not deployed:', err.message);
          // Значения по умолчанию уже установлены выше
        }
      } catch (err: any) {
        console.warn('Error initializing contract:', err.message);
        // Не устанавливаем error для случая, когда контракт просто не развернут
      } finally {
        setLoading(false);
      }
    };

    initContract();
  }, [contractAddress]);

  const loadPoolStats = useCallback(async (poolContract: ethers.Contract) => {
    try {
      const stats = await poolContract.getPoolStats();
      setPoolStats({
        totalInvested: ethers.formatEther(stats._totalInvested),
        totalWithdrawn: ethers.formatEther(stats._totalWithdrawn),
        totalActiveInvestments: Number(stats._totalActiveInvestments),
        currentBalance: ethers.formatEther(stats._currentBalance),
        interestRate: Number(stats._interestRate) / 100, // Конвертируем basis points в проценты
        platformFeePercent: Number(stats._platformFeePercent) / 100,
      });
    } catch (err: any) {
      console.error('Error loading pool stats:', err);
    }
  }, []);

  const invest = useCallback(async (amount: string) => {
    if (!contract) {
      throw new Error('Contract not loaded');
    }

    try {
      setLoading(true);
      const tx = await contract.invest({
        value: ethers.parseEther(amount),
      });
      await tx.wait();

      // Обновить статистику после инвестиции
      await loadPoolStats(contract);

      return tx;
    } catch (err: any) {
      setError(err.message || 'Investment failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract, loadPoolStats]);

  const withdraw = useCallback(async (investmentIndex: number) => {
    if (!contract) {
      throw new Error('Contract not loaded');
    }

    try {
      setLoading(true);
      const tx = await contract.withdraw(investmentIndex);
      await tx.wait();

      // Обновить статистику после вывода
      await loadPoolStats(contract);

      return tx;
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract, loadPoolStats]);

  const withdrawAll = useCallback(async () => {
    if (!contract) {
      throw new Error('Contract not loaded');
    }

    try {
      setLoading(true);
      const tx = await contract.withdrawAll();
      await tx.wait();

      // Обновить статистику после вывода
      await loadPoolStats(contract);

      return tx;
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract, loadPoolStats]);

  const getUserInvestments = useCallback(async (userAddress: string): Promise<UserInvestment[]> => {
    if (!contract) {
      return [];
    }

    try {
      const userStats = await contract.getUserInvestments(userAddress);
      const totalCount = Number(userStats.totalCount);
      const investments: UserInvestment[] = [];

      for (let i = 0; i < totalCount; i++) {
        const investment = await contract.getInvestment(userAddress, i);
        investments.push({
          amount: ethers.formatEther(investment.amount),
          depositTime: Number(investment.depositTime),
          withdrawTime: Number(investment.withdrawTime),
          withdrawn: investment.withdrawn,
          estimatedReturn: ethers.formatEther(investment.estimatedReturn),
        });
      }

      return investments;
    } catch (err: any) {
      console.error('Error getting user investments:', err);
      return [];
    }
  }, [contract]);

  const getUserStats = useCallback(async (userAddress: string): Promise<UserStats | null> => {
    if (!contract) {
      return null;
    }

    try {
      const stats = await contract.getUserInvestments(userAddress);
      return {
        totalCount: Number(stats.totalCount),
        activeCount: Number(stats.activeCount),
        totalInvestedAmount: ethers.formatEther(stats.totalInvestedAmount),
        totalAvailableToWithdraw: ethers.formatEther(stats.totalAvailableToWithdraw),
      };
    } catch (err: any) {
      console.error('Error getting user stats:', err);
      return null;
    }
  }, [contract]);

  const refreshStats = useCallback(async () => {
    if (contract) {
      await loadPoolStats(contract);
    }
  }, [contract, loadPoolStats]);

  return {
    contract,
    loading,
    error,
    poolStats,
    minInvestment,
    investmentPeriod,
    invest,
    withdraw,
    withdrawAll,
    getUserInvestments,
    getUserStats,
    refreshStats,
  };
};

