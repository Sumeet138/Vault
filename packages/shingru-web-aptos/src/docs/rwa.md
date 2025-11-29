# Real World Assets (RWA) Integration for Vault

## Overview
The RWA integration extends Vault's privacy-first payment platform to tokenize real-world assets. Users can purchase fractional shares of real properties using stealth addresses for private transactions while maintaining self-custody principles.

## Architecture
```
User Wallet → Stealth Address → RWA Purchase → MongoDB Share Tracking
```

## Core Components

### 1. Asset Management
- **Assets Collection**: Stores RWA details (name, location, total shares, price, availability)
- **Sample Assets**: Bangalore Flag Tower, Mumbai Shopping Mall, Delhi Commerce Center
- **Share Tokenization**: Each real asset broken into defined share quantities (10-100 shares)

### 2. Purchase Flow
```
1. User selects asset → AI generates personalized payment link
2. Payment link: `https://domain.com/username/assetname`
3. Payment sent to stealth address for privacy
4. Payment detected → Share deduction in MongoDB
5. User portfolio updated with ownership
```

### 3. MongoDB Schema
```javascript
// Assets Collection
{
  assetId: "unique-identifier",
  name: "Asset Name",
  location: "Geographic location",
  totalShares: 100,
  availableShares: 85,
  pricePerShare: 100, // in APT
  description: "Asset details",
  status: "ACTIVE/SOLD_OUT/DELISTED"
}

// User Holdings Collection  
{
  userId: "user-identifier",
  assetId: "asset-identifier",
  quantity: 2,
  purchasePrice: 100,
  purchaseDate: "timestamp",
  transactionHash: "aptos-tx"
}

// Transactions Collection
{
  assetId: "asset-identifier",
  buyerUserId: "user-identifier",
  quantity: 2,
  totalPrice: 200,
  status: "COMPLETED",
  createdAt: "timestamp"
}
```

### 4. Integration with Existing Infrastructure
- **Stealth Payments**: Uses existing stealth address system for private transactions
- **User Authentication**: Leverages existing wallet-based auth
- **Payment Processing**: Extends existing payment recording API
- **Balance Tracking**: Adds RWA shares alongside APT balances

### 5. MongoDB Connection Configuration
```javascript
// lib/mongodb/rwa.js
import { MongoClient } from 'mongodb';

// Use NEXT_MONGODB_URI from environment variables
const client = new MongoClient(process.env.NEXT_MONGODB_URI);
const db = client.db('vault-rwa');

export async function getAssetsFromDB() {
  return await db.collection('assets').find({ status: 'ACTIVE' }).toArray();
}

export async function getUserPortfolioFromDB(userId) {
  return await db.collection('holdings').find({ userId }).toArray();
}

export async function getTransactionHistory(userId) {
  return await db.collection('transactions').find({ buyerUserId: userId }).toArray();
}
```

## AI Integration
- AI assistant knows all available assets and their real-time availability
- Generates personalized payment links based on user requests
- Provides real-time updates on share availability
- Explains RWA concepts to users

## Key Benefits
1. **Privacy**: Stealth addresses keep investment amounts private
2. **Accessibility**: Fractional shares make expensive assets accessible
3. **Transparency**: Real-time availability tracking
4. **Security**: Self-custody maintained throughout
5. **User Experience**: AI assistant simplifies complex RWA process

## API Endpoints
- `POST /api/rwa/purchase` - Process completed RWA purchases
- `GET /api/rwa/assets` - Retrieve available assets  
- `GET /api/rwa/portfolio` - Get user's RWA holdings
- `GET /api/rwa/transactions` - Get user transaction history

## Implementation Flow
1. User navigates to `/app/rwa` in sidebar
2. Browse available assets with real-time availability
3. Click "Buy Share" generates personalized payment link
4. AI assistant provides context and guidance
5. Payment processed via stealth address
6. MongoDB updated with share deduction and user ownership
7. User dashboard reflects new RWA holdings