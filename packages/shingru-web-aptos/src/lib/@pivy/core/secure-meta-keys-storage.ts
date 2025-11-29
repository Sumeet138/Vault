// Secure storage utilities for meta keys
// Uses AES-256-GCM encryption with PBKDF2 key derivation from PIN

interface MetaKeySet {
  address: string;
  metaSpendPriv: string;
  metaSpendPub: string;
  metaViewPriv: string;
  metaViewPub: string;
}

interface AllMetaKeys {
  [chain: string]: MetaKeySet | undefined;
  APTOS?: MetaKeySet;
}

interface EncryptedData {
  encrypted: number[];
  iv: number[];
}

interface EncryptedPayload {
  encrypted: number[];
  iv: number[];
  salt: number[];
  timestamp: number;
}

interface SessionKeyData {
  key: number[];
  timestamp: number;
}

interface DerivedKeyResult {
  key: CryptoKey;
  salt: Uint8Array;
}

export class SecureMetaKeyStorage {
  // Generate a key from PIN using PBKDF2
  static async deriveKeyFromPin(
    pin: string,
    salt: Uint8Array | null = null
  ): Promise<DerivedKeyResult> {
    const pinBytes = new TextEncoder().encode(pin);
    const saltBytes = salt || crypto.getRandomValues(new Uint8Array(16));

    // Ensure we have proper ArrayBuffer types
    const pinBuffer = new Uint8Array(pinBytes).buffer;
    const saltBuffer = new Uint8Array(saltBytes).buffer;

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      pinBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true, // Make key extractable for session storage
      ["encrypt", "decrypt"]
    );

    return { key, salt: saltBytes };
  }

  // Encrypt data with AES-GCM
  static async encrypt(
    data: AllMetaKeys,
    key: CryptoKey
  ): Promise<EncryptedData> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    // Ensure we have proper ArrayBuffer type
    const dataBuffer = new Uint8Array(encodedData).buffer;

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      dataBuffer
    );

    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
    };
  }

  // Decrypt data with AES-GCM
  static async decrypt(
    encryptedData: number[],
    key: CryptoKey,
    iv: number[]
  ): Promise<AllMetaKeys> {
    // Ensure we have proper ArrayBuffer types
    const ivBuffer = new Uint8Array(iv).buffer;
    const dataBuffer = new Uint8Array(encryptedData).buffer;

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      key,
      dataBuffer
    );

    const decryptedString = new TextDecoder().decode(decrypted);
    return JSON.parse(decryptedString);
  }

  // Store encrypted meta keys
  static async storeEncryptedMetaKeys(
    pin: string,
    metaKeys: AllMetaKeys
  ): Promise<boolean> {
    try {
      const { key, salt } = await this.deriveKeyFromPin(pin);
      const { encrypted, iv } = await this.encrypt(metaKeys, key);

      const encryptedPayload: EncryptedPayload = {
        encrypted,
        iv,
        salt: Array.from(salt),
        timestamp: Date.now(),
      };

      localStorage.setItem(
        "shingru-encrypted-meta-keys",
        JSON.stringify(encryptedPayload)
      );

      // Store decryption key in localStorage for UX (persists across tab close/reopen for 24h)
      const keyBuffer = await crypto.subtle.exportKey("raw", key);
      const sessionData = {
        key: Array.from(new Uint8Array(keyBuffer)),
        timestamp: Date.now(),
      };
      localStorage.setItem("shingru-session-key", JSON.stringify(sessionData));
      console.log(
        "💾 Session key saved to localStorage after storing meta keys:",
        { timestamp: sessionData.timestamp }
      );

      return true;
    } catch (error) {
      console.error("Failed to store encrypted meta keys:", error);
      return false;
    }
  }

  // Retrieve and decrypt meta keys using PIN
  static async retrieveMetaKeysWithPin(
    pin: string
  ): Promise<AllMetaKeys | null> {
    try {
      const encryptedPayload = localStorage.getItem("shingru-encrypted-meta-keys");
      if (!encryptedPayload) return null;

      const { encrypted, iv, salt }: EncryptedPayload =
        JSON.parse(encryptedPayload);
      const { key } = await this.deriveKeyFromPin(pin, new Uint8Array(salt));

      const decryptedData = await this.decrypt(encrypted, key, iv);

      // Update session key for future use - store in localStorage for persistence across tab close/reopen
      const keyBuffer = await crypto.subtle.exportKey("raw", key);
      const sessionData = {
        key: Array.from(new Uint8Array(keyBuffer)),
        timestamp: Date.now(),
      };
      localStorage.setItem("shingru-session-key", JSON.stringify(sessionData));
      console.log("💾 Session key saved to localStorage:", {
        timestamp: sessionData.timestamp,
      });

      return decryptedData;
    } catch (error) {
      console.error("Failed to decrypt meta keys with PIN:", error);
      return null;
    }
  }

  // Retrieve meta keys using session key (for UX without re-entering PIN)
  static async retrieveMetaKeysWithSession(): Promise<AllMetaKeys | null> {
    try {
      const sessionKeyData = localStorage.getItem("shingru-session-key");
      const encryptedPayload = localStorage.getItem("shingru-encrypted-meta-keys");

      if (!sessionKeyData || !encryptedPayload) return null;

      const { key: keyArray, timestamp }: SessionKeyData =
        JSON.parse(sessionKeyData);
      const { encrypted, iv }: EncryptedPayload = JSON.parse(encryptedPayload);

      // Check if session key is not too old (24 hours)
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem("shingru-session-key");
        return null;
      }

      const key = await crypto.subtle.importKey(
        "raw",
        new Uint8Array(keyArray),
        { name: "AES-GCM" },
        false, // Session keys don't need to be extractable
        ["decrypt"]
      );

      const decryptedData = await this.decrypt(encrypted, key, iv);
      return decryptedData;
    } catch (error) {
      console.error("Failed to decrypt meta keys with session:", error);
      localStorage.removeItem("shingru-session-key");
      return null;
    }
  }

  // Check if encrypted meta keys exist
  static hasEncryptedMetaKeys(): boolean {
    return !!localStorage.getItem("shingru-encrypted-meta-keys");
  }

  // Check if a valid session key exists (not expired)
  static hasValidSession(): boolean {
    try {
      const sessionKeyData = localStorage.getItem("shingru-session-key");
      console.log("🔍 Checking session key:", { hasData: !!sessionKeyData });

      if (!sessionKeyData) return false;

      const { timestamp }: SessionKeyData = JSON.parse(sessionKeyData);
      const ageInHours = (Date.now() - timestamp) / (60 * 60 * 1000);

      console.log("🔍 Session age:", {
        ageInHours,
        timestamp,
        now: Date.now(),
      });

      // Check if session key is not too old (24 hours)
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        console.log("🔍 Session expired, removing");
        localStorage.removeItem("shingru-session-key");
        return false;
      }

      console.log("🔍 Session is valid");
      return true;
    } catch (error) {
      console.error("🔍 Session check error:", error);
      localStorage.removeItem("shingru-session-key");
      return false;
    }
  }

  // Clear all meta key data
  static clearMetaKeys(): void {
    localStorage.removeItem("shingru-encrypted-meta-keys");
    localStorage.removeItem("shingru-session-key");
  }
}
