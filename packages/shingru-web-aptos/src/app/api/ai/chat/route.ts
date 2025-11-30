import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { aiPrompt } from '@/ai/aiPrompt';
import { 
  getAssetsFromDB, 
  getUserPortfolioFromDB,
  getAssetById
} from '@/lib/mongodb/rwa';

// Initialize Groq client (server-side only)
const groqApiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';

if (!groqApiKey) {
  console.warn('⚠️ GROQ_API_KEY or NEXT_PUBLIC_GROQ_API_KEY not found in environment variables');
}

const groqClient = groqApiKey ? new Groq({
  apiKey: groqApiKey,
}) : null;

/**
 * Hardcoded sample assets (fallback when MongoDB is unavailable)
 * These match the assets in src/app/api/rwa/seed-now/route.ts
 */
const HARDCODED_SAMPLE_ASSETS = [
  {
    assetId: 'mumbai-phoenix-mall',
    name: 'Phoenix Marketcity Mumbai',
    location: 'Mumbai, Maharashtra',
    totalShares: 80,
    availableShares: 45,
    pricePerShare: 0.0024,
    description: 'Premium shopping mall in Kurla with 200+ retail outlets, multiplex, and food court. High footfall and established brand presence.',
    status: 'ACTIVE',
  },
  {
    assetId: 'mumbai-oberoi-showroom',
    name: 'Oberoi Mall Showroom Complex',
    location: 'Mumbai, Maharashtra',
    totalShares: 60,
    availableShares: 28,
    pricePerShare: 0.0018,
    description: 'Luxury showroom complex in Goregaon with premium automotive and lifestyle brands. Prime location with excellent visibility.',
    status: 'ACTIVE',
  },
  {
    assetId: 'mumbai-juhu-villa',
    name: 'Juhu Beachfront Villa',
    location: 'Mumbai, Maharashtra',
    totalShares: 40,
    availableShares: 15,
    pricePerShare: 0.0032,
    description: 'Luxury beachfront villa in Juhu with 5 bedrooms, private pool, and direct beach access. High-end rental potential.',
    status: 'ACTIVE',
  },
  {
    assetId: 'mumbai-bandra-land',
    name: 'Bandra Commercial Land',
    location: 'Mumbai, Maharashtra',
    totalShares: 100,
    availableShares: 72,
    pricePerShare: 0.0028,
    description: 'Prime commercial land parcel in Bandra West. Approved for mixed-use development with excellent connectivity.',
    status: 'ACTIVE',
  },
  {
    assetId: 'mumbai-palladium-mall',
    name: 'Palladium Mall',
    location: 'Mumbai, Maharashtra',
    totalShares: 70,
    availableShares: 38,
    pricePerShare: 0.0021,
    description: 'High-end luxury mall in Lower Parel with international brands, fine dining, and entertainment. Premium location.',
    status: 'ACTIVE',
  },
  {
    assetId: 'mumbai-worli-showroom',
    name: 'Worli Showroom Hub',
    location: 'Mumbai, Maharashtra',
    totalShares: 50,
    availableShares: 22,
    pricePerShare: 0.0019,
    description: 'Modern showroom complex in Worli with luxury automotive and electronics brands. High-traffic commercial area.',
    status: 'ACTIVE',
  },
  {
    assetId: 'pune-phoenix-mall',
    name: 'Phoenix Marketcity Pune',
    location: 'Pune, Maharashtra',
    totalShares: 90,
    availableShares: 55,
    pricePerShare: 0.0015,
    description: 'Large format shopping mall in Viman Nagar with 300+ stores, entertainment zones, and dining options. Growing IT hub location.',
    status: 'ACTIVE',
  },
  {
    assetId: 'pune-koregaon-showroom',
    name: 'Koregaon Park Showroom',
    location: 'Pune, Maharashtra',
    totalShares: 55,
    availableShares: 30,
    pricePerShare: 0.0016,
    description: 'Premium showroom space in Koregaon Park with luxury brands and high-end retail. Upscale neighborhood with affluent clientele.',
    status: 'ACTIVE',
  },
  {
    assetId: 'pune-baner-villa',
    name: 'Baner Luxury Villa',
    location: 'Pune, Maharashtra',
    totalShares: 45,
    availableShares: 18,
    pricePerShare: 0.0021,
    description: 'Spacious 4-bedroom villa in Baner with modern amenities, garden, and parking. Ideal for high-end rentals or resale.',
    status: 'ACTIVE',
  },
  {
    assetId: 'pune-hinjewadi-land',
    name: 'Hinjewadi IT Park Land',
    location: 'Pune, Maharashtra',
    totalShares: 120,
    availableShares: 85,
    pricePerShare: 0.0012,
    description: 'Commercial land in Hinjewadi IT Park area. Approved for IT/office development. High growth potential with major tech companies nearby.',
    status: 'ACTIVE',
  },
  {
    assetId: 'pune-amanora-mall',
    name: 'Amanora Mall',
    location: 'Pune, Maharashtra',
    totalShares: 75,
    availableShares: 42,
    pricePerShare: 0.0017,
    description: 'Popular shopping destination in Hadapsar with multiplex, food court, and retail stores. Well-established with consistent footfall.',
    status: 'ACTIVE',
  },
  {
    assetId: 'pune-kothrud-showroom',
    name: 'Kothrud Auto Showroom',
    location: 'Pune, Maharashtra',
    totalShares: 65,
    availableShares: 35,
    pricePerShare: 0.0013,
    description: 'Automotive showroom complex in Kothrud with multiple car brands. High visibility location on main road with good accessibility.',
    status: 'ACTIVE',
  },
  {
    assetId: 'pune-wakad-villa',
    name: 'Wakad Premium Villa',
    location: 'Pune, Maharashtra',
    totalShares: 50,
    availableShares: 20,
    pricePerShare: 0.0018,
    description: 'Modern 5-bedroom villa in Wakad with clubhouse access, landscaped gardens, and premium finishes. Growing residential hub.',
    status: 'ACTIVE',
  },
  {
    assetId: 'bangalore-flag-tower',
    name: 'Bangalore Flag Tower',
    location: 'Bangalore, Karnataka',
    totalShares: 100,
    availableShares: 85,
    pricePerShare: 0.0008,
    description: 'Premium commercial property in the heart of Bangalore with high rental yields and excellent appreciation potential.',
    status: 'ACTIVE',
  },
  {
    assetId: 'delhi-commerce-center',
    name: 'Delhi Commerce Center',
    location: 'Delhi, India',
    totalShares: 75,
    availableShares: 60,
    pricePerShare: 0.0011,
    description: 'Modern office complex in Delhi with long-term corporate leases and stable returns.',
    status: 'ACTIVE',
  },
];

/**
 * Detect if user message mentions a city or specific asset
 * Returns array of assets (up to 2) if city is mentioned, or single asset if specific asset is mentioned
 */
function detectMentionedAssets(message: string, assets: any[]): { assets: any[], type: 'city' | 'asset' | 'none' } {
  console.log('🔍 [detectMentionedAssets] Starting detection with message:', message);
  console.log('🔍 [detectMentionedAssets] Total assets available:', assets.length);
  
  const lowerMessage = message.toLowerCase();
  
  // Common Indian cities to detect
  const cities = ['mumbai', 'pune', 'bangalore', 'delhi', 'hyderabad', 'chennai', 'kolkata', 'gurgaon', 'noida'];
  
  // First, check if a city is mentioned
  const mentionedCity = cities.find(city => lowerMessage.includes(city));
  
  if (mentionedCity) {
    console.log('🏙️ [detectMentionedAssets] City detected:', mentionedCity);
    const cityAssets = assets.filter(asset => {
      const locationLower = asset.location.toLowerCase();
      const matches = locationLower.includes(mentionedCity);
      if (matches) {
        console.log('  ✅ Found asset in city:', asset.name, asset.location);
      }
      return matches;
    });
    
    // Return up to 2 assets from that city
    const result = cityAssets.slice(0, 2);
    console.log(`🏙️ [detectMentionedAssets] Returning ${result.length} asset(s) for city ${mentionedCity}:`, result.map(a => a.name));
    return { assets: result, type: 'city' };
  }
  
  // If no city, check for specific asset names, IDs, or locations
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
      assetNameLower.split(' ').some((word: string) => word.length > 3 && lowerMessage.includes(word)) ||
      locationLower.split(',').some((part: string) => part.trim().length > 3 && lowerMessage.includes(part.trim().toLowerCase()))
    ) {
      console.log('🏢 [detectMentionedAssets] Specific asset detected:', asset.name);
      return { assets: [asset], type: 'asset' };
    }
  }
  
  console.log('❌ [detectMentionedAssets] No assets detected');
  return { assets: [], type: 'none' };
}

/**
 * Create enhanced system prompt with real-time MongoDB data
 * Follows the format specified in src/docs/chat.md
 */
async function createEnhancedSystemPrompt(
  assets: any[],
  userPortfolio: any[],
  userId: string | null,
  username: string | null,
  useHardcoded: boolean = false
): Promise<string> {
  console.log('📝 [createEnhancedSystemPrompt] Starting prompt creation...');
  const basePrompt = aiPrompt;
  
  // Use hardcoded assets if MongoDB failed or no assets found
  const assetsToUse = useHardcoded || assets.length === 0 ? HARDCODED_SAMPLE_ASSETS : assets;
  const dataSource = useHardcoded || assets.length === 0 ? 'Hardcoded Sample Assets (MongoDB unavailable)' : 'Real-time from MongoDB';
  
  console.log(`📝 [createEnhancedSystemPrompt] Using ${assetsToUse.length} assets from ${dataSource}`);
  
  // Build asset availability section
  let assetAvailabilitySection = '';
  if (assetsToUse.length > 0) {
    assetAvailabilitySection = `\n\n**Current RWA Asset Availability (${dataSource}):**\n`;
    
    // Group by city for better organization
    const assetsByCity: Record<string, any[]> = {};
    assetsToUse.forEach(asset => {
      const city = asset.location.split(',')[0].trim();
      if (!assetsByCity[city]) {
        assetsByCity[city] = [];
      }
      assetsByCity[city].push(asset);
    });
    
    // Format by city
    Object.keys(assetsByCity).sort().forEach(city => {
      assetAvailabilitySection += `\n**${city}:**\n`;
      assetsByCity[city].forEach(asset => {
        const percentageSold = ((asset.totalShares - asset.availableShares) / asset.totalShares * 100).toFixed(1);
        assetAvailabilitySection += `  - **${asset.name}** (${asset.location}): ${asset.availableShares}/${asset.totalShares} shares available at ${asset.pricePerShare} APT per share (${percentageSold}% sold)\n`;
        assetAvailabilitySection += `    - Asset ID: ${asset.assetId}\n`;
        assetAvailabilitySection += `    - Description: ${asset.description}\n`;
        assetAvailabilitySection += `    - Status: ${asset.status}\n`;
      });
    });
    
    console.log(`📝 [createEnhancedSystemPrompt] Asset section created with ${Object.keys(assetsByCity).length} cities`);
  } else {
    assetAvailabilitySection = '\n\n**Current RWA Asset Availability:** No assets currently available.';
    console.log('⚠️ [createEnhancedSystemPrompt] No assets available');
  }

  // Build user portfolio section
  let portfolioSection = '';
  if (userId && userPortfolio.length > 0) {
    console.log(`📝 [createEnhancedSystemPrompt] Building portfolio section for ${userPortfolio.length} holdings`);
    portfolioSection = '\n\n**User Portfolio (Real-time from MongoDB):**\n';
    // Get asset names for better display (as per docs)
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
    console.log(`📝 [createEnhancedSystemPrompt] Portfolio section created`);
  } else if (userId) {
    portfolioSection = '\n\n**User Portfolio:** User has no RWA investments yet.';
  }

  // Build payment link guidance
  let paymentLinkSection = '';
  if (username) {
    paymentLinkSection = `\n\n**Payment Link Format:**\n`;
    paymentLinkSection += `- For RWA purchases: https://vault.com/${username}/{assetId}\n`;
    paymentLinkSection += `- Example: https://vault.com/${username}/bangalore-flag-tower\n`;
    paymentLinkSection += `- Always use the user's actual username: ${username}`;
  }

  // Enhanced instructions (as per docs)
  const enhancedInstructions = `
**IMPORTANT - Real-time Data Usage:**
- The asset availability data above is fetched from MongoDB in real-time before each response (or uses hardcoded sample assets if MongoDB is unavailable)
- **ALWAYS use the exact assets listed above** - these are the ONLY available RWA properties on Vault
- When a user asks about RWA properties, assets, or investments, you MUST reference the specific assets listed in the asset availability section above
- When generating payment links, use the format: https://vault.com/{username}/{assetId}
- If user asks about their portfolio, use the portfolio data shown above
- If user asks "what do I own?" or "show my portfolio", list their holdings from the portfolio section
- If user asks about asset availability, use the exact numbers from the asset availability section

**CITY-BASED QUERIES (CRITICAL):**
- If user asks about properties in a specific city (e.g., "Pune", "Mumbai", "properties in Pune"), you MUST:
  1. Check the asset availability section above for assets in that city
  2. If assets exist in that city: Provide basic info about the properties and mention that asset cards will be shown (up to 2 cards max)
  3. If NO assets exist in that city: Tell the user that city is not in our database and recommend assets from other available cities
- **NEVER say a city is not available if assets exist in the asset availability section above**
- **NEVER say that Vault doesn't provide a list of RWA properties** - the list is shown above
- Always provide accurate, up-to-date information based on the data shown above
`;

  return `${basePrompt}${assetAvailabilitySection}${portfolioSection}${paymentLinkSection}${enhancedInstructions}`;
}

export async function POST(request: NextRequest) {
  console.log('📥 [POST /api/ai/chat] Request received');
  
  try {
    const body = await request.json();
    const { message, userId, username, conversationHistory } = body;
    
    console.log('📥 [POST] Request body:', { 
      messageLength: message?.length, 
      hasUserId: !!userId, 
      username: username || 'none',
      conversationHistoryLength: conversationHistory?.length || 0
    });

    if (!message || typeof message !== 'string') {
      console.error('❌ [POST] Invalid message format');
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if Groq API key is configured
    if (!groqApiKey || !groqClient) {
      console.error('❌ [POST] Groq API key not configured');
      return NextResponse.json(
        { 
          error: 'AI service not configured',
          message: 'Please set GROQ_API_KEY or NEXT_PUBLIC_GROQ_API_KEY environment variable'
        },
        { status: 500 }
      );
    }

    console.log('✅ [POST] Groq client initialized');

    // Query MongoDB for real-time RWA data
    let assets: any[] = [];
    let userPortfolio: any[] = [];
    let mongoDbFailed = false;
    
    console.log('🔍 [POST] Fetching assets from MongoDB...');
    try {
      assets = await getAssetsFromDB();
      console.log(`✅ [POST] Fetched ${assets.length} assets from MongoDB`);
      if (assets.length > 0) {
        console.log('📋 [POST] Sample assets:', assets.slice(0, 3).map(a => ({ name: a.name, location: a.location })));
      }
    } catch (error) {
      console.error('❌ [POST] Error fetching assets from MongoDB:', error);
      mongoDbFailed = true;
      // Will use hardcoded assets as fallback
    }

    console.log('🔍 [POST] Fetching user portfolio...');
    try {
      if (userId) {
        userPortfolio = await getUserPortfolioFromDB(userId);
        console.log(`✅ [POST] Fetched ${userPortfolio.length} portfolio items for user ${userId}`);
      } else {
        console.log('ℹ️ [POST] No userId provided, skipping portfolio fetch');
      }
    } catch (error) {
      console.error('❌ [POST] Error fetching user portfolio from MongoDB:', error);
      // Continue without portfolio data
    }

    // Use hardcoded assets if MongoDB failed or no assets found
    const assetsToUse = mongoDbFailed || assets.length === 0 ? HARDCODED_SAMPLE_ASSETS : assets;
    console.log(`📊 [POST] Using ${assetsToUse.length} assets (${mongoDbFailed || assets.length === 0 ? 'HARDCODED' : 'MongoDB'})`);
    
    // Log city distribution
    const citiesInAssets = new Set(assetsToUse.map(a => a.location.split(',')[0].trim()));
    console.log('🏙️ [POST] Cities available:', Array.from(citiesInAssets));

    // Create enhanced system prompt with real-time data or hardcoded fallback
    console.log('📝 [POST] Creating enhanced system prompt...');
    const enhancedPrompt = await createEnhancedSystemPrompt(
      assets,
      userPortfolio,
      userId || null,
      username || null,
      mongoDbFailed || assets.length === 0
    );
    console.log(`✅ [POST] System prompt created (${enhancedPrompt.length} chars)`);

    // Detect if user is asking about a city or specific asset
    console.log('🔍 [POST] Detecting mentioned assets/cities...');
    const detectionResult = detectMentionedAssets(message, assetsToUse);
    const { assets: detectedAssets, type: detectionType } = detectionResult;
    
    console.log(`🎯 [POST] Detection result:`, {
      type: detectionType,
      count: detectedAssets.length,
      assets: detectedAssets.map(a => ({ name: a.name, location: a.location }))
    });
    
    // Generate AI response with enhanced context
    try {
      // Limit response length when assets are mentioned - show cards instead
      const maxTokens = detectedAssets.length > 0 ? 300 : 2000;
      
      // Build additional instruction based on detection type
      let additionalInstruction = '';
      if (detectionType === 'city') {
        if (detectedAssets.length > 0) {
          additionalInstruction = `\n\nIMPORTANT: User is asking about properties in a city. You found ${detectedAssets.length} asset(s) in that city. Provide basic info about the properties and mention that asset cards will be shown. Keep your response brief (under 150 words).`;
        } else {
          // This shouldn't happen if detection works correctly, but handle it
          additionalInstruction = `\n\nIMPORTANT: User asked about a city, but no assets were found in that city. Tell them the city is not in our database and recommend assets from other available cities.`;
        }
      } else if (detectionType === 'asset') {
        additionalInstruction = `\n\nIMPORTANT: User is asking about a specific asset. Keep your response brief (under 100 words) and focus on key details. The asset card will be shown separately.`;
      }
      
      console.log('🤖 [POST] Calling Groq API...');
      if (!groqClient) {
        throw new Error('Groq client not initialized');
      }
      
      // Build messages array with conversation history
      const groqMessages: any[] = [
        { 
          role: 'system', 
          content: enhancedPrompt + additionalInstruction
        }
      ];
      
      // Add conversation history if provided (for context awareness)
      if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        console.log(`💬 [POST] Adding ${conversationHistory.length} messages from conversation history`);
        groqMessages.push(...conversationHistory);
      }
      
      // Add current user message
      groqMessages.push({ role: 'user', content: message });
      
      console.log(`💬 [POST] Total messages to Groq: ${groqMessages.length} (1 system + ${conversationHistory?.length || 0} history + 1 current)`);
      
      const completion = await groqClient.chat.completions.create({
        messages: groqMessages,
        model: 'moonshotai/kimi-k2-instruct-0905',
        temperature: 0.6,
        max_completion_tokens: maxTokens > 4096 ? 4096 : maxTokens, // Moonshot model supports up to 4096
        top_p: 1,
        stream: false, // Set to false for non-streaming responses
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
      console.log(`✅ [POST] Groq response received (${response.length} chars)`);

      // Return assets array (for card rendering) - chatbot expects 'assets' array
      // Limit to 2 assets max for city queries
      const assetsToReturn = detectedAssets.slice(0, 2);
      
      // Properly serialize assets for JSON response (handle Date objects and ensure all fields)
      const serializedAssets = assetsToReturn.map(asset => ({
        assetId: asset.assetId,
        name: asset.name,
        location: asset.location,
        totalShares: asset.totalShares,
        availableShares: asset.availableShares,
        pricePerShare: asset.pricePerShare,
        description: asset.description || '',
        status: asset.status || 'ACTIVE',
        imageUrl: asset.imageUrl || undefined,
        createdAt: asset.createdAt ? (asset.createdAt instanceof Date ? asset.createdAt.toISOString() : asset.createdAt) : undefined,
        updatedAt: asset.updatedAt ? (asset.updatedAt instanceof Date ? asset.updatedAt.toISOString() : asset.updatedAt) : undefined,
      }));
      
      console.log(`📤 [POST] Returning response with ${serializedAssets.length} asset(s)`, {
        assets: serializedAssets.map(a => ({ 
          assetId: a.assetId, 
          name: a.name, 
          location: a.location,
          hasDescription: !!a.description,
          pricePerShare: a.pricePerShare,
          availableShares: a.availableShares,
          totalShares: a.totalShares
        })),
        detectionType
      });

      return NextResponse.json({ 
        response,
        // Include asset data as array for card rendering (matches chatbot expectation)
        assets: serializedAssets,
        // Legacy support - keep asset singular for backward compatibility
        asset: serializedAssets.length > 0 ? serializedAssets[0] : null,
        // Include metadata for debugging
        metadata: {
          assetsCount: assetsToUse.length,
          portfolioCount: userPortfolio.length,
          hasUserId: !!userId,
          detectedAssetsCount: detectedAssets.length,
          detectionType,
          usingHardcodedData: mongoDbFailed || assets.length === 0,
        }
      });
    } catch (groqError: any) {
      console.error('❌ [POST] Groq API error:', {
        message: groqError?.message,
        status: groqError?.status,
        code: groqError?.code
      });
      return NextResponse.json(
        { 
          error: 'AI service error',
          message: groqError?.message || 'Failed to generate AI response'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ [POST] Error in AI chat API:', {
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
