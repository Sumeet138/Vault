import { NextRequest, NextResponse } from 'next/server';

/**
 * Force seed endpoint - seeds database regardless of existing assets
 * POST /api/rwa/seed-now
 */
export async function POST(request: NextRequest) {
  let client: any = null;
  
  try {
    const uri = process.env.NEXT_MONGODB_URI;
    
    if (!uri) {
      return NextResponse.json(
        {
          success: false,
          error: 'NEXT_MONGODB_URI environment variable is not set. Please add it to your .env.local file.',
          hint: 'Format: mongodb://username:password@host:port/database or mongodb+srv://username:password@cluster.mongodb.net/database',
        },
        { status: 500 }
      );
    }

    // Direct seeding with better error handling
    const { MongoClient } = await import('mongodb');
    
    try {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      
      await client.connect();
      console.log('✅ Connected to MongoDB');
      
      // Test connection
      await client.db('admin').command({ ping: 1 });
      
      const db = client.db('vault-rwa');
      const collection = db.collection('assets');

      const sampleAssets = [
        // Mumbai Assets
        {
          assetId: 'mumbai-phoenix-mall',
          name: 'Phoenix Marketcity Mumbai',
          location: 'Mumbai, Maharashtra',
          totalShares: 80,
          availableShares: 45,
          pricePerShare: 0.0024,
          description: 'Premium shopping mall in Kurla with 200+ retail outlets, multiplex, and food court. High footfall and established brand presence.',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Pune Assets
        {
          assetId: 'pune-phoenix-mall',
          name: 'Phoenix Marketcity Pune',
          location: 'Pune, Maharashtra',
          totalShares: 90,
          availableShares: 55,
          pricePerShare: 0.0015,
          description: 'Large format shopping mall in Viman Nagar with 300+ stores, entertainment zones, and dining options. Growing IT hub location.',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Original Assets (keeping for diversity)
        {
          assetId: 'bangalore-flag-tower',
          name: 'Bangalore Flag Tower',
          location: 'Bangalore, Karnataka',
          totalShares: 100,
          availableShares: 85,
          pricePerShare: 0.0008,
          description: 'Premium commercial property in the heart of Bangalore with high rental yields and excellent appreciation potential.',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Clear existing and insert
      await collection.deleteMany({});
      const result = await collection.insertMany(sampleAssets);
      console.log(`✅ Inserted ${result.insertedCount} assets`);
      
      // Fetch to verify
      const assets = await collection.find({}).toArray();
      
      await client.close();
      client = null;

      return NextResponse.json({
        success: true,
        message: `Successfully seeded ${assets.length} assets`,
        assets: assets.map((a: any) => ({
          name: a.name,
          location: a.location,
          availableShares: a.availableShares,
          totalShares: a.totalShares,
          pricePerShare: a.pricePerShare,
        })),
      });
    } catch (dbError: any) {
      if (client) {
        await client.close().catch(() => {});
        client = null;
      }
      
      // Better error messages
      let errorMessage = 'Failed to seed database';
      if (dbError.message?.includes('authentication failed') || dbError.message?.includes('bad auth')) {
        errorMessage = 'MongoDB authentication failed. Please check your username and password in the connection string.';
      } else if (dbError.message?.includes('ENOTFOUND') || dbError.message?.includes('getaddrinfo')) {
        errorMessage = 'Cannot reach MongoDB server. Please check your connection string host.';
      } else if (dbError.message?.includes('timeout')) {
        errorMessage = 'Connection to MongoDB timed out. Please check your network and connection string.';
      } else {
        errorMessage = dbError.message || 'Unknown database error';
      }
      
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          hint: 'Make sure your NEXT_MONGODB_URI is correct. Format: mongodb://username:password@host:port/database or mongodb+srv://username:password@cluster.mongodb.net/database',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    if (client) {
      await client.close().catch(() => {});
    }
    
    console.error('Error seeding database:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed database',
      },
      { status: 500 }
    );
  }
}
