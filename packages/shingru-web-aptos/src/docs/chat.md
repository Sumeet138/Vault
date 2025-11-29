# Enhanced AI Chat Assistant for RWA Integration

## Overview
The enhanced AI chat assistant provides intelligent, database-aware assistance for RWA (Real World Assets) on the Vault platform. The AI combines hardcoded knowledge about Vault functionality with real-time MongoDB data retrieval to provide intelligent responses about asset availability, user portfolios, and purchase guidance.

## Architecture
```
User Query → AI Processing → MongoDB Queries → Real-time Data → Personalized Response
```

## System Prompt Enhancement
The system prompt is dynamically enhanced with real-time MongoDB data before each AI response:

```javascript
const enhancedSystemPrompt = `
You are Vault RWA Assistant, an AI expert on the Vault privacy-first payment platform with RWA tokenization. 
Current asset availability (retrieved from MongoDB):
${assets.map(asset => `${asset.name}: ${asset.availableShares}/${asset.totalShares} shares available at ${asset.pricePerShare} APT per share`).join('\n')}

User ${userId} currently owns: 
${userPortfolio.map(holding => `${holding.quantity} shares of ${holding.assetId} purchased at ${holding.purchasePrice} APT`).join(', ') || 'No RWA investments yet'}

Provide personalized payment links using user's username: https://domain.com/{username}/{assetId}
Handle queries about:
- RWA asset availability and purchases
- User's current RWA portfolio
- Payment link guidance
- Privacy benefits of RWA investments
- Transaction status and history
`
```

## Database Integration Points

### 1. Real-time Asset Queries
- **Function**: `getAssetsFromDB()`
- **Purpose**: Fetch current asset availability before each AI response
- **Usage**: AI can provide accurate share availability: "Bangalore Flag Tower has 7 shares remaining"

### 2. User Portfolio Access
- **Function**: `getUserPortfolioFromDB(userId)`
- **Purpose**: Check user's existing RWA holdings
- **Usage**: AI can provide personalized advice: "You already own 2 shares of the mall, would you like more?"

### 3. Dynamic Payment Link Generation
- **Integration**: AI generates personalized payment links based on user context
- **Format**: `https://domain.com/{username}/{assetname}`
- **Usage**: "To buy Bangalore Flag Tower shares, send payment to: https://vault.com/john/bangalore-flag"

## Advanced AI Capabilities

### 1. Portfolio Questions
- **Query**: "What do I own?"
- **Response**: AI fetches from MongoDB and responds with current holdings

### 2. Investment Guidance
- **Query**: "Which assets are nearly sold out?"
- **Response**: AI analyzes MongoDB data: "Bangalore Flag Tower has 6 of 10 shares remaining (60% sold)"

### 3. Transaction Status
- **Query**: "How many shares do I have?"
- **Response**: AI checks user's portfolio in MongoDB

### 4. Market Updates
- **Query**: "Any new assets?"
- **Response**: AI pulls from MongoDB assets collection

## Technical Implementation

### 1. API Route: /api/ai/chat
```javascript
export async function POST(request) {
  const { message, userId } = await request.json();
  
  // Query MongoDB for real-time data
  const assets = await getAssetsFromDB();
  const userPortfolio = await getUserPortfolioFromDB(userId);
  
  // Enhance system prompt with real data
  const enhancedPrompt = createEnhancedSystemPrompt(assets, userPortfolio, userId);
  
  // Generate AI response with enhanced context
  const aiResponse = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: enhancedPrompt },
      { role: 'user', content: message }
    ],
    model: 'llama3-70b-8192'
  });
  
  return Response.json({ response: aiResponse.choices[0].message.content });
}
```

### 2. MongoDB Integration Functions
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

export async function getAssetById(assetId) {
  return await db.collection('assets').findOne({ assetId });
}
```

## Agentic AI Features

### 1. Intelligent Resource Management
- Dynamically updates share availability based on real-time MongoDB data
- AI "knows" when assets sell out and can redirect to other options

### 2. Personalized Recommendations
- Suggests assets based on user's existing portfolio
- Provides investment advice based on current holdings

### 3. Transaction Awareness
- Tracks user's payment status and purchase history
- Can confirm successful transactions and update portfolio info

### 4. Privacy-Aware Responses
- Explains how stealth addresses protect investment privacy
- Maintains focus on security benefits throughout conversation

## User Experience Flow
```
1. User types: "I want to buy shares in Bangalore property"
2. AI queries MongoDB → sees 7 shares available  
3. AI responds: "The Bangalore Flag Tower has 7 shares available at 100 APT each. 
   Send payment to: https://vault.com/username/bangalore-flag"
4. User makes payment → stealth address system processes
5. MongoDB updates → next AI query shows reduced availability
```

## Benefits
1. **Real-time Intelligence**: AI responds with current data, not static knowledge
2. **Personalization**: Responses tailored to user's current holdings
3. **Market Awareness**: AI knows about availability changes instantly
4. **User Guidance**: Step-by-step purchase assistance
5. **Impressive Demo**: Appears as sophisticated agentic AI assistant
6. **Educational**: Explains RWA concepts in accessible ways

## Demo Scenarios
- **Asset Inquiry**: "What's available to buy?" → AI lists current assets with availability
- **Purchase Guidance**: "How do I buy the mall?" → AI provides payment link and price details
- **Portfolio Check**: "What do I own?" → AI shows user's current RWA portfolio
- **Availability Update**: "How many shares left in Bangalore?" → AI shows real-time availability
- **Investment Advice**: "Should I buy more?" → AI suggests based on portfolio diversification