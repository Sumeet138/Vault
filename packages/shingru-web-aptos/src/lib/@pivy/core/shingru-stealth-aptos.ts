/**
 * SHINGRU Stealth Address Helpers (APTOS)
 * ------------------------------------
 * secp256k1-based stealth address utilities for APTOS.
 *
 * Based on packages/shingru-stealth-program-aptos/scripts/pivyStealthIota.js
 *
 * Dependencies:
 * @noble/secp256k1, @noble/hashes, @aptos/aptos-sdk, bs58
 */

import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { blake2b as blake2bHash } from "@noble/hashes/blake2b";
import { hkdf } from "@noble/hashes/hkdf";
import { randomBytes } from "@noble/hashes/utils";
import { chacha20poly1305 } from "@noble/ciphers/chacha.js";
import { Secp256k1Keypair } from "@aptos/aptos-sdk/keypairs/secp256k1";
import { decodeIotaPrivateKey } from "@aptos/aptos-sdk/cryptography";
import bs58 from "bs58";
import { Buffer } from "buffer";

// ────────────────────────────────────────────────────────────────
// Deterministic Key Derivation Constants
// ────────────────────────────────────────────────────────────────
const SPEND_CONTEXT = "SHINGRU Spend Authority | Deterministic Derivation";
const VIEW_CONTEXT = "SHINGRU View Authority | Deterministic Derivation";
const IOTA_DOMAIN = "SHINGRU | Deterministic Meta Keys | APTOS Network";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────
export interface MetaKeys {
  metaSpend: { privateKey: Uint8Array; publicKey: Uint8Array };
  metaView: { privateKey: Uint8Array; publicKey: Uint8Array };
  metaSpendPubB58: string;
  metaViewPubB58: string;
  seed?: string;
}

export interface EphemeralKey {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  publicKeyB58: string;
  publicKeyBytes: Uint8Array;
}

export interface StealthAddress {
  stealthIotaAddress: string;
  stealthPublicKey: Uint8Array;
}

export class PivyStealthIota {
  private CURVE_N: bigint;

  constructor() {
    this.CURVE_N = secp.CURVE.n;
  }

  // ────────────────────────────────────────────────────────────────
  // Encoding / utils
  // ────────────────────────────────────────────────────────────────
  toBytes(input: string | Uint8Array | ArrayBuffer): Uint8Array {
    if (typeof input === "string") {
      try {
        return bs58.decode(input);
      } catch {
        const hex = input.startsWith("0x") ? input.slice(2) : input;
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
        }
        return bytes;
      }
    }
    return new Uint8Array(input);
  }

  scalarToBytes(scalar: bigint): Uint8Array {
    const hex = scalar.toString(16).padStart(64, "0");
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  pad32(data: Uint8Array): Uint8Array {
    const padded = new Uint8Array(32);
    padded.set(data.slice(0, Math.min(32, data.length)));
    return padded;
  }

  /**
   * Converts secp256k1 public key to APTOS address.
   * @param publicKey33bytes - Compressed public key (33 bytes)
   * @returns APTOS address (hex string)
   */
  secp256k1PointToIotaAddress(publicKey33bytes: Uint8Array): string {
    const FLAG_SECP256K1 = 0x01;
    const addressBytes = new Uint8Array(34);
    addressBytes[0] = FLAG_SECP256K1;
    addressBytes.set(publicKey33bytes, 1);
    const hash = blake2bHash(addressBytes, { dkLen: 32 });
    return "0x" + Buffer.from(hash).toString("hex");
  }

  /**
   * Generates receiver's meta keys using APTOS SDK.
   * Spend key derives stealth addresses, view key enables scanning/decryption.
   * @returns Meta keys with keypairs and base58 public keys
   */
  generateMetaKeys(): MetaKeys {
    const metaSpend = new Secp256k1Keypair();
    const metaView = new Secp256k1Keypair();

    const metaSpendPubB58 = bs58.encode(
      metaSpend.getPublicKey().toRawBytes()
    );
    const metaViewPubB58 = bs58.encode(metaView.getPublicKey().toRawBytes());

    const metaSpendPriv = decodeIotaPrivateKey(
      metaSpend.getSecretKey()
    ).secretKey;
    const metaViewPriv = decodeIotaPrivateKey(
      metaView.getSecretKey()
    ).secretKey;

    return {
      metaSpend: {
        privateKey: metaSpendPriv,
        publicKey: metaSpend.getPublicKey().toRawBytes(),
      },
      metaView: {
        privateKey: metaViewPriv,
        publicKey: metaView.getPublicKey().toRawBytes(),
      },
      metaSpendPubB58,
      metaViewPubB58,
    };
  }

  /**
   * Generate deterministic meta keys from a seed (e.g., wallet signature)
   * Same seed will ALWAYS produce the same keys
   * Uses domain separation and context-specific derivation for security
   *
   * @param seed - Seed string (signature from main wallet)
   * @returns Meta keys with spend and view keypairs
   */
  generateDeterministicMetaKeys(seed: string): MetaKeys {
    const seedBytes = new TextEncoder().encode(seed);
    // Use domain separator as salt for additional security
    const domainSalt = new TextEncoder().encode(IOTA_DOMAIN);

    // Derive two independent 32-byte keys using HKDF with specific contexts
    // HKDF(hash, ikm, salt, info, length)
    const metaSpendPriv = hkdf(
      sha256,
      seedBytes,
      domainSalt,
      SPEND_CONTEXT,
      32
    );
    const metaViewPriv = hkdf(
      sha256,
      seedBytes,
      domainSalt,
      VIEW_CONTEXT,
      32
    );

    // Ensure keys are valid secp256k1 private keys (< curve order)
    const spendScalar = secp.utils.mod(
      BigInt("0x" + Buffer.from(metaSpendPriv).toString("hex")),
      this.CURVE_N
    );
    const viewScalar = secp.utils.mod(
      BigInt("0x" + Buffer.from(metaViewPriv).toString("hex")),
      this.CURVE_N
    );

    const spendPrivFinal = this.scalarToBytes(spendScalar);
    const viewPrivFinal = this.scalarToBytes(viewScalar);

    const spendPub = secp.getPublicKey(spendPrivFinal, true);
    const viewPub = secp.getPublicKey(viewPrivFinal, true);

    return {
      metaSpend: { privateKey: spendPrivFinal, publicKey: spendPub },
      metaView: { privateKey: viewPrivFinal, publicKey: viewPub },
      metaSpendPubB58: bs58.encode(spendPub),
      metaViewPubB58: bs58.encode(viewPub),
      seed,
    };
  }

  /**
   * Generate ephemeral keypair for one-time payment
   * @returns Ephemeral keypair with private key, public key, and base58 public key
   */
  generateEphemeralKey(): EphemeralKey {
    const ephemeral = new Secp256k1Keypair();
    const privateKey = decodeIotaPrivateKey(ephemeral.getSecretKey()).secretKey;
    const publicKeyBytes = ephemeral.getPublicKey().toRawBytes();
    const publicKeyB58 = bs58.encode(publicKeyBytes);

    return {
      privateKey,
      publicKey: publicKeyBytes,
      publicKeyB58,
      publicKeyBytes,
    };
  }

  /**
   * Derive stealth public key and address for payment
   * @param metaSpendPubB58 - Receiver's meta spend public key (base58)
   * @param metaViewPubB58 - Receiver's meta view public key (base58)
   * @param ephemeralPriv - Sender's ephemeral private key
   * @returns Stealth address and public key
   */
  async deriveStealthPub(
    metaSpendPubB58: string,
    metaViewPubB58: string,
    ephemeralPriv: Uint8Array
  ): Promise<StealthAddress> {
    const ephPrivBytes = this.toBytes(ephemeralPriv);
    const metaViewPubBytes = this.toBytes(metaViewPubB58);
    const metaSpendPubBytes = this.toBytes(metaSpendPubB58);

    // 1. ECDH with ephemeral priv and meta view pub
    const shared = secp.getSharedSecret(ephPrivBytes, metaViewPubBytes, true);

    // 2. Hash to get tweak (skip the 0x02/0x03 prefix byte)
    const tweak = sha256(shared.slice(1));
    const tweakScalar = secp.utils.mod(
      BigInt("0x" + Buffer.from(tweak).toString("hex")),
      this.CURVE_N
    );

    // 3. Point addition: stealthPub = metaSpendPub + (tweak × G)
    const tweakPoint = secp.Point.BASE.multiply(tweakScalar);
    const metaSpendPoint = secp.Point.fromHex(metaSpendPubBytes);
    const stealthPoint = metaSpendPoint.add(tweakPoint);

    const stealthPublicKey = stealthPoint.toRawBytes(true);
    const stealthIotaAddress = this.secp256k1PointToIotaAddress(stealthPublicKey);

    return {
      stealthIotaAddress,
      stealthPublicKey,
    };
  }

  /**
   * Encrypt ephemeral private key for receiver to scan
   * Uses ChaCha20-Poly1305 for authenticated encryption
   * @param ephemeralPriv - Sender's ephemeral private key
   * @param metaViewPubB58 - Receiver's meta view public key (base58)
   * @returns Encrypted ephemeral private key (base58)
   */
  async encryptEphemeralPrivKey(
    ephemeralPriv: Uint8Array,
    metaViewPubB58: string
  ): Promise<string> {
    const ephPrivBytes = this.toBytes(ephemeralPriv);
    const metaViewPubBytes = this.toBytes(metaViewPubB58);

    // Derive ephemeral public key
    const ephPubBytes = secp.getPublicKey(ephPrivBytes, true); // 33 bytes compressed

    // ECDH: ephemeral private × meta view public
    const shared = secp.getSharedSecret(ephPrivBytes, metaViewPubBytes, true);

    // Key derivation with ephemeral public key as salt
    const salt = sha256(ephPubBytes);
    const key = hkdf(sha256, shared.slice(1), salt, "ephemeral-key-encryption", 32);

    const nonce = randomBytes(12);
    const cipher = chacha20poly1305(key, nonce);

    // Encrypt: ephemeral private key (32 bytes) + ephemeral public key (33 bytes) for integrity
    const plaintext = new Uint8Array(65);
    plaintext.set(ephPrivBytes, 0);
    plaintext.set(ephPubBytes, 32);

    const ciphertext = cipher.encrypt(plaintext);

    // Return: nonce + ciphertext + auth_tag (as base58)
    const result = new Uint8Array(nonce.length + ciphertext.length);
    result.set(nonce, 0);
    result.set(ciphertext, nonce.length);

    return bs58.encode(result);
  }

  /**
   * Encrypt note/label for receiver
   * Uses ChaCha20-Poly1305 for authenticated encryption
   * @param message - Message to encrypt (string)
   * @param ephemeralPriv - Sender's ephemeral private key
   * @param metaViewPubB58 - Receiver's meta view public key (base58)
   * @returns Encrypted message bytes
   */
  async encryptNote(
    message: string,
    ephemeralPriv: Uint8Array,
    metaViewPubB58: string
  ): Promise<Uint8Array> {
    const ephPrivBytes = this.toBytes(ephemeralPriv);
    const metaViewPubBytes = this.toBytes(metaViewPubB58);

    // Derive ephemeral public key
    const ephPubBytes = secp.getPublicKey(ephPrivBytes, true); // 33 bytes compressed

    // ECDH: ephemeral private × meta view public
    const shared = secp.getSharedSecret(ephPrivBytes, metaViewPubBytes, true);

    // Key derivation with ephemeral public key as salt
    const salt = sha256(ephPubBytes);
    const key = hkdf(sha256, shared.slice(1), salt, "memo-encryption", 32);

    const nonce = randomBytes(12);
    const cipher = chacha20poly1305(key, nonce);

    const plaintextBytes = new TextEncoder().encode(message);
    const ciphertext = cipher.encrypt(plaintextBytes);

    // Return: nonce + ciphertext + auth_tag
    const result = new Uint8Array(nonce.length + ciphertext.length);
    result.set(nonce, 0);
    result.set(ciphertext, nonce.length);
    return result;
  }

  /**
   * Decrypt note/label for receiver
   * Uses ChaCha20-Poly1305 for authenticated decryption
   * @param encryptedBytes - Encrypted message bytes
   * @param ephemeralPubB58 - Sender's ephemeral public key (base58)
   * @param metaViewPriv - Receiver's meta view private key
   * @returns Decrypted message string
   */
  async decryptNote(
    encryptedBytes: Uint8Array,
    ephemeralPubB58: string,
    metaViewPriv: Uint8Array
  ): Promise<string> {
    const metaViewPrivBytes = this.toBytes(metaViewPriv);
    const ephemeralPubBytes = this.toBytes(ephemeralPubB58);

    // Extract nonce and ciphertext
    const nonce = encryptedBytes.slice(0, 12);
    const ciphertext = encryptedBytes.slice(12);

    // ECDH: meta view private × ephemeral public (SAME as encryption)
    const shared = secp.getSharedSecret(metaViewPrivBytes, ephemeralPubBytes, true);

    // Key derivation with ephemeral public key as salt (SAME as encryption)
    const salt = sha256(ephemeralPubBytes);
    const key = hkdf(sha256, shared.slice(1), salt, "memo-encryption", 32);

    try {
      const cipher = chacha20poly1305(key, nonce);
      const plaintextBytes = cipher.decrypt(ciphertext);

      return new TextDecoder().decode(plaintextBytes);
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Scan for incoming payments by checking if we can derive the stealth private key
   * @param stealthAddress - The stealth address to check
   * @param ephemeralPubB58 - Ephemeral public key from the payment
   * @param metaSpendPriv - Receiver's meta spend private key
   * @param metaViewPriv - Receiver's meta view private key
   * @returns True if this payment belongs to us, false otherwise
   */
  async scanPayment(
    stealthAddress: string,
    ephemeralPubB58: string,
    metaSpendPriv: Uint8Array,
    metaViewPriv: Uint8Array
  ): Promise<boolean> {
    try {
      const metaViewPrivBytes = this.toBytes(metaViewPriv);
      const ephemeralPubBytes = this.toBytes(ephemeralPubB58);

      // Compute shared secret using ECDH: metaViewPriv * ephemeralPub
      const shared = secp.getSharedSecret(metaViewPrivBytes, ephemeralPubBytes, true);

      // Hash to derive scalar (skip prefix byte)
      const tweak = sha256(shared.slice(1));
      const tweakScalar = secp.utils.mod(
        BigInt("0x" + Buffer.from(tweak).toString("hex")),
        this.CURVE_N
      );

      // Derive stealth private key: stealthPriv = metaSpendPriv + tweak
      const metaSpendScalar = BigInt("0x" + Buffer.from(metaSpendPriv).toString("hex"));
      const stealthPrivScalar = secp.utils.mod(metaSpendScalar + tweakScalar, this.CURVE_N);
      const stealthPriv = this.scalarToBytes(stealthPrivScalar);

      // Derive public key from private key
      const derivedStealthPub = secp.getPublicKey(stealthPriv, true);

      // Convert to APTOS address
      const derivedAddress = this.secp256k1PointToIotaAddress(derivedStealthPub);

      // Check if it matches the stealth address
      return derivedAddress === stealthAddress;
    } catch (error) {
      console.error("Error scanning payment:", error);
      return false;
    }
  }

  /**
   * Derive stealth private key for spending received funds
   * @param ephemeralPubB58 - Ephemeral public key from the payment
   * @param metaSpendPriv - Receiver's meta spend private key
   * @param metaViewPriv - Receiver's meta view private key
   * @returns Stealth private key for spending
   */
  async deriveStealthPriv(
    ephemeralPubB58: string,
    metaSpendPriv: Uint8Array,
    metaViewPriv: Uint8Array
  ): Promise<Uint8Array> {
    const metaViewPrivBytes = this.toBytes(metaViewPriv);
    const ephemeralPubBytes = this.toBytes(ephemeralPubB58);

    // Compute shared secret using ECDH: metaViewPriv * ephemeralPub
    const shared = secp.getSharedSecret(metaViewPrivBytes, ephemeralPubBytes, true);

    // Hash to derive scalar (skip prefix byte)
    const tweak = sha256(shared.slice(1));
    const tweakScalar = secp.utils.mod(
      BigInt("0x" + Buffer.from(tweak).toString("hex")),
      this.CURVE_N
    );

    // Derive stealth private key: stealthPriv = metaSpendPriv + tweak
    const metaSpendScalar = BigInt("0x" + Buffer.from(metaSpendPriv).toString("hex"));
    const stealthPrivScalar = secp.utils.mod(metaSpendScalar + tweakScalar, this.CURVE_N);

    return this.scalarToBytes(stealthPrivScalar);
  }

  /**
   * Derive stealth keypair for spending received funds
   * @param metaSpendPriv - Receiver's meta spend private key
   * @param metaViewPriv - Receiver's meta view private key
   * @param ephemeralPubB58 - Ephemeral public key from the payment
   * @returns Stealth keypair and address
   */
  async deriveStealthKeypair(
    metaSpendPriv: Uint8Array,
    metaViewPriv: Uint8Array,
    ephemeralPubB58: string
  ): Promise<{
    stealthKeypair: Secp256k1Keypair;
    stealthAddress: string;
    privateKey: string;
    publicKeyBase58: () => string;
  }> {
    const metaSpendPrivBytes = this.toBytes(metaSpendPriv);
    const metaViewPrivBytes = this.toBytes(metaViewPriv);
    const ephemeralPubBytes = this.toBytes(ephemeralPubB58);

    // ECDH with meta view priv and ephemeral pub (same shared secret as payer)
    const shared = secp.getSharedSecret(metaViewPrivBytes, ephemeralPubBytes, true);

    // Same tweak as payer
    const tweak = sha256(shared.slice(1));
    const tweakScalar = secp.utils.mod(
      BigInt("0x" + Buffer.from(tweak).toString("hex")),
      this.CURVE_N
    );

    const metaSpendScalar = secp.utils.mod(
      BigInt("0x" + Buffer.from(metaSpendPrivBytes).toString("hex")),
      this.CURVE_N
    );

    // Scalar addition: stealthPriv = metaSpendPriv + tweak
    const stealthPrivScalar = secp.utils.mod(
      metaSpendScalar + tweakScalar,
      this.CURVE_N
    );

    const stealthPrivBytes = this.scalarToBytes(stealthPrivScalar);
    const stealthPubKeyBytes = secp.getPublicKey(stealthPrivBytes, true);
    const stealthAddress = this.secp256k1PointToIotaAddress(stealthPubKeyBytes);

    // Import the encoding function
    const { encodeIotaPrivateKey } = await import("@aptos/aptos-sdk/cryptography");

    const encodedPrivKey = encodeIotaPrivateKey(stealthPrivBytes, "Secp256k1");
    const stealthKeypair = Secp256k1Keypair.fromSecretKey(encodedPrivKey);

    return {
      stealthKeypair,
      stealthAddress,
      privateKey: encodedPrivKey,
      publicKeyBase58: () => bs58.encode(stealthPubKeyBytes),
    };
  }
}

export default PivyStealthIota;
