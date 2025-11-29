// Copyright (c) Shingru Contributors
// SPDX-License-Identifier: Apache-2.0

/// Shingru Stealth Address Protocol for Aptos
///
/// This module implements a privacy-preserving stealth address system using secp256k1
/// elliptic curve cryptography. It enables unlinkable one-time addresses for payments
/// while maintaining complete sender-receiver anonymity.
///
/// Key Features:
/// - Unlinkable one-time addresses for each payment
/// - Encrypted metadata visible only to receiver
/// - On-chain events for payment discovery
/// - Support for any coin type
/// - Gas-sponsored withdrawals
module shingru_stealth::shingru_stealth {
    use aptos_framework::event;
    use aptos_framework::coin;
    use aptos_framework::signer;
    use std::vector;

    // ==================== Error Codes ====================

    /// Payment amount must be greater than zero
    const EInvalidAmount: u64 = 0;

    /// Insufficient coin balance for requested operation
    const EInsufficientFunds: u64 = 1;

    /// Data exceeds maximum allowed length
    const EDataTooLong: u64 = 2;

    /// Invalid ephemeral public key length (must be 33 bytes for compressed secp256k1)
    const EInvalidEphemeralKeyLength: u64 = 3;

    // ==================== Data Limits ====================

    /// Maximum length for public payload message (121 bytes)
    const MAX_PAYLOAD_LENGTH: u64 = 121;

    /// Maximum length for encrypted label (256 bytes, ~200 bytes plaintext after ChaCha20-Poly1305 overhead)
    const MAX_LABEL_LENGTH: u64 = 256;

    /// Maximum length for encrypted note (256 bytes, ~200 bytes plaintext after ChaCha20-Poly1305 overhead)
    const MAX_NOTE_LENGTH: u64 = 256;

    /// Required length for ephemeral public key (33 bytes for compressed secp256k1 point)
    const EPHEMERAL_KEY_LENGTH: u64 = 33;

    // ==================== Events ====================

    /// Emitted when a stealth payment is made
    ///
    /// This event contains all information needed for the receiver to:
    /// 1. Detect the payment (by scanning blockchain events)
    /// 2. Derive the stealth private key (using ephemeral public key)
    /// 3. Decrypt the note (using meta view private key)
    #[event]
    struct PaymentEvent<phantom CoinType> has drop, store {
        /// The stealth address that received the payment
        stealth_owner: address,

        /// The address that sent the payment
        payer: address,

        /// Amount transferred in smallest unit of the coin type
        amount: u64,

        /// Encrypted label for categorization (≤256 bytes)
        /// Can be decrypted by receiver using meta view key
        label: vector<u8>,

        /// Ephemeral public key (33 bytes compressed secp256k1)
        /// Required for receiver to derive stealth private key
        eph_pubkey: vector<u8>,

        /// Public payload message (≤121 bytes)
        /// Visible to everyone on-chain
        payload: vector<u8>,

        /// Encrypted private note (≤256 bytes)
        /// Can only be decrypted by receiver using meta view key
        note: vector<u8>,
    }

    /// Emitted when funds are withdrawn from a stealth address
    ///
    /// This event helps track fund movements from stealth addresses
    #[event]
    struct WithdrawEvent<phantom CoinType> has drop, store {
        /// The stealth address withdrawing funds
        stealth_owner: address,

        /// Amount being withdrawn
        amount: u64,

        /// Destination address for withdrawn funds
        destination: address,
    }

    // ==================== Core Functions ====================

    /// Announce a stealth payment without performing the actual token transfer
    ///
    /// This function is useful when you want to:
    /// - Use custom token transfer logic
    /// - Separate the announcement from the actual transfer
    /// - Implement more complex payment flows
    ///
    /// # Type Parameters
    /// * `CoinType` - The type of coin being announced (e.g., 0x1::aptos_coin::AptosCoin)
    ///
    /// # Arguments
    /// * `amount` - Amount being transferred (must be > 0)
    /// * `stealth_owner` - The derived stealth address
    /// * `label` - Encrypted label for payment categorization (≤256 bytes)
    /// * `eph_pubkey` - Ephemeral public key (must be exactly 33 bytes)
    /// * `payload` - Public message (≤121 bytes)
    /// * `note` - Encrypted private note (≤256 bytes)
    public entry fun announce<CoinType>(
        sender: &signer,
        amount: u64,
        stealth_owner: address,
        label: vector<u8>,
        eph_pubkey: vector<u8>,
        payload: vector<u8>,
        note: vector<u8>,
    ) {
        // Validate inputs
        assert!(amount > 0, EInvalidAmount);
        assert!(vector::length(&label) <= MAX_LABEL_LENGTH, EDataTooLong);
        assert!(vector::length(&eph_pubkey) == EPHEMERAL_KEY_LENGTH, EInvalidEphemeralKeyLength);
        assert!(vector::length(&payload) <= MAX_PAYLOAD_LENGTH, EDataTooLong);
        assert!(vector::length(&note) <= MAX_NOTE_LENGTH, EDataTooLong);

        let sender_addr = signer::address_of(sender);

        // Emit payment event
        event::emit(PaymentEvent<CoinType> {
            stealth_owner,
            payer: sender_addr,
            amount,
            label,
            eph_pubkey,
            payload,
            note,
        });
    }

    /// Perform an integrated stealth payment
    ///
    /// This function handles both the token transfer and event emission in a single transaction.
    /// It automatically:
    /// - Transfers the exact payment amount
    /// - Returns change to the payer
    /// - Emits the payment event
    ///
    /// # Type Parameters
    /// * `CoinType` - The type of coin being transferred (e.g., 0x1::aptos_coin::AptosCoin)
    ///
    /// # Arguments
    /// * `amount` - Amount to transfer (must be > 0)
    /// * `stealth_owner` - The derived stealth address
    /// * `label` - Encrypted label for payment categorization (≤256 bytes)
    /// * `eph_pubkey` - Ephemeral public key (must be exactly 33 bytes)
    /// * `payload` - Public message (≤121 bytes)
    /// * `note` - Encrypted private note (≤256 bytes)
    public entry fun pay<CoinType>(
        sender: &signer,
        amount: u64,
        stealth_owner: address,
        label: vector<u8>,
        eph_pubkey: vector<u8>,
        payload: vector<u8>,
        note: vector<u8>,
    ) {
        // Validate inputs
        assert!(amount > 0, EInvalidAmount);
        assert!(vector::length(&label) <= MAX_LABEL_LENGTH, EDataTooLong);
        assert!(vector::length(&eph_pubkey) == EPHEMERAL_KEY_LENGTH, EInvalidEphemeralKeyLength);
        assert!(vector::length(&payload) <= MAX_PAYLOAD_LENGTH, EDataTooLong);
        assert!(vector::length(&note) <= MAX_NOTE_LENGTH, EDataTooLong);

        let sender_addr = signer::address_of(sender);

        // Transfer coins to stealth address
        coin::transfer<CoinType>(sender, stealth_owner, amount);

        // Emit payment event
        event::emit(PaymentEvent<CoinType> {
            stealth_owner,
            payer: sender_addr,
            amount,
            label,
            eph_pubkey,
            payload,
            note,
        });
    }

    /// Withdraw funds from a stealth address to a destination address
    ///
    /// This function allows the receiver to move funds from a stealth address
    /// to another address. It supports gas sponsorship, which is critical because
    /// stealth addresses typically have no APT for gas fees.
    ///
    /// # Gas Sponsorship Flow:
    /// 1. Transaction sender is the stealth address (authorizes withdrawal)
    /// 2. Gas owner is the receiver's main address (pays for gas)
    /// 3. Both signatures are required for execution
    ///
    /// # Type Parameters
    /// * `CoinType` - The type of coin being withdrawn (e.g., 0x1::aptos_coin::AptosCoin)
    ///
    /// # Arguments
    /// * `amount` - Amount to withdraw (must be > 0)
    /// * `destination` - Address to receive the withdrawn funds
    public entry fun withdraw<CoinType>(
        sender: &signer,
        amount: u64,
        destination: address,
    ) {
        // Validate inputs
        assert!(amount > 0, EInvalidAmount);

        let stealth_owner = signer::address_of(sender);

        // Transfer coins from stealth address to destination
        coin::transfer<CoinType>(sender, destination, amount);

        // Emit withdrawal event
        event::emit(WithdrawEvent<CoinType> {
            stealth_owner,
            amount,
            destination,
        });
    }

    // ==================== Utility Functions ====================

    /// Validate ephemeral public key format
    ///
    /// Verifies that the ephemeral public key is exactly 33 bytes,
    /// which is the standard compressed secp256k1 public key format.
    ///
    /// # Arguments
    /// * `eph_pubkey` - The ephemeral public key to validate
    ///
    /// # Returns
    /// * `bool` - true if valid, false otherwise
    public fun is_valid_ephemeral_key(eph_pubkey: &vector<u8>): bool {
        vector::length(eph_pubkey) == EPHEMERAL_KEY_LENGTH
    }

    /// Validate data field lengths
    ///
    /// Verifies that all data fields are within their maximum allowed lengths.
    ///
    /// # Arguments
    /// * `label` - The label to validate
    /// * `payload` - The payload to validate
    /// * `note` - The note to validate
    ///
    /// # Returns
    /// * `bool` - true if all fields are valid, false otherwise
    public fun are_valid_data_lengths(
        label: &vector<u8>,
        payload: &vector<u8>,
        note: &vector<u8>,
    ): bool {
        vector::length(label) <= MAX_LABEL_LENGTH &&
        vector::length(payload) <= MAX_PAYLOAD_LENGTH &&
        vector::length(note) <= MAX_NOTE_LENGTH
    }

    // ==================== Test-Only Functions ====================

    #[test_only]
    /// Get the maximum payload length for testing
    public fun get_max_payload_length(): u64 {
        MAX_PAYLOAD_LENGTH
    }

    #[test_only]
    /// Get the maximum label length for testing
    public fun get_max_label_length(): u64 {
        MAX_LABEL_LENGTH
    }

    #[test_only]
    /// Get the maximum note length for testing
    public fun get_max_note_length(): u64 {
        MAX_NOTE_LENGTH
    }

    #[test_only]
    /// Get the required ephemeral key length for testing
    public fun get_ephemeral_key_length(): u64 {
        EPHEMERAL_KEY_LENGTH
    }
}

