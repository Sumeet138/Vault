// shingru stealth addresses for aptos
// handles all the crypto for stealth payments

import * as secp from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { sha3_256 } from '@noble/hashes/sha3';
import { hkdf } from '@noble/hashes/hkdf';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/hashes/utils';
import bs58 from 'bs58';

/**
 * Stealth address implementation for Aptos using secp256k1.
 * Enables private payments through ephemeral addresses.
 */
export default class ShingruStealthAptos {
    constructor() {
        this.CURVE_N = secp.CURVE.n;
    }

    /**
     * Converts input to bytes (hex, base58, or raw).
     * @param {string|Uint8Array|ArrayBuffer} input - Input data
     * @returns {Uint8Array} Byte array
     */
    toBytes(input) {
        if (typeof input === 'string') {
            try {
                const decoded = bs58.decode(input);
                return decoded;
            } catch {
                const hex = input.startsWith('0x') ? input.slice(2) : input;
                const bytes = new Uint8Array(hex.length / 2);
                for (let i = 0; i < hex.length; i += 2) {
                    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
                }
                return bytes;
            }
        }
        return new Uint8Array(input);
    }

    /**
     * Converts bigint scalar to 32-byte array.
     * @param {bigint} scalar - Scalar value
     * @returns {Uint8Array} 32-byte array
     */
    scalarToBytes(scalar) {
        const hex = scalar.toString(16).padStart(64, '0');
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        }
        return bytes;
    }

    /**
     * Pads data to 32 bytes.
     * @param {Uint8Array} data - Input data
     * @returns {Uint8Array} 32-byte padded array
     */
    pad32(data) {
        const padded = new Uint8Array(32);
        padded.set(data.slice(0, Math.min(32, data.length)));
        return padded;
    }

    /**
     * Converts secp256k1 public key to Aptos address.
     * @param {Uint8Array} publicKey33bytes - Compressed public key (33 bytes)
     * @returns {string} Aptos address (hex string)
     */
    secp256k1PointToAptosAddress(publicKey33bytes) {
        // Aptos uses SHA3-256 for address derivation from public keys
        // For secp256k1, we need to convert to a format Aptos can use
        // Since Aptos primarily uses Ed25519, we'll use a deterministic mapping
        
        // Create a deterministic address from the public key
        // Using SHA3-256 hash of the public key
        const hash = sha3_256(publicKey33bytes);
        
        // Aptos addresses are 32 bytes, so we use the hash directly
        return '0x' + Buffer.from(hash).toString('hex');
    }

    /**
     * Generates receiver's meta keys.
     * Spend key derives stealth addresses, view key enables scanning/decryption.
     * @returns {{metaSpend: {privateKey: Uint8Array, publicKey: Uint8Array}, metaView: {privateKey: Uint8Array, publicKey: Uint8Array}, metaSpendPubB58: string, metaViewPubB58: string}} Meta keys
     */
    generateMetaKeys() {
        const metaSpendPriv = secp.utils.randomPrivateKey();
        const metaSpendPub = secp.getPublicKey(metaSpendPriv, true);
        
        const metaViewPriv = secp.utils.randomPrivateKey();
        const metaViewPub = secp.getPublicKey(metaViewPriv, true);

        return {
            metaSpend: { privateKey: metaSpendPriv, publicKey: metaSpendPub },
            metaView: { privateKey: metaViewPriv, publicKey: metaViewPub },
            metaSpendPubB58: bs58.encode(metaSpendPub),
            metaViewPubB58: bs58.encode(metaViewPub),
        };
    }

    /**
     * Generates deterministic meta keys from seed (wallet address + PIN).
     * @param {string} seed - Seed string (wallet address + PIN)
     * @returns {{metaSpend: {privateKey: Uint8Array, publicKey: Uint8Array}, metaView: {privateKey: Uint8Array, publicKey: Uint8Array}, metaSpendPubB58: string, metaViewPubB58: string, seed: string}} Meta keys
     */
    generateDeterministicMetaKeys(seed) {
        const seedBytes = this.toBytes(seed);
        const domainSalt = new TextEncoder().encode("SHINGRU | Deterministic Meta Keys | Aptos Network");

        // Derive spend key
        const metaSpendPriv = hkdf(
            sha256,
            seedBytes,
            domainSalt,
            "SHINGRU Spend Authority | Deterministic Derivation",
            32
        );

        // Derive view key
        const metaViewPriv = hkdf(
            sha256,
            seedBytes,
            domainSalt,
            "SHINGRU View Authority | Deterministic Derivation",
            32
        );

        // Ensure valid secp256k1 scalars
        const spendScalar = secp.utils.mod(
            BigInt('0x' + Buffer.from(metaSpendPriv).toString('hex')),
            this.CURVE_N
        );
        const viewScalar = secp.utils.mod(
            BigInt('0x' + Buffer.from(metaViewPriv).toString('hex')),
            this.CURVE_N
        );

        // Convert to final keys
        const spendPrivFinal = this.scalarToBytes(spendScalar);
        const viewPrivFinal = this.scalarToBytes(viewScalar);

        // Derive public keys
        const spendPub = secp.getPublicKey(spendPrivFinal, true);
        const viewPub = secp.getPublicKey(viewPrivFinal, true);

        return {
            metaSpend: { privateKey: spendPrivFinal, publicKey: spendPub },
            metaView: { privateKey: viewPrivFinal, publicKey: viewPub },
            metaSpendPubB58: bs58.encode(spendPub),
            metaViewPubB58: bs58.encode(viewPub),
            seed
        };
    }

    /**
     * Generates one-time ephemeral key for payment.
     * Use once then discard the private key.
     * @returns {{privateKey: string, publicKeyB58: string, publicKeyBytes: Uint8Array}} Ephemeral key
     */
    generateEphemeralKey() {
        const ephPriv = secp.utils.randomPrivateKey();
        const ephPub = secp.getPublicKey(ephPriv, true);

        return {
            privateKey: Buffer.from(ephPriv).toString('hex'),
            publicKeyB58: bs58.encode(ephPub),
            publicKeyBytes: ephPub,
        };
    }

    /**
     * PAYER: Derives stealth address using receiver's public keys.
     * @param {string} metaSpendPubB58 - Receiver's spend public key (base58)
     * @param {string} metaViewPubB58 - Receiver's view public key (base58)
     * @param {string|Uint8Array} ephPriv32 - Ephemeral private key (32 bytes)
     * @returns {Promise<{stealthPubKeyB58: string, stealthAptosAddress: string, stealthPubKeyBytes: Uint8Array}>} Stealth address data
     */
    async deriveStealthPub(metaSpendPubB58, metaViewPubB58, ephPriv32) {
        const ephPrivBytes = this.toBytes(ephPriv32);
        const metaViewPubBytes = this.toBytes(metaViewPubB58);
        const metaSpendPubBytes = this.toBytes(metaSpendPubB58);

        // ecdh with ephemeral priv and meta view pub
        const shared = secp.getSharedSecret(ephPrivBytes, metaViewPubBytes, true);

        // hash to get tweak (skip the 0x02/0x03 prefix byte)
        const tweak = sha256(shared.slice(1));
        const tweakScalar = secp.utils.mod(
            BigInt('0x' + Buffer.from(tweak).toString('hex')),
            this.CURVE_N
        );

        // point addition: stealthPub = metaSpendPub + (tweak × G)
        const tweakPoint = secp.Point.BASE.multiply(tweakScalar);
        const metaSpendPoint = secp.Point.fromHex(metaSpendPubBytes);
        const stealthPoint = metaSpendPoint.add(tweakPoint);

        const stealthPubKeyBytes = stealthPoint.toRawBytes(true);
        const stealthAptosAddress = this.secp256k1PointToAptosAddress(stealthPubKeyBytes);

        return {
            stealthPubKeyB58: bs58.encode(stealthPubKeyBytes),
            stealthAptosAddress,
            stealthPubKeyBytes,
        };
    }

    /**
     * RECEIVER: Recovers stealth private key from payment event.
     * @param {string|Uint8Array} metaSpendPriv - Meta spend private key
     * @param {string|Uint8Array} metaViewPriv - Meta view private key
     * @param {string|Uint8Array} ephPub - Ephemeral public key from payment
     * @returns {Promise<{stealthAddress: string, privateKey: string, publicKeyBase58: string, publicKeyBytes: Uint8Array}>} Stealth keypair
     */
    async deriveStealthKeypair(metaSpendPriv, metaViewPriv, ephPub) {
        const metaSpendPrivBytes = this.toBytes(metaSpendPriv);
        const metaViewPrivBytes = this.toBytes(metaViewPriv);
        const ephPubBytes = this.toBytes(ephPub);

        // ecdh with meta view priv and ephemeral pub (same shared secret as payer)
        const shared = secp.getSharedSecret(metaViewPrivBytes, ephPubBytes, true);

        // same tweak as payer
        const tweak = sha256(shared.slice(1));
        const tweakScalar = secp.utils.mod(
            BigInt('0x' + Buffer.from(tweak).toString('hex')),
            this.CURVE_N
        );

        const metaSpendScalar = secp.utils.mod(
            BigInt('0x' + Buffer.from(metaSpendPrivBytes).toString('hex')),
            this.CURVE_N
        );

        // scalar addition: stealthPriv = metaSpendPriv + tweak
        const stealthPrivScalar = secp.utils.mod(
            metaSpendScalar + tweakScalar,
            this.CURVE_N
        );

        const stealthPrivBytes = this.scalarToBytes(stealthPrivScalar);
        const stealthPubKeyBytes = secp.getPublicKey(stealthPrivBytes, true);
        const stealthAddress = this.secp256k1PointToAptosAddress(stealthPubKeyBytes);

        return {
            stealthAddress,
            privateKey: Buffer.from(stealthPrivBytes).toString('hex'),
            publicKeyBase58: bs58.encode(stealthPubKeyBytes),
            publicKeyBytes: stealthPubKeyBytes,
        };
    }

    /**
     * Encrypts note using ChaCha20-Poly1305.
     * @param {string} plaintext - Message to encrypt
     * @param {string|Uint8Array} ephPriv32 - Ephemeral private key
     * @param {string|Uint8Array} metaViewPub - Receiver's view public key
     * @returns {Promise<Uint8Array>} Encrypted data (nonce + ciphertext + tag)
     */
    async encryptNote(plaintext, ephPriv32, metaViewPub) {
        const ephPrivBytes = this.toBytes(ephPriv32);
        const metaViewPubBytes = this.toBytes(metaViewPub);
        const ephPubBytes = secp.getPublicKey(ephPrivBytes, true);

        const shared = secp.getSharedSecret(ephPrivBytes, metaViewPubBytes, true);

        const salt = sha256(ephPubBytes);
        const encryptionKey = hkdf(sha256, shared.slice(1), salt, 'memo-encryption', 32);

        const nonce = randomBytes(12);
        const cipher = chacha20poly1305(encryptionKey, nonce);
        const plaintextBytes = new TextEncoder().encode(plaintext);
        const ciphertext = cipher.encrypt(plaintextBytes);

        return new Uint8Array([...nonce, ...ciphertext]);
    }

    /**
     * Decrypts note. Throws on MAC verification failure.
     * @param {string|Uint8Array} encryptedData - Encrypted data
     * @param {string|Uint8Array} ephPub32 - Ephemeral public key
     * @param {string|Uint8Array} metaViewPriv - Meta view private key
     * @returns {Promise<string>} Decrypted plaintext
     */
    async decryptNote(encryptedData, ephPub32, metaViewPriv) {
        const encryptedBytes = typeof encryptedData === 'string'
            ? this.toBytes(encryptedData)
            : new Uint8Array(encryptedData);

        const metaViewPrivBytes = this.toBytes(metaViewPriv);
        const ephPubBytes = this.toBytes(ephPub32);

        const shared = secp.getSharedSecret(metaViewPrivBytes, ephPubBytes, true);

        const salt = sha256(ephPubBytes);
        const encryptionKey = hkdf(sha256, shared.slice(1), salt, 'memo-encryption', 32);

        const nonce = encryptedBytes.slice(0, 12);
        const ciphertext = encryptedBytes.slice(12);

        const cipher = chacha20poly1305(encryptionKey, nonce);
        const plaintextBytes = cipher.decrypt(ciphertext);

        return new TextDecoder().decode(plaintextBytes);
    }

    /**
     * Prepares payment data for Move contract call.
     * @param {string} receiverMetaSpendPub - Receiver's spend public key (base58)
     * @param {string} receiverMetaViewPub - Receiver's view public key (base58)
     * @param {string} [noteMessage=''] - Optional encrypted note
     * @param {string} [label=''] - Optional payment label
     * @param {string} [payload=''] - Optional payload data
     * @returns {Promise<{stealthAddress: string, ephemeralPublicKey: Uint8Array, encryptedNote: Uint8Array, labelBytes: Uint8Array, payloadBytes: Uint8Array, ephemeralPrivateKey: string}>} Payment data
     */
    async preparePaymentData(receiverMetaSpendPub, receiverMetaViewPub, noteMessage = '', label = '', payload = '') {
        const ephemeral = this.generateEphemeralKey();
        const stealth = await this.deriveStealthPub(receiverMetaSpendPub, receiverMetaViewPub, ephemeral.privateKey);

        let encryptedNote = new Uint8Array(0);
        if (noteMessage) {
            encryptedNote = await this.encryptNote(noteMessage, ephemeral.privateKey, receiverMetaViewPub);
        }

        const labelBytes = this.pad32(new TextEncoder().encode(label));
        const payloadBytes = new TextEncoder().encode(payload);

        return {
            stealthAddress: stealth.stealthAptosAddress,
            ephemeralPublicKey: ephemeral.publicKeyBytes,
            encryptedNote,
            labelBytes,
            payloadBytes,
            ephemeralPrivateKey: ephemeral.privateKey,
        };
    }

    /**
     * Scans payment event and decrypts if addressed to receiver.
     * @param {Object} paymentEvent - Payment event from blockchain
     * @param {string|Uint8Array} metaViewPriv - Meta view private key
     * @param {string|Uint8Array} metaSpendPriv - Meta spend private key
     * @returns {Promise<{stealthAddress: string, payer: string, amount: string, decryptedNote: string, payload: string, stealthPrivateKey: string}|null>} Payment details or null
     */
    async scanPaymentEvent(paymentEvent, metaViewPriv, metaSpendPriv) {
        const { stealth_owner, payer, amount, label, eph_pubkey, payload, note } = paymentEvent;

        const ephPubB58 = bs58.encode(new Uint8Array(eph_pubkey));

        // try to derive stealth keypair
        const stealthKP = await this.deriveStealthKeypair(metaSpendPriv, metaViewPriv, ephPubB58);

        // check if payment is for us
        const isForUs = stealthKP.stealthAddress.toLowerCase() === stealth_owner.toLowerCase();
        if (!isForUs) {
            return null;
        }

        // decrypt note if there is one
        let decryptedNote = '';
        if (note && note.length > 0) {
            try {
                decryptedNote = await this.decryptNote(new Uint8Array(note), ephPubB58, metaViewPriv);
            } catch (error) {
                console.error('Failed to decrypt note:', error);
            }
        }

        return {
            stealthAddress: stealth_owner,
            payer,
            amount,
            decryptedNote,
            payload: new TextDecoder().decode(new Uint8Array(payload)),
            stealthPrivateKey: stealthKP.privateKey,
        };
    }
}

export { ShingruStealthAptos };

