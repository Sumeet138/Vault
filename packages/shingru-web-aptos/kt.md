# Shingru Web Aptos - Knowledge Transfer (KT)

## Project Overview

**Shingru Web Aptos** is a **privacy-first private payment platform on Aptos** that enables unlinkable one-time addresses for payments on the Aptos blockchain. Each payment creates a unique, mathematically unlinkable address that only the receiver can control.

**Key Features:**
- **Stealth addresses** - Every payment goes to a fresh address that only you can spend from
- **Universal support** - Works with APT and any coin on Aptos
- **No complexity** - Senders just need your username. No addresses, no chains, no confusion
- **Self-custody** - Your keys, your coins, always
- **Backend-less** - All operations happen client-side, no server required
- **Battle-tested crypto** - secp256k1 + ChaCha20-Poly1305

## Technology Stack

### Core Technologies
- **Framework**: Next.js 15.5.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with DaisyUI
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React, Heroicons, Hugeicons
- **Animations**: Framer Motion, GSAP, tw-animate-css
- **State Management**: Zustand, React Query
- **Web3 Integration**: Aptos SDK, Wagmi, RainbowKit
- **Crypto Libraries**: @noble/secp256k1, @noble/ciphers, @noble/hashes, bs58
- **Database**: Supabase for user data and payment tracking

### Aptos-Specific Dependencies
- `@aptos-labs/ts-sdk`: Aptos blockchain interaction
- `@marsidev/react-turnstile`: Cloudflare Turnstile integration for protection
- `ethers`: Ethereum wallet compatibility

## Project Architecture

### Directory Structure
```
shingru-web-aptos/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── (landing)     # Landing page routes
│   │   ├── (main)        # Main application routes
│   │   ├── (other)       # Other pages
│   │   ├── (pay)         # Payment handling routes
│   │   ├── api/          # API routes
│   │   ├── globals.css   # Global styles
│   │   └── layout.tsx    # Root layout
│   ├── assets/           # Static assets (fonts, images, sounds)
│   ├── common/           # Common utilities
│   ├── components/       # React components
│   │   ├── common/       # Common UI components
│   │   ├── icons/        # Custom icons
│   │   ├── layouts/      # Layout components
│   │   └── pages/        # Page-specific components
│   ├── config/           # Configuration files
│   ├── hooks/            # Custom React hooks
│   ├── lib/
│   │   ├── @pivy/        # Pivy-related utilities
│   │   ├── @shingru/     # Shingru core libraries (stealth addresses, crypto)
│   │   ├── api/          # API utilities
│   │   ├── aptos/        # Aptos-specific utilities
│   │   ├── photon/       # Photon SDK integration
│   │   ├── supabase/     # Supabase client and utilities
│   │   ├── empty.js      # Empty module for webpack compatibility
│   │   └── utils.ts      # General utilities
│   ├── providers/        # React context providers
│   ├── store/            # Zustand stores
│   └── utils/            # Utility functions
└── public/               # Static assets
```

## Core System Components

### 1. Authentication System (`AuthProvider`)
The authentication system handles both Aptos wallet authentication and Photon authentication:
- **Wallet Authentication**: Uses Petra wallet for Aptos authentication
- **Photon Integration**: Supports Photon SDK for rewards and engagement
- **Session Management**: Stores authentication state in localStorage
- **Chain Selection**: Supports Aptos testnet/mainnet

### 2. Meta Keys System (`MetaKeysProvider`)
Handles the secure storage and management of cryptographic keys:
- **Meta Spend Keys**: Used to derive stealth addresses for payments
- **Meta View Keys**: Used to scan and decrypt incoming payments
- **Secure Storage**: AES-256-GCM encryption with PBKDF2 key derivation from user PIN
- **Session Management**: 24-hour session persistence for UX
- **Deterministic Key Generation**: Uses secp256k1 deterministic key generation from wallet signature

### 3. Stealth Address System (`@shingru/core`)
The core cryptographic system for privacy-preserving payments:
- **secp256k1-based**: Uses secp256k1 elliptic curve cryptography
- **Stealth Addresses**: Generates unique addresses for each payment that are unlinkable
- **ECDH Key Exchange**: Elliptic Curve Diffie-Hellman for shared secret generation
- **ChaCha20-Poly1305**: Authenticated encryption for note/label protection
- **HKDF Key Derivation**: HMAC-based key derivation for deterministic key generation

### 4. Event Scanning System (`AptosEventScanner`)
Scans the Aptos blockchain for payment events:
- **Payment Event Detection**: Queries blockchain for PaymentEvents
- **Stealth Payment Scanning**: Scans for payments addressed to user's stealth addresses
- **Real-time Updates**: Polls for new payments every 5 seconds
- **Transaction Hash Tracking**: Maintains transaction hashes for payment verification

### 5. Treasury System (Supabase-based)
Balances are managed through a treasury-based system:
- **User Balances**: Stored in Supabase `user_balances` table
- **Balance Transactions**: Tracks deposit/withdraw events in `balance_transactions` table
- **Payment Tracking**: Records stealth payments in `stealth_payments` table
- **Treasury Integration**: Supports treasury-based withdrawals

## Key Data Structures

### 1. Meta Keys
```typescript
interface MetaKeys {
  metaSpend: { privateKey: Uint8Array; publicKey: Uint8Array };
  metaView: { privateKey: Uint8Array; publicKey: Uint8Array };
  metaSpendPubB58: string;
  metaViewPubB58: string;
}
```

### 2. Stealth Addresses
- Generated using ECDH (Elliptic Curve Diffie-Hellman) between sender's ephemeral key and receiver's meta view key
- Used for one-time payments that are unlinkable to the receiver's main identity
- Each payment creates a unique stealth address

### 3. Payment Events
- Stored in `stealth_payments` Supabase table
- Includes transaction hash, stealth address, payer address, amount, and encrypted metadata
- Status tracked as "CONFIRMED" or "WITHDRAWN"

## Security Features

### 1. Encryption
- **AES-256-GCM**: For encrypting meta keys in browser storage
- **ChaCha20-Poly1305**: For encrypting payment notes and labels
- **PBKDF2**: Password-Based Key Derivation Function for PIN-to-key transformation

### 2. Key Management
- **Deterministic Key Generation**: Keys derived from wallet signatures using HKDF
- **Separate Spend/View Keys**: Spend key for creating stealth addresses, view key for scanning
- **No Key Storage on Server**: All cryptographic keys remain in user's browser

### 3. Privacy Protection
- **Unlinkable Payments**: Each payment goes to a unique stealth address
- **Encrypted Metadata**: Payment notes and labels are encrypted
- **Client-Side Only**: No sensitive data stored on servers

## User Flow

### 1. Registration & Setup
1. User connects Aptos wallet (Petra)
2. System generates deterministic meta keys from wallet signature
3. User sets PIN for encrypting meta keys
4. Encrypted meta keys stored in browser localStorage
5. User profile created in Supabase

### 2. Receiving Payments
1. System creates unique stealth addresses for each payment
2. Sender sends APT to stealth address with encrypted note
3. System scans blockchain for PaymentEvents
4. System decrypts payments using view keys
5. Balance automatically credited to user's account

### 3. Withdrawing Funds
1. User initiates withdrawal request
2. System calls treasury withdrawal API
3. Funds sent from treasury to user's destination address
4. User balance debited in Supabase

## Configuration

### Environment Variables
```env
# Aptos RPC and Indexer
NEXT_PUBLIC_IS_TESTNET=true
NEXT_PUBLIC_APTOS_TESTNET_RPC_URL=https://fullnode.testnet.aptoslabs.com
NEXT_PUBLIC_APTOS_MAINNET_RPC_URL=https://fullnode.mainnet.aptoslabs.com
NEXT_PUBLIC_APTOS_TESTNET_INDEXER_URL=https://api.testnet.aptoslabs.com/v1/graphql
NEXT_PUBLIC_APTOS_MAINNET_INDEXER_URL=https://api.mainnet.aptoslabs.com/v1/graphql
NEXT_PUBLIC_APTOS_INDEXER_API_KEY=your_geomi_api_key

# Shingru Contract
NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_TESTNET=0x...
NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_MAINNET=0x...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema (Supabase)

### Main Tables
- **users**: User profiles and wallet addresses
- **stealth_payments**: Records of stealth payments received
- **user_balances**: Current balances for users
- **balance_transactions**: History of deposits and withdrawals
- **treasury_config**: Treasury address configuration

### Supabase Migrations Required
1. `create_stealth_payments_table.sql` - Creates stealth_payments table
2. `fix_users_rls_policies.sql` - Sets up RLS policies for users table
3. `fix_wallets_rls_policies.sql` - Sets up RLS policies for wallets table
4. `fix_stealth_payments_rls_policies.sql` - Sets up RLS policies for stealth_payments table
5. `create_user_balances_table.sql` - Creates treasury balance tables
6. `add_balance_tracking_to_payments.sql` - Adds balance tracking to payments

## Photon Integration

The platform integrates with the Photon SDK for engagement and rewards:
- **Campaign Events**: Track user interactions and reward engagement
- **Wallet Integration**: Photon provides wallet addresses for rewards
- **User Actions**: Track attribution and engagement metrics

## Design System

### Colors
Defined in `src/app/globals.css` as CSS variables.
- **Primary**: Black (`--primary`, `#000000`)
- **Secondary**: Light Blue (`--secondary`, `#43b1ff`)
- **Tertiary**: Green (`--tertiary`, `#04d84d`)
- **Background**: White (`--background`, `#ffffff`)
- **Danger**: Orange (`--danger`, `#ff5700`)
- **Warning**: Yellow (`--warning`, `#fec431`)
- **Success**: Green (`--success`, `#04d84d`)

### Typography
- **Font Family**: "Open Runde", system-ui sans-serif
- **Headings**: `tracking-tight` applied by default

### Animations
- **Global Animations**: Defined in `globals.css` (marquee, shiny-text, fade-in, zoom-in)
- **Libraries**: Framer Motion used for complex interactions
- **Custom**: `EmojiRain` component for background effects

## Component Architecture

### UI Components (`src/components/ui`)
Standard shadcn/ui components. Use these for basic building blocks.

### Common Components (`src/components/common`)
High-level, styled components specific to the platform.
- **CuteButton**: Custom button with specific styling.
- **CuteCard**: Card component with consistent border/shadow.
- **EmojiRain**: Background animation effect.
- **MainButton**: Primary action button.
- **RewardToast**: Shows reward notifications.

## Development Guidelines

### Security Best Practices
- **Never store private keys server-side**: All cryptographic keys remain client-side
- **Use encrypted storage**: Meta keys must be encrypted with user PIN
- **Validate inputs**: Always validate user inputs and blockchain data
- **Use secure crypto libraries**: Rely on established cryptographic libraries like @noble

### Code Organization
- **Separation of concerns**: Separate crypto logic, UI, data fetching, and state management
- **Context providers**: Use React Context for managing complex state
- **Type safety**: Maintain TypeScript type definitions throughout
- **Error handling**: Implement comprehensive error handling for all async operations

### Testing Considerations
- **Integration tests**: Test crypto functionality with known values
- **Mock services**: Mock external services like Aptos RPC and Supabase
- **Crypto validation**: Ensure cryptographic functions work as expected across different scenarios

## Troubleshooting

### Common Issues
1. **Meta Key Storage**: If users report issues with PIN unlock, check localStorage for encrypted data
2. **Payment Scanning**: If payments don't appear, verify the stealth program ID and indexer configuration
3. **Wallet Connection**: Ensure Petra wallet is properly installed and connected
4. **Supabase RLS**: If updates fail, verify RLS policies are correctly configured

### Debugging
- Check browser localStorage for encrypted meta keys and session data
- Verify environment variables for Aptos and Supabase configurations
- Monitor blockchain event scanning for missed payments
- Test crypto functions with known deterministic values

## Deployment Notes

### Production Requirements
- Supabase project with configured database and RLS policies
- Aptos indexer API key (Geomi or similar)
- Proper domain configuration for wallet connection
- Treasury system setup for withdrawals

### Performance Considerations
- Blockchain scanning happens every 5-8 seconds (configurable intervals)
- Balance and activity refreshes are rate-limited
- Session persistence reduces need for PIN re-entry
