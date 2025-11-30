import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { aiPrompt } from '@/ai/aiPrompt';
import { 
  getAssetsFromDB, 
  getUserPortfolioFromDB,
  getAssetById
} from '@/lib/mongodb/rwa';

// Initialize Groq client (server-side only)
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
});

/**
 * Detect if user message mentions a specific asset
 */
function detectMentionedAsset(message: string, assets: any[]): any | null {
  const lowerMessage = message.toLowerCase();
  
  // Check for asset names, IDs, or locations
  for (const asset of assets) {
    const assetNameLower = asset.name.toLowerCase();
    const assetIdLower = asset.assetId.toLowerCase();
    const locationLower = asset.location.toLowerCase();
    
    // Check if message contains asset name, ID, or location
    if (
      lowerMessage.includes(assetNameLower) ||
      lowerMessage.includes(assetIdLower) ||
      lowerMessage.includes(locationLower) ||
      // Check for partial matches (e.g., "mumbai mall" matches "Phoenix Marketcity Mumbai")
      assetNameLower.split(' ').some(word => word.length > 3 && lowerMessage.includes(word)) ||
      locationLower.split(',').some(part => part.trim().length > 3 && lowerMessage.includes(part.trim().toLowerCase()))
    ) {
      return asset;
    }
  }
  
  return null;
}

/**
 * Create enhanced system prompt with real-time MongoDB data
 */
async function createEnhancedSystemPrompt(
  assets: any[],
  userPortfolio: any[],
  userId: string | null,
  username: string | null
): Promise<string> {
  const basePrompt = aiPrompt;
  
  // Build asset availability section
  let assetAvailabilitySection = '';
  if (assets.length > 0) {
    assetAvailabilitySection = '\n\n**Current RWA Asset Availability (Real-time from MongoDB):**\n';
    assets.forEach(asset => {
      const percentageSold = ((asset.totalShares - asset.availableShares) / asset.totalShares * 100).toFixed(1);
      assetAvailabilitySection += `- **${asset.name}** (${asset.location}): ${asset.availableShares}/${asset.totalShares} shares available at ${asset.pricePerShare} APT per share (${percentageSold}% sold)\n`;
      assetAvailabilitySection += `  - Asset ID: ${asset.assetId}\n`;
      assetAvailabilitySection += `  - Status: ${asset.status}\n`;
    });
  } else {
    assetAvailabilitySection = '\n\n**Current RWA Asset Availability:** No assets currently available.';
  }

  // Build user portfolio section
  let portfolioSection = '';
  if (userId && userPortfolio.length > 0) {
    portfolioSection = '\n\n**User Portfolio (Real-time from MongoDB):**\n';
    // Get asset names for better display
    const portfolioWithNames = await Promise.all(
      userPortfolio.map(async (holding) => {
        const asset = await getAssetById(holding.assetId);
        return {
          ...holding,
          assetName: asset?.name || holding.assetId,
        };
      })
    );
    
    portfolioWithNames.forEach(holding => {
      portfolioSection += `- ${holding.quantity} shares of **${holding.assetName}** (${holding.assetId}) purchased at ${holding.purchasePrice} APT per share\n`;
    });
    const totalShares = userPortfolio.reduce((sum, h) => sum + h.quantity, 0);
    portfolioSection += `\nTotal holdings: ${totalShares} shares across ${userPortfolio.length} asset(s)`;
  } else if (userId) {
    portfolioSection = '\n\n**User Portfolio:** User has no RWA investments yet.';
  }

  // Build payment link guidance
  let paymentLinkSection = '';
  if (username) {
    paymentLinkSection = `\n\n**Payment Link Format:**\n`;
    paymentLinkSection += `- For RWA purchases: https://vault.com/${username}/{assetId}\n`;
    paymentLinkSection += `- Example: https://vault.com/${username}/mumbai-phoenix-mall\n`;
    paymentLinkSection += `- Always use the user's actual username: ${username}`;
  }

  // Enhanced instructions
  const enhancedInstructions = `
**IMPORTANT - Real-time Data Usage:**
- The asset availability data above is fetched from MongoDB in real-time before each response
- Always use the current availability numbers when answering questions about assets
- When generating payment links, use the format: https://vault.com/{username}/{assetId}
- If user asks about their portfolio, use the portfolio data shown above
- If user asks "what do I own?" or "show my portfolio", list their holdings from the portfolio section
- If user asks about asset availability, use the exact numbers from the asset availability section
- Always provide accurate, up-to-date information based on the MongoDB data shown above
`;

  return `${basePrompt}${assetAvailabilitySection}${portfolioSection}${paymentLinkSection}${enhancedInstructions}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, username } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY && !process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      return NextResponse.json(
        { 
          error: 'AI service not configured',
          message: 'Please set GROQ_API_KEY or NEXT_PUBLIC_GROQ_API_KEY environment variable'
        },
        { status: 500 }
      );
    }

    // Query MongoDB for real-time RWA data
    let assets: any[] = [];
    let userPortfolio: any[] = [];
    
    try {
      assets = await getAssetsFromDB();
    } catch (error) {
      console.error('Error fetching assets from MongoDB:', error);
      // Continue without assets data
    }

    try {
      if (userId) {
        userPortfolio = await getUserPortfolioFromDB(userId);
      }
    } catch (error) {
      console.error('Error fetching user portfolio from MongoDB:', error);
      // Continue without portfolio data
    }

    // Create enhanced system prompt with real-time data
    const enhancedPrompt = await createEnhancedSystemPrompt(
      assets,
      userPortfolio,
      userId || null,
      username || null
    );

    // Detect if user is asking about a specific asset
    const mentionedAsset = detectMentionedAsset(message, assets);
    
    // Generate AI response with enhanced context
    try {
      // Limit response length when asset is mentioned - show card instead
      const maxTokens = mentionedAsset ? 500 : 2000;
      
      const completion = await groqClient.chat.completions.create({
        messages: [
          { role: 'system', content: enhancedPrompt + (mentionedAsset ? '\n\nIMPORTANT: User is asking about a specific asset. Keep your response brief (under 100 words) and focus on key details. The asset card will be shown separately.' : '') },
          { role: 'user', content: message }
        ],
        model: 'llama-3.1-70b-versatile', // Using the more capable model for better responses
        temperature: 0.7,
        max_tokens: maxTokens,
        top_p: 0.9,
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

      return NextResponse.json({ 
        response,
        // Include asset data if mentioned
        asset: mentionedAsset || null,
        // Include metadata for debugging (optional)
        metadata: {
          assetsCount: assets.length,
          portfolioCount: userPortfolio.length,
          hasUserId: !!userId,
          mentionedAsset: mentionedAsset?.assetId || null,
        }
      });
    } catch (groqError: any) {
      console.error('Groq API error:', groqError);
      return NextResponse.json(
        { 
          error: 'AI service error',
          message: groqError?.message || 'Failed to generate AI response'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in AI chat API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

