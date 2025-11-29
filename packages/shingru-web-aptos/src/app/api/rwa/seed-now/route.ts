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
        {
          assetId: 'bangalore-flag-tower',
          name: 'Bangalore Flag Tower',
          location: 'Bangalore, India',
          totalShares: 100,
          availableShares: 85,
          pricePerShare: 100,
          description: 'Premium commercial property in the heart of Bangalore with high rental yields and excellent appreciation potential.',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          assetId: 'mumbai-shopping-mall',
          name: 'Mumbai Shopping Mall',
          location: 'Mumbai, India',
          totalShares: 50,
          availableShares: 32,
          pricePerShare: 250,
          description: 'Prime retail space in Mumbai with established tenants and consistent revenue streams.',
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
          pricePerShare: 150,
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
