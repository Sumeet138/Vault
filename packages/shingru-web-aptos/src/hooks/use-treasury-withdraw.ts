/**
 * Hook for treasury-based withdrawals
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';

export interface TreasuryWithdrawParams {
  destinationAddress: string;
  amount: string; // Amount in smallest unit (octas)
  tokenAddress: string;
  tokenSymbol: string;
}

export function useTreasuryWithdraw() {
  const { me } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const withdraw = useCallback(async (params: TreasuryWithdrawParams) => {
    if (!me?.id) {
      setError('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: me.id,
          ...params,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Withdrawal failed');
      }

      setTxHash(result.txHash);
      return { success: true, txHash: result.txHash };
    } catch (err: any) {
      const errorMessage = err.message || 'Withdrawal failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [me]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setTxHash(null);
  }, []);

  return {
    withdraw,
    loading,
    error,
    txHash,
    reset,
  };
}
