/**
 * Hook for managing user balances
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserBalances, getUserBalance, getBalanceTransactions } from '@/lib/supabase/balances';
import type { UserBalance, BalanceTransaction } from '@/lib/supabase/balances';

export function useUserBalance(userId: string | null, tokenAddress?: string) {
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!userId) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (tokenAddress) {
        const data = await getUserBalance(userId, tokenAddress);
        setBalance(data);
      } else {
        // Get first balance if no token specified
        const balances = await getUserBalances(userId);
        setBalance(balances[0] || null);
      }
    } catch (err: any) {
      console.error('Error fetching balance:', err);
      setError(err.message || 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [userId, tokenAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
  };
}

export function useUserBalances(userId: string | null) {
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!userId) {
      setBalances([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getUserBalances(userId);
      setBalances(data);
    } catch (err: any) {
      console.error('Error fetching balances:', err);
      setError(err.message || 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Calculate total balance in USD (if price data available)
  const totalBalanceUsd = balances.reduce((total, balance) => {
    // You can add price fetching logic here
    return total;
  }, 0);

  return {
    balances,
    totalBalanceUsd,
    loading,
    error,
    refetch: fetchBalances,
  };
}

export function useBalanceTransactions(userId: string | null, limit: number = 50) {
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getBalanceTransactions(userId, limit);
      setTransactions(data);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}
