# Shingru Web - Aptos

**Privacy-first private payment platform on Aptos**

One shareable link. Infinite privacy. Complete self-custody.

## Overview

Shingru is a backend-less privacy-preserving payment platform that enables unlinkable one-time addresses for payments on Aptos. Each payment creates a unique, mathematically unlinkable address that only the receiver can control.

## Features

- **Stealth addresses** - Every payment goes to a fresh address that only you can spend from
- **Universal support** - Works with APT and any coin on Aptos
- **No complexity** - Senders just need your username. No addresses, no chains, no confusion
- **Self-custody** - Your keys, your coins, always
- **Backend-less** - All operations happen client-side, no server required
- **Battle-tested crypto** - secp256k1 + ChaCha20-Poly1305

## Getting Started

### Prerequisites

- Node.js v18+ or Bun
- Aptos CLI (optional, for contract deployment)
- Git

### Installation

```bash
cd packages/shingru-web-aptos
npm install
# or
bun install
```

### Development

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Architecture

This is a **backend-less** application. All operations happen client-side:

- **Wallet Connection**: Direct connection to Aptos wallets via `window.aptos`
- **Meta Keys**: Generated and stored locally using AES-256-GCM encryption
- **Payment Scanning**: Direct blockchain queries to Aptos RPC
- **User Data**: Stored in browser localStorage

## Key Differences from PIVY

1. **No Backend**: All operations are client-side
2. **Aptos Network**: Uses Aptos instead of IOTA
3. **No Demo Tokens**: Demo features removed
4. **Simplified Auth**: Wallet-based authentication without backend verification

## Project Structure

```
shingru-web-aptos/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── config/           # Configuration files
│   ├── hooks/            # Custom React hooks
│   ├── lib/
│   │   └── @shingru/     # Shingru core libraries
│   │       └── core/     # Crypto and stealth address logic
│   ├── providers/        # React context providers
│   └── utils/            # Utility functions
└── public/               # Static assets
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_IS_TESTNET=true
NEXT_PUBLIC_APTOS_TESTNET_RPC_URL=https://fullnode.testnet.aptoslabs.com
NEXT_PUBLIC_APTOS_MAINNET_RPC_URL=https://fullnode.mainnet.aptoslabs.com
NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_TESTNET=0x...
NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_MAINNET=0x...
NEXT_PUBLIC_APTOS_TESTNET_INDEXER_URL=https://api.testnet.aptoslabs.com/v1/graphql
NEXT_PUBLIC_APTOS_MAINNET_INDEXER_URL=https://api.mainnet.aptoslabs.com/v1/graphql
NEXT_PUBLIC_APTOS_INDEXER_API_KEY=your_geomi_api_key
```

> 💡 **Indexer API key**  
> Aptos now rate-limits anonymous access to the public indexer. Create a free API key from [Geomi](https://geomi.dev/docs/start) (or reuse an existing Aptos key) and drop it into `NEXT_PUBLIC_APTOS_INDEXER_API_KEY` so the event scanner can query without hitting 429 errors.  
> Optional overrides:  
> - `NEXT_PUBLIC_APTOS_TESTNET_INDEXER_API_KEY`  
> - `NEXT_PUBLIC_APTOS_MAINNET_INDEXER_API_KEY`  
> - `NEXT_PUBLIC_APTOS_GEOMI_API_KEY` (alias for shared key)

### Supabase Setup

This application uses Supabase for user data storage. You need to:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Add them to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the database migrations in `supabase-migrations/`:
   - `create_stealth_payments_table.sql` - Creates the stealth_payments table (run first)
   - `fix_users_rls_policies.sql` - Sets up RLS policies for users table
   - `fix_wallets_rls_policies.sql` - Sets up RLS policies for wallets table (required for wallet setup)
   - `fix_stealth_payments_rls_policies.sql` - Sets up RLS policies for stealth_payments table (required for payment tracking)
   - `create_user_balances_table.sql` - Creates treasury balance tables (NEW - required for treasury system)
   - `add_balance_tracking_to_payments.sql` - Adds balance tracking to payments (NEW)

   You can run these in the Supabase SQL Editor (Dashboard > SQL Editor) or using Supabase CLI.
   
   **Important**: Run migrations in this order:
   1. `create_stealth_payments_table.sql`
   2. `fix_users_rls_policies.sql`
   3. `fix_wallets_rls_policies.sql`
   4. `fix_stealth_payments_rls_policies.sql`
   5. `create_user_balances_table.sql` ⭐ NEW
   6. `add_balance_tracking_to_payments.sql` ⭐ NEW

### Treasury Setup (NEW)

This application now uses a treasury-based balance system. See `TREASURY_SETUP.md` for detailed instructions.

Quick setup:
1. Generate treasury wallet: `aptos init --network testnet`
2. Fund it: `aptos account fund-with-faucet --account YOUR_ADDRESS`
3. Update `.env` with treasury private key and address
4. Update treasury address in Supabase `treasury_config` table
5. Run treasury migrations (steps 5-6 above)

For detailed instructions, see:
- `TREASURY_SETUP.md` - Complete setup guide
- `scripts/setup-treasury.md` - Step-by-step script
- `TREASURY_INTEGRATION_SUMMARY.md` - Integration overview

## License

Apache-2.0
