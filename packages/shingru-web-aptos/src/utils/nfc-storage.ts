/**
 * Utilities for managing NFC tag data in localStorage
 */

const NFC_TAG_KEY = "shingru-nfc-pending-claim";

export interface PendingNfcTag {
  tagId: string;
  timestamp: number;
}

/**
 * Store NFC tag ID in localStorage for claiming later
 */
export function storePendingNfcTag(tagId: string): void {
  try {
    const data: PendingNfcTag = {
      tagId,
      timestamp: Date.now(),
    };
    localStorage.setItem(NFC_TAG_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to store pending NFC tag:", error);
  }
}

/**
 * Get pending NFC tag from localStorage
 */
export function getPendingNfcTag(): PendingNfcTag | null {
  try {
    const stored = localStorage.getItem(NFC_TAG_KEY);
    if (!stored) return null;

    const data: PendingNfcTag = JSON.parse(stored);

    // Check if data is older than 24 hours
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > twentyFourHours) {
      clearPendingNfcTag();
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to get pending NFC tag:", error);
    return null;
  }
}

/**
 * Clear pending NFC tag from localStorage
 */
export function clearPendingNfcTag(): void {
  try {
    localStorage.removeItem(NFC_TAG_KEY);
  } catch (error) {
    console.error("Failed to clear pending NFC tag:", error);
  }
}

/**
 * Check if there's a pending NFC tag
 */
export function hasPendingNfcTag(): boolean {
  return getPendingNfcTag() !== null;
}
