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
    
    await collection.insertMany(sampleAssets);
    console.log(`✅ Seeded ${sampleAssets.length} initial RWA assets`);
  } catch (error) {
    console.error('Error seeding initial assets:', error);
    throw error; // Re-throw so callers can handle it
  }
}

