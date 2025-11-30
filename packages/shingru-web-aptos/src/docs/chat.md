# Enhanced AI Chat Assistant for RWA Integration

## Overview
The enhanced AI chat assistant provides intelligent, database-aware assistance for RWA (Real World Assets) on the Vault platform. The AI combines hardcoded knowledge about Vault functionality with real-time MongoDB data retrieval to provide intelligent responses about asset availability, user portfolios, and purchase guidance.

## Architecture
```
User Query → Conversation History → City/Asset Detection → MongoDB Queries → 
Enhanced System Prompt → AI Processing (with context) → Serialized Asset Cards → 
UI Rendering (Asset Cards + Purchase Modal)
```

## System Prompt Enhancement
The system prompt is dynamically enhanced with real-time MongoDB data before each AI response:

```javascript
const enhancedSystemPrompt = `
You are Agentic Trading, an intelligent AI trading assistant specializing in Real World Assets (RWA) on the Vault privacy-first payment platform. 
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

### 1. City-Based Property Queries (Primary Feature)
- **Query**: "RWA properties in Pune" or "properties in Pune city"
- **Detection**: System detects city mention and searches assets by location
- **Response Flow**:
  - If assets found: AI provides basic info + up to 2 asset cards displayed
  - If no assets: AI informs city not in database + recommends other cities
- **Supported Cities**: Mumbai, Pune, Bangalore, Delhi, Hyderabad, Chennai, Kolkata, etc.

### 2. Specific Asset Queries
- **Query**: "Tell me about Phoenix Marketcity Mumbai" or "Bangalore Flag Tower"
- **Detection**: System matches asset name, ID, or location
- **Response**: Brief info + 1 asset card displayed

### 3. Portfolio Questions
- **Query**: "What do I own?"
- **Response**: AI fetches from MongoDB and responds with current holdings

### 4. Investment Guidance
- **Query**: "Which assets are nearly sold out?"
- **Response**: AI analyzes MongoDB data: "Bangalore Flag Tower has 6 of 10 shares remaining (60% sold)"

### 5. Transaction Status
- **Query**: "How many shares do I have?"
- **Response**: AI checks user's portfolio in MongoDB

### 6. Market Updates
- **Query**: "Any new assets?"
- **Response**: AI pulls from MongoDB assets collection

## Technical Implementation

### 1. API Route: /api/ai/chat
```javascript
export async function POST(request) {
  const { message, userId, username, conversationHistory } = await request.json();
  
  // Query MongoDB for real-time data
  const assets = await getAssetsFromDB();
  const userPortfolio = await getUserPortfolioFromDB(userId);
  
  // Enhance system prompt with real data
  const enhancedPrompt = await createEnhancedSystemPrompt(assets, userPortfolio, userId, username);
  
  // Detect mentioned assets/cities
  const { assets: detectedAssets, type: detectionType } = detectMentionedAssets(message, assets);
  
  // Generate AI response with enhanced context and conversation history
  const groqMessages = [
    { role: 'system', content: enhancedPrompt },
    ...(conversationHistory || []), // Include conversation history for context
    { role: 'user', content: message }
  ];
  
  const aiResponse = await groqClient.chat.completions.create({
    messages: groqMessages,
    model: 'moonshotai/kimi-k2-instruct-0905',
    temperature: 0.6,
    max_completion_tokens: 4096,
    top_p: 1,
    stream: false,
  });
  
  // Serialize assets properly (handle Date objects)
  const serializedAssets = detectedAssets.slice(0, 2).map(asset => ({
    assetId: asset.assetId,
    name: asset.name,
    location: asset.location,
    totalShares: asset.totalShares,
    availableShares: asset.availableShares,
    pricePerShare: asset.pricePerShare,
    description: asset.description || '',
    status: asset.status || 'ACTIVE',
  }));
  
  return Response.json({ 
    response: aiResponse.choices[0].message.content,
    assets: serializedAssets, // Array of assets for card rendering
    metadata: { detectionType, assetsCount: assets.length }
  });
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

### City-Based Query Flow (Primary Flow)
```
1. User opens chat → asks about RWA properties in a city (e.g., "properties in Pune")
2. System detects city mention → searches assets in that city
3. If assets found in city:
   - AI provides basic info about properties in that city
   - Up to 2 asset cards are displayed automatically
   - User can click on cards to purchase
4. If NO assets found in city:
   - AI tells user the city is not in our database
   - AI recommends assets from other available cities
   - No asset cards shown
```

### Specific Asset Query Flow
```
1. User types: "I want to buy shares in Bangalore Flag Tower"
2. System detects specific asset → finds matching asset
3. AI responds with brief info + 1 asset card displayed
4. User clicks card → purchase modal opens
```

### General Query Flow
```
1. User types: "What RWA properties are available?"
2. AI queries MongoDB → lists all available assets
3. AI provides overview of all properties
4. No asset cards shown (too many to display)
```

## Benefits
1. **Real-time Intelligence**: AI responds with current data, not static knowledge
2. **Personalization**: Responses tailored to user's current holdings
3. **Market Awareness**: AI knows about availability changes instantly
4. **User Guidance**: Step-by-step purchase assistance
5. **Impressive Demo**: Appears as sophisticated agentic AI assistant
6. **Educational**: Explains RWA concepts in accessible ways

## Demo Scenarios

### City-Based Queries
- **City Query (Assets Found)**: "RWA properties in Pune" → AI shows basic info + up to 2 Pune asset cards
- **City Query (No Assets)**: "RWA properties in Kolkata" → AI says city not in database + recommends Mumbai/Pune/Bangalore assets
- **City Query (Partial Match)**: "properties in Mumbai" → AI shows Mumbai assets with cards

### Specific Asset Queries
- **Asset Inquiry**: "What's available to buy?" → AI lists current assets with availability
- **Specific Asset**: "Tell me about Phoenix Marketcity Pune" → AI shows brief info + 1 asset card
- **Purchase Guidance**: "How do I buy the mall?" → AI provides payment link and price details

### Portfolio & General Queries
- **Portfolio Check**: "What do I own?" → AI shows user's current RWA portfolio
- **Availability Update**: "How many shares left in Bangalore?" → AI shows real-time availability
- **Investment Advice**: "Should I buy more?" → AI suggests based on portfolio diversification

## Asset Card Display Rules

1. **City Queries**: Maximum 2 asset cards displayed (first 2 matches)
2. **Specific Asset Queries**: 1 asset card displayed
3. **General Queries**: No asset cards (too many to display)
4. **No Match Queries**: No asset cards + recommendation message

## Hardcoded Fallback Assets

If MongoDB is unavailable, the system uses hardcoded sample assets from `src/app/api/rwa/seed-now/route.ts`:
- Ensures AI always knows about available properties
- Includes assets from Mumbai, Pune, Bangalore, Delhi
- Same assets that are seeded in the database

## Asset Card Integration

### Asset Serialization
Assets are properly serialized before sending to frontend:
- Date objects converted to ISO strings
- All required fields ensured (assetId, name, location, description, pricePerShare, availableShares, totalShares, status)
- Maximum 2 assets returned for city queries

### Frontend Rendering
- Asset cards render automatically when `assets` array is present in response
- Cards are clickable and open purchase modal
- Purchase modal matches RWA page implementation exactly
- Direct payment flow from chat interface

## Context Awareness

The chatbot maintains conversation context:
- Last 10 messages sent to API for context
- Conversation history included in Groq API calls
- AI remembers previous questions and can reference them
- Enables natural follow-up questions like "what was my previous question"

## Payment Link Generation

When assets are detected:
- Payment links follow format: `https://vault.com/{username}/{assetId}`
- Links are generated in purchase modal
- Same payment flow as RWA page
- Stealth address integration for privacy