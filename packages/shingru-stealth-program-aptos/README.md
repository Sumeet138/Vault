# Shingru Stealth Program - Aptos

Privacy-preserving stealth address smart contract for Aptos blockchain.

## Overview

This Move smart contract implements the Shingru stealth address protocol on Aptos, enabling unlinkable one-time addresses for payments while maintaining complete sender-receiver anonymity.

## Features

- **Unlinkable Addresses**: Each payment generates a unique, mathematically unlinkable address
- **Encrypted Metadata**: Payment notes and labels are encrypted using ChaCha20-Poly1305
- **Event-Based Discovery**: On-chain events enable receivers to discover payments
- **Multi-Coin Support**: Works with any coin type on Aptos
- **Gas Efficiency**: Optimized for minimal gas consumption

## Prerequisites

1. **Aptos CLI**: Install from [Aptos Documentation](https://aptos.dev/tools/aptos-cli/install-cli/)
   ```bash
   curl -fsSL https://aptos.dev/scripts/install_cli.py | python3
   ```

2. **Testnet APT**: Get testnet tokens from [Aptos Faucet](https://faucet.testnet.aptoslabs.com/)

## Deployment

### Quick Deploy (Testnet)

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh testnet
```

**Windows (PowerShell):**
```powershell
.\deploy.ps1 testnet
```

### Manual Deploy

1. **Initialize Aptos Profile** (if not already done):
   ```bash
   aptos init --profile testnet --network testnet
   ```

2. **Get Account Address**:
   ```bash
   aptos config show-profiles --profile testnet
   ```
   Copy the account address.

3. **Update Move.toml**:
   Replace `shingru_stealth = "0x0"` with your account address:
   ```toml
   [addresses]
   shingru_stealth = "YOUR_ACCOUNT_ADDRESS"
   ```

4. **Compile**:
   ```bash
   aptos move compile --package-dir . --named-addresses shingru_stealth=YOUR_ACCOUNT_ADDRESS
   ```

5. **Publish**:
   ```bash
   aptos move publish \
     --package-dir . \
     --named-addresses shingru_stealth=YOUR_ACCOUNT_ADDRESS \
     --profile testnet \
     --assume-yes
   ```

## Configuration

After deployment, add the contract address to your frontend `.env.local`:

```env
# For Testnet
NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_TESTNET=YOUR_PACKAGE_ADDRESS

# For Mainnet
NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_MAINNET=YOUR_PACKAGE_ADDRESS
```

## Contract Functions

### `pay<CoinType>`
Send a payment to a stealth address.

**Parameters:**
- `amount: u64` - Payment amount
- `stealth_owner: address` - Stealth address to receive payment
- `encrypted_label: vector<u8>` - Encrypted payment label (max 256 bytes)
- `ephemeral_pub: vector<u8>` - Ephemeral public key (33 bytes)
- `encrypted_payload: vector<u8>` - Encrypted payload (max 121 bytes)
- `encrypted_note: vector<u8>` - Encrypted note (max 256 bytes)

**Events:**
- `PaymentEvent` - Emitted when payment is received

### `withdraw<CoinType>`
Withdraw funds from a stealth address to a destination address.

**Parameters:**
- `stealth_owner: address` - Stealth address to withdraw from
- `destination: address` - Destination address
- `amount: u64` - Amount to withdraw

**Events:**
- `WithdrawEvent` - Emitted when withdrawal is made

## Testing

Run the test suite:
```bash
npm test
# or
aptos move test
```

## Security

- All cryptographic operations are performed off-chain
- On-chain contract only handles coin transfers and event emission
- Private keys never leave the client
- Uses battle-tested secp256k1 and ChaCha20-Poly1305

## License

Apache-2.0
