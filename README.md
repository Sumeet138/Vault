![pivy-iota-banner](https://github.com/user-attachments/assets/22fad0e3-cdf1-4dcb-b25b-a2679cabd37a)

<div align="center">

# PIVY on IOTA

**The first stealth address implementation on IOTA**

One shareable link. Infinite privacy. Complete self-custody.

[Try it Live](https://iota.pivy.me) • [View Contract](https://iotascan.com/testnet/object/0x24772fde2e6bf966350598d38a33e8e1f0ce546ac5d5195f18f2c8502c25e907/txs) 

**Submission for IOTA Moveathon Europe Edition**

</div>

---

## The Problem

When you receive crypto payments today, you're basically doxxing yourself. Every payment links back to your main wallet. Anyone who pays you can see:

- Your entire payment history
- Your current balance
- Who else paid you
- What you spend money on

Privacy shouldn't be optional for payments. It's a fundamental right.

---

## The Solution

PIVY gives you one shareable link like `iota.pivy.me/yourname`. Share it anywhere.

Each person who pays you gets a unique, mathematically unlinkable address. They send to that address. You control the funds. Nobody can connect the dots.

One link. Infinite privacy. No compromises.

### What You Get

**Stealth addresses** - Every payment goes to a fresh address that only you can spend from

**Universal support** - Works with IOTA and any coin on the network

**No complexity** - Senders just need your username. No addresses, no chains, no confusion

**Self-custody** - Your keys, your coins, always

**Battle-tested crypto** - secp256k1 + ChaCha20-Poly1305

---

## Live Demo

| Resource | URL |
|----------|-----|
| Web App | [iota.pivy.me](https://iota.pivy.me) |
| Smart Contract | [View on IOTAScan](https://iotascan.com/testnet/object/0x24772fde2e6bf966350598d38a33e8e1f0ce546ac5d5195f18f2c8502c25e907/txs) |
| Backend API | [api-iota.pivy.me](https://api-iota.pivy.me) |

---

## How It Works

```
SENDER                      BLOCKCHAIN                     RECEIVER
  │                             │                             │
  │  Get receiver's meta keys   │                             │
  │─────────────────────────────────────────────────────────>│
  │                             │                             │
  │  Generate ephemeral key     │                             │
  │  Derive stealth address     │                             │
  │  (S = M + t*G)             │                             │
  │                             │                             │
  │  Send payment              │                             │
  │────────────────────────────>│                             │
  │                             │                             │
  │                             │  Scan for payments          │
  │                             │  Detect new payment         │
  │                             │<────────────────────────────│
  │                             │                             │
  │                             │  Derive stealth private key │
  │                             │  (s = m + t)                │
  │                             │                             │
  │                             │  Withdraw to main wallet    │
  │                             │<────────────────────────────│
```

The math ensures each payment creates a unique address that only the receiver can control, while being completely unlinkable to their identity.

---

## Getting Started

### Prerequisites

- Node.js v18+ or Bun
- IOTA CLI - [Install here](https://docs.iota.org/developer/getting-started/install-iota)
- Git

### Installation

Clone and install:

```bash
git clone https://github.com/yourusername/pivy-stealth-iota.git
cd pivy-stealth-iota
bun install
```

Or with npm:

```bash
npm install --legacy-peer-deps --workspaces
```

Configure IOTA CLI:

```bash
# Check your active address
iota client active-address

# Create one if needed
iota client new-address secp256k1

# Switch to testnet
iota client switch --env testnet
```

---

## Running the Code

### Smart Contract Package

Navigate to the contract:

```bash
cd packages/pivy-stealth-program-iota
```

#### Deploy the Contract

Interactive deployment (picks network for you):

```bash
npm run deploy
```

Or specify the network:

```bash
./scripts/deploy.sh testnet
./scripts/deploy.sh localnet
./scripts/deploy.sh mainnet  # careful, real money
```

The script handles everything:
- Builds the Move contract
- Runs tests
- Requests testnet tokens
- Deploys to chain
- Saves Package ID to `.env`

#### Test Cryptography (No Blockchain)

Want to understand the math without touching the blockchain?

```bash
node scripts/full-flow-logic.js
```

This simulates the complete stealth address flow:
1. Generate receiver's meta keys (spend + view)
2. Sender generates ephemeral key
3. Derive stealth address using point math
4. Encrypt payment notes
5. Receiver detects payment
6. Decrypt and derive stealth private key
7. Verify everything matches

Perfect for learning how the cryptography works.

#### Full Integration Test (With Blockchain)

Test the real deal on IOTA:

```bash
PACKAGE_ID="0x..." node scripts/full-flow-integration.js
```

This does everything for real:
- Connects to IOTA client
- Requests faucet tokens
- Generates meta keys
- Derives stealth address
- Sends actual on-chain payment
- Scans for PaymentEvent
- Decrypts notes
- Withdraws from stealth address to main wallet

Perfect for verifying the full flow works end-to-end.

#### Run Move Tests

```bash
npm run test:move
```

#### Run Everything

```bash
npm test
```

### Web Frontend

```bash
npm run web
# Opens at http://localhost:3000
```

Or:

```bash
cd packages/pivy-web-iota
npm run dev
```

### Backend API

```bash
npm run backend
# Starts at http://localhost:4000
```

Or:

```bash
cd packages/pivy-backend-iota
npm run dev
```

---

## Repository Structure

```
pivy-stealth-iota/
├── packages/
│   ├── pivy-stealth-program-iota/      # Smart contract
│   │   ├── sources/
│   │   │   └── pivy_stealth.move       # Main contract
│   │   ├── scripts/
│   │   │   ├── deploy.sh               # Deployment script
│   │   │   ├── full-flow-logic.js      # Crypto simulation
│   │   │   ├── full-flow-integration.js # Full blockchain test
│   │   │   └── pivyStealthIota.js      # Core crypto library
│   │   ├── Move.toml
│   │   └── package.json
│   │
│   ├── pivy-web-iota/                  # React/Next.js frontend
│   └── pivy-backend-iota/              # Node.js backend
│
├── package.json
└── README.md
```

### Related Repos

The frontend and backend are currently private to avoid misuse.
---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Frontend  │────▶│  Backend API    │────▶│   IOTA Chain    │
│  (React/Next)   │     │  (Node.js)      │     │  (Move)         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                        │
        │                       │                        │
        ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Meta Key Gen   │     │ Payment Monitor │     │ Stealth Module  │
│  (secp256k1)    │     │ Event Indexer   │     │ Generic Coins   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                        │
        └───────────────────────┴────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Crypto Primitives  │
                    │  - ECDH secp256k1   │
                    │  - ChaCha20-Poly1305│
                    │  - HKDF + SHA-256   │
                    └─────────────────────┘
```

The contract supports any coin type on IOTA:

| Token | Payment | Withdrawal |
|-------|---------|------------|
| IOTA (native) | `pay<IOTA>()` | `withdraw<IOTA>()` |
| Any coin | `pay<CoinType>()` | `withdraw<CoinType>()` |

The system auto-detects the token type and routes it correctly.

---

## Technical Deep Dive

### Meta Key Generation

Meta keys are derived deterministically using HKDF with domain separation:

```javascript
generateDeterministicMetaKeys(seed: string) {
  const seedBytes = toBytes(seed);
  const domainSalt = toBytes("PIVY | Deterministic Meta Keys | IOTA Network");

  // Derive spend key
  const metaSpendPriv = hkdf(
    sha256,
    seedBytes,
    domainSalt,
    "PIVY Spend Authority | Deterministic Derivation",
    32
  );

  // Derive view key
  const metaViewPriv = hkdf(
    sha256,
    seedBytes,
    domainSalt,
    "PIVY View Authority | Deterministic Derivation",
    32
  );

  // Ensure valid secp256k1 scalars
  const spendScalar = secp.utils.mod(
    BigInt('0x' + Buffer.from(metaSpendPriv).toString('hex')),
    secp.CURVE.n
  );
  const viewScalar = secp.utils.mod(
    BigInt('0x' + Buffer.from(metaViewPriv).toString('hex')),
    secp.CURVE.n
  );

  // Convert to final keys
  const spendPrivFinal = Uint8Array.from(
    Buffer.from(spendScalar.toString(16).padStart(64, '0'), 'hex')
  );
  const viewPrivFinal = Uint8Array.from(
    Buffer.from(viewScalar.toString(16).padStart(64, '0'), 'hex')
  );

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
```

**Key types:**

- `metaViewPriv` - Decrypts payment details. Never leaves your device.
- `metaViewPub` - Senders use this to encrypt data. Public.
- `metaSpendPriv` - Derives stealth private keys. Never leaves your device.
- `metaSpendPub` - Used to generate stealth addresses. Public.

**Security properties:**

- Same wallet + PIN = same keys (recoverable)
- Requires both wallet signature and PIN
- HKDF ensures spend/view keys are cryptographically independent
- All keys are valid secp256k1 scalars
- Private keys never transmitted

### Ephemeral Key Encryption

Each payment uses one-time ephemeral keys:

```javascript
// ECDH key agreement
const shared = secp.getSharedSecret(ephPriv, metaViewPub, true);
const salt = sha256(ephPub);

// Derive encryption key
const key = hkdf(sha256, shared.slice(1), salt, "ephemeral-key-encryption", 32);

// Encrypt with AEAD
const nonce = randomBytes(12);
const cipher = chacha20poly1305(key, nonce);
const encrypted = cipher.encrypt(plaintext);
```

This gives you forward secrecy. Compromising one payment doesn't affect others.

### Stealth Address Derivation

The core innovation:

```javascript
// ECDH shared secret
const shared = secp.getSharedSecret(ephPriv, metaViewPub, true);
const tweak = sha256(shared.slice(1));
const tweakScalar = BigInt('0x' + Buffer.from(tweak).toString('hex')) % CURVE_ORDER;

// Point arithmetic: StealthPub = MetaSpendPub + tweak * G
const tweakPoint = secp.Point.BASE.multiply(tweakScalar);
const stealthPoint = metaSpendPoint.add(tweakPoint);

// Convert to IOTA address
const stealthAddress = secp256k1PointToIotaAddress(stealthPoint);
```

**The math:**

```
Given:
  Meta spend private key: m
  Meta spend public key: M = m * G
  Ephemeral private key: r
  Ephemeral public key: R = r * G

Derivation:
  Shared secret: S = r * V (V = meta view public key)
  Tweak: t = SHA256(S)

Stealth address:
  Public: S = M + t * G
  Private: s = m + t

Proof: s * G = (m + t) * G = m * G + t * G = M + t * G = S ✓
```

### Payment Flow

**Sender:**

```javascript
const pivy = new PivyStealthIota();

// Generate ephemeral key
const ephemeral = pivy.generateEphemeralKey();

// Derive stealth address (sender doesn't know the private key!)
const stealthAddress = await pivy.deriveStealthPub(
  receiverMetaSpendPub,
  receiverMetaViewPub,
  ephemeral.privateKey
);

// Encrypt note
const encryptedNote = await pivy.encryptNote(
  "Payment for services",
  ephemeral.privateKey,
  receiverMetaViewPub
);

// Send payment
await submitPayment(stealthAddress, amount, encryptedNote);
```

**Receiver:**

```javascript
// Scan blockchain
const payment = await scanForPayments();

// Decrypt note
const note = await pivy.decryptNote(
  payment.encryptedNote,
  payment.ephemeralPubkey,
  metaViewPriv
);

// Derive stealth private key
const stealthKP = await pivy.deriveStealthKeypair(
  metaSpendPriv,
  metaViewPriv,
  payment.ephemeralPubkey
);

// Withdraw funds
await withdraw(stealthKP, yourMainWallet, amount);
```

### IOTA Address Derivation

Converting secp256k1 public keys to IOTA addresses:

```javascript
secp256k1PointToIotaAddress(compressed33) {
  // Convert to uncompressed (65 bytes)
  const pt = secp.Point.fromHex(compressed33);
  const uncompressed65 = pt.toRawBytes(false); // 0x04 || X(32) || Y(32)

  // Build AnyPublicKey bytes
  const anyPublicKeyBytes = new Uint8Array(67);
  anyPublicKeyBytes[0] = 0x01;  // Secp256k1 variant
  anyPublicKeyBytes[1] = 0x41;  // Length = 65
  anyPublicKeyBytes.set(uncompressed65, 2);

  // Append SingleKey scheme
  const authKeyInput = new Uint8Array(68);
  authKeyInput.set(anyPublicKeyBytes, 0);
  authKeyInput[67] = 0x02;  // SingleKey scheme

  // Hash to get address
  const authKey = blake2b(authKeyInput, null, 32);
  return '0x' + Buffer.from(authKey).toString('hex');
}
```

IOTA uses Blake2b-256 for address derivation:

```
AuthenticationKey = Blake2b-256(
  0x01 ||                 // Secp256k1 variant
  0x41 ||                 // Length (65)
  uncompressed_pubkey ||  // 65-byte public key
  0x02                    // SingleKey scheme
)
```

---

## Security

### Crypto Stack

| Component | Algorithm | Purpose |
|-----------|-----------|---------|
| Key derivation | HKDF + SHA-256 | Generate deterministic meta keys |
| Key agreement | ECDH (secp256k1) | Derive shared secrets |
| Encryption | ChaCha20-Poly1305 | Authenticated encryption |
| Hashing | SHA-256, Blake2b-256 | Keys, addresses |
| Storage | AES-256-GCM + PBKDF2 | Encrypted local storage |

### Attack Resistance

| Attack | Mitigation |
|--------|------------|
| PIN brute force | Rate limited + wallet signature required |
| Wallet compromise | PIN still needed |
| Storage theft | AES-256-GCM encryption |
| Network analysis | Unlinkable stealth addresses |
| MITM | End-to-end encryption |
| Replay attacks | Unique ephemeral keys |
| Key reuse | Domain separation |

### Guarantees

- **Unlinkability**: Payments can't be linked to your identity
- **Forward secrecy**: One compromised payment doesn't affect others
- **Deterministic recovery**: Recover from wallet + PIN
- **No single point of failure**: Distributed trust
- **Quantum resistant**: Can migrate to post-quantum curves

---

## Quick Reference

```bash
# Install
bun install

# Deploy contract
cd packages/pivy-stealth-program-iota
npm run deploy

# Test crypto (no blockchain)
node scripts/full-flow-logic.js

# Test full flow (with blockchain)
PACKAGE_ID="0x..." node scripts/full-flow-integration.js

# Run Move tests
npm run test:move

# Run all tests
npm test

# Start frontend
npm run web

# Start backend
npm run backend
```

### Environment Variables

Create `.env` in `packages/pivy-stealth-program-iota/`:

```env
PACKAGE_ID="0x24772fde2e6bf966350598d38a33e8e1f0ce546ac5d5195f18f2c8502c25e907"
NETWORK="testnet"
```

---

<div align="center">

**Built for IOTA Moveathon Europe Edition**

[Try PIVY](https://iota.pivy.me)

Privacy is not a feature. It's a right.

</div>
