import { MongoClient, Db, Collection } from 'mongodb';
import type { Asset, Holding, Transaction } from './rwa-types';

// Re-export types for convenience (but prefer importing from rwa-types in client code)
export type { Asset, Holding, Transaction };

// Module-level connection cache
let client: MongoClient | null = null;
let db: Db | null = null;

// Get MongoDB client
async function getClient(): Promise<MongoClient> {
  if (!client) {
    const uri = process.env.NEXT_MONGODB_URI;
    if (!uri) {
      throw new Error('NEXT_MONGODB_URI environment variable is not set. Please add it to your .env.local file.');
    }
    
    try {
      client = new MongoClient(uri, {
        // Add connection options for better error handling
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      await client.connect();
      // Test the connection
      await client.db('admin').command({ ping: 1 });
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      client = null;
      throw new Error(
        `Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        `Please check your NEXT_MONGODB_URI connection string.`
      );
    }
  }
  return client;
}

// Get database instance
async function getDb(): Promise<Db> {
  if (!db) {
    const client = await getClient();
    db = client.db('vault-rwa');
  }
  return db;
}

// Get collections
async function getAssetsCollection(): Promise<Collection<Asset>> {
  const database = await getDb();
  return database.collection<Asset>('assets');
}

async function getHoldingsCollection(): Promise<Collection<Holding>> {
  const database = await getDb();
  return database.collection<Holding>('holdings');
}

async function getTransactionsCollection(): Promise<Collection<Transaction>> {
  const database = await getDb();
  return database.collection<Transaction>('transactions');
}

// Export collection getters for use in payment processor
export { getTransactionsCollection, getHoldingsCollection };

// Asset functions
export async function getAssetsFromDB(): Promise<Asset[]> {
  try {
    const collection = await getAssetsCollection();
    return await collection.find({ status: 'ACTIVE' }).toArray();
  } catch (error) {
    console.error('Error fetching assets from MongoDB:', error);
    return [];
  }
}

export async function getAssetById(assetId: string): Promise<Asset | null> {
  try {
    const collection = await getAssetsCollection();
    return await collection.findOne({ assetId, status: 'ACTIVE' });
  } catch (error) {
    console.error('Error fetching asset by ID from MongoDB:', error);
    return null;
  }
}

export async function updateAssetShares(
  assetId: string,
  quantity: number
): Promise<boolean> {
  try {
    const collection = await getAssetsCollection();
    const result = await collection.updateOne(
      { assetId },
      { 
        $inc: { availableShares: -quantity },
        $set: { updatedAt: new Date() }
      }
    );
    
    // Check if asset is now sold out
    const asset = await collection.findOne({ assetId });
    if (asset && asset.availableShares <= 0) {
      await collection.updateOne(
        { assetId },
        { $set: { status: 'SOLD_OUT', updatedAt: new Date() } }
      );
    }
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating asset shares:', error);
    return false;
  }
}

// Holdings functions
export async function getUserPortfolioFromDB(userId: string): Promise<Holding[]> {
  try {
    const collection = await getHoldingsCollection();
    return await collection.find({ userId }).toArray();
  } catch (error) {
    console.error('Error fetching user portfolio from MongoDB:', error);
    return [];
  }
}

export async function addHolding(holding: Omit<Holding, '_id'>): Promise<boolean> {
  try {
    const collection = await getHoldingsCollection();
    
    // Check if user already has holdings for this asset
    const existing = await collection.findOne({
      userId: holding.userId,
      assetId: holding.assetId,
    });
    
    if (existing) {
      // Update existing holding
      await collection.updateOne(
        { userId: holding.userId, assetId: holding.assetId },
        {
          $inc: { quantity: holding.quantity },
          $set: {
            purchasePrice: holding.purchasePrice,
            purchaseDate: holding.purchaseDate,
            transactionHash: holding.transactionHash,
          },
        }
      );
    } else {
      // Create new holding
      await collection.insertOne(holding as Holding);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding holding:', error);
    return false;
  }
}

// Transaction functions
export async function getTransactionHistory(
  userId: string
): Promise<Transaction[]> {
  try {
    const collection = await getTransactionsCollection();
    return await collection
      .find({ buyerUserId: userId })
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    console.error('Error fetching transaction history from MongoDB:', error);
    return [];
  }
}

export async function createTransaction(
  transaction: Omit<Transaction, '_id' | 'createdAt'>
): Promise<boolean> {
  try {
    const collection = await getTransactionsCollection();
    await collection.insertOne({
      ...transaction,
      createdAt: new Date(),
    } as Transaction);
    return true;
  } catch (error) {
    console.error('Error creating transaction:', error);
    return false;
  }
}

export async function updateTransactionStatus(
  transactionHash: string,
  status: Transaction['status']
): Promise<boolean> {
  try {
    const collection = await getTransactionsCollection();
    const result = await collection.updateOne(
      { transactionHash },
      { $set: { status } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return false;
  }
}

export async function updateTransactionHash(
  oldTransactionHash: string,
  newTransactionHash: string
): Promise<boolean> {
  try {
    const collection = await getTransactionsCollection();
    const result = await collection.updateOne(
      { transactionHash: oldTransactionHash },
      { $set: { transactionHash: newTransactionHash } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating transaction hash:', error);
    return false;
  }
}

// Seed initial assets (idempotent - won't duplicate if assets exist)
export async function seedInitialAssets(): Promise<void> {
  try {
    const collection = await getAssetsCollection();
    
    // Check if assets already exist
    const existing = await collection.countDocuments();
    if (existing > 0) {
      console.log(`ℹ️ Database already has ${existing} assets, skipping seed`);
      return;
    }
    
    const sampleAssets: Asset[] = [
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
    
    await collection.insertMany(sampleAssets);
    console.log(`✅ Seeded ${sampleAssets.length} initial RWA assets`);
  } catch (error) {
    console.error('Error seeding initial assets:', error);
    throw error; // Re-throw so callers can handle it
  }
}

