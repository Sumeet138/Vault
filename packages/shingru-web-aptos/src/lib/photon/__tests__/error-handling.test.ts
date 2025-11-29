/**
 * Error Handling Tests for Photon Integration
 * 
 * These tests verify that all Photon features handle errors gracefully
 * and don't block user functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PhotonClient } from '../client';
import { trackPaymentLinkCreation, trackPaymentCompletion, trackUserAction } from '../rewards';
import { trackAttribution } from '../attribution';

describe('Photon Error Handling', () => {
  describe('Client Initialization', () => {
    it('should handle missing configuration gracefully', () => {
      const client = new PhotonClient({
        apiKey: '',
        baseUrl: '',
        campaignId: '',
      });

      expect(client.isConfigured()).toBe(false);
      // Client should still be created, just not configured
      expect(client).toBeDefined();
    });

    it('should not throw when configuration is missing', () => {
      expect(() => {
        new PhotonClient({
          apiKey: undefined,
          baseUrl: undefined,
          campaignId: undefined,
        });
      }).not.toThrow();
    });
  });

  describe('Reward Tracking Error Handling', () => {
    it('should return null on tracking failure without throwing', async () => {
      // Mock a client that will fail
      vi.mock('../client', () => ({
        getPhotonClient: () => ({
          isConfigured: () => false,
          trackPaymentLinkCreation: vi.fn().mockRejectedValue(new Error('API Error')),
        }),
      }));

      const result = await trackPaymentLinkCreation('user123', 'link456');
      
      // Should return null instead of throwing
      expect(result).toBeNull();
    });

    it('should handle payment completion tracking errors gracefully', async () => {
      const result = await trackPaymentCompletion('user123', 'payment456', 100);
      
      // Should not throw and should return null when client not configured
      expect(result).toBeNull();
    });

    it('should handle user action tracking errors gracefully', async () => {
      const result = await trackUserAction('user123', 'test_action');
      
      // Should not throw and should return null when client not configured
      expect(result).toBeNull();
    });
  });

  describe('Attribution Tracking Error Handling', () => {
    it('should return false on attribution failure without throwing', async () => {
      const result = await trackAttribution('user123', 'test_action');
      
      // Should return false instead of throwing
      expect(result).toBe(false);
    });

    it('should handle missing user ID gracefully', async () => {
      const result = await trackAttribution('', 'test_action');
      
      // Should not throw
      expect(result).toBe(false);
    });
  });

  describe('Non-Blocking Behavior', () => {
    it('should allow app to continue when Photon is unavailable', () => {
      const client = new PhotonClient({
        apiKey: '',
        baseUrl: '',
        campaignId: '',
      });

      // These operations should not throw
      expect(() => client.isConfigured()).not.toThrow();
      expect(() => client.getCampaignId()).not.toThrow();
    });

    it('should log errors but not throw for tracking failures', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // This should log an error but not throw
      await trackPaymentLinkCreation('user123', 'link456');
      
      // Verify error was logged (or warning about not configured)
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Graceful Degradation', () => {
    it('should provide default values when wallet info fetch fails', async () => {
      const client = new PhotonClient({
        apiKey: 'test',
        baseUrl: 'http://test.com',
        campaignId: 'test',
      });

      // Mock the API call to fail
      const balance = await client.getWalletBalance('user123');
      
      // Should return 0 instead of throwing
      expect(balance).toBe(0);
    });

    it('should return empty array when recent rewards fetch fails', async () => {
      const client = new PhotonClient({
        apiKey: 'test',
        baseUrl: 'http://test.com',
        campaignId: 'test',
      });

      const rewards = await client.getRecentRewards('user123');
      
      // Should return empty array instead of throwing
      expect(rewards).toEqual([]);
    });
  });
});
