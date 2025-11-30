/**
 * Script to seed RWA database with initial assets
 * Run with: node scripts/seed-rwa.js
 */

// Try to load environment variables from .env.local if dotenv is available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, use environment variables directly
  console.log('ℹ️  Using environment variables directly');
}

const { MongoClient } = require('mongodb');

async function seedDatabase() {
  const uri = process.env.NEXT_MONGODB_URI;
  
  if (!uri) {
    console.error('❌ NEXT_MONGODB_URI environment variable is not set');
    console.error('Please set it in your .env.local file');
    process.exit(1);
  }

  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('vault-rwa');
    const collection = db.collection('assets');

    // Check if assets already exist
    const existing = await collection.countDocuments();
    if (existing > 0) {
      console.log(`ℹ️  Database already has ${existing} assets`);
      const assets = await collection.find({}).toArray();
      console.log('Current assets:');
      assets.forEach(asset => {
        console.log(`  - ${asset.name} (${asset.availableShares}/${asset.totalShares} shares @ ${asset.pricePerShare} APT)`);
      });
      return;
    }

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

    console.log('📦 Inserting assets...');
    const result = await collection.insertMany(sampleAssets);
    console.log(`✅ Successfully seeded ${result.insertedCount} assets:`);
    
    sampleAssets.forEach(asset => {
      console.log(`  ✓ ${asset.name}`);
      console.log(`    Location: ${asset.location}`);
      console.log(`    Shares: ${asset.availableShares}/${asset.totalShares} available`);
      console.log(`    Price: ${asset.pricePerShare} APT per share`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

seedDatabase();

