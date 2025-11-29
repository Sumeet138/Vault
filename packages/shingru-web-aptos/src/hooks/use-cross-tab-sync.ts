"use client";

import { useEffect, useRef, useCallback } from "react";

interface TabLockManager {
  acquireLock: (key: string, duration?: number) => boolean;
  releaseLock: (key: string) => void;
  hasLock: (key: string) => boolean;
}

/**
 * Cross-tab synchronization hook to prevent race conditions and coordinate state changes
 */
export function useCrossTabSync(): TabLockManager {
  const locksRef = useRef<Map<string, { timestamp: number; duration: number }>>(new Map());

  // Clean up expired locks
  const cleanupExpiredLocks = useCallback(() => {
    const now = Date.now();
    const locks = locksRef.current;

    for (const [key, lock] of locks.entries()) {
      if (now - lock.timestamp > lock.duration) {
        locks.delete(key);
        localStorage.removeItem(`shingru-lock-${key}`);
      }
    }
  }, []);

  // Check if we can acquire a lock (cross-tab coordination)
  const acquireLock = useCallback((key: string, duration = 5000): boolean => {
    cleanupExpiredLocks();

    const lockKey = `shingru-lock-${key}`;
    const now = Date.now();

    // Check if another tab has the lock
    const existingLock = localStorage.getItem(lockKey);
    if (existingLock) {
      try {
        const lockData = JSON.parse(existingLock);
        if (now - lockData.timestamp < lockData.duration) {
          return false; // Another tab has active lock
        }
      } catch {
        // Invalid lock data, proceed to acquire
      }
    }

    // Try to acquire the lock
    const lockData = { timestamp: now, duration, tabId: Math.random().toString(36) };
    localStorage.setItem(lockKey, JSON.stringify(lockData));

    // Small delay to check for race conditions
    setTimeout(() => {
      const currentLock = localStorage.getItem(lockKey);
      if (currentLock) {
        try {
          const currentLockData = JSON.parse(currentLock);
          if (currentLockData.tabId === lockData.tabId) {
            // We successfully acquired the lock
            locksRef.current.set(key, { timestamp: now, duration });
          }
        } catch {
          // Handle parsing error
        }
      }
    }, 10);

    return true;
  }, [cleanupExpiredLocks]);

  // Release a lock
  const releaseLock = useCallback((key: string) => {
    locksRef.current.delete(key);
    localStorage.removeItem(`shingru-lock-${key}`);
  }, []);

  // Check if we have a lock
  const hasLock = useCallback((key: string): boolean => {
    cleanupExpiredLocks();
    return locksRef.current.has(key);
  }, [cleanupExpiredLocks]);

  // Cleanup on unmount
  useEffect(() => {
    const currentLocks = locksRef.current;
    return () => {
      // Release all locks when component unmounts
      for (const key of currentLocks.keys()) {
        currentLocks.delete(key);
        localStorage.removeItem(`shingru-lock-${key}`);
      }
    };
  }, []);

  return {
    acquireLock,
    releaseLock,
    hasLock,
  };
}

/**
 * Broadcast state changes to other tabs
 */
export function broadcastStateChange(key: string, data: any) {
  const event = new CustomEvent('shingru-state-change', {
    detail: { key, data, timestamp: Date.now() }
  });

  // Use both storage event and custom event for reliability
  localStorage.setItem(`shingru-broadcast-${key}`, JSON.stringify({
    data,
    timestamp: Date.now(),
    id: Math.random().toString(36)
  }));

  window.dispatchEvent(event);
}

/**
 * Listen for state changes from other tabs
 */
export function useStateBroadcastListener(
  callback: (key: string, data: any) => void
) {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('shingru-broadcast-')) {
        const key = e.key.replace('shingru-broadcast-', '');
        if (e.newValue) {
          try {
            const { data } = JSON.parse(e.newValue);
            callback(key, data);
          } catch (error) {
            console.error('Error parsing broadcast data:', error);
          }
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      const { key, data } = e.detail;
      callback(key, data);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('shingru-state-change', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('shingru-state-change', handleCustomEvent as EventListener);
    };
  }, [callback]);
}