# How to Seed RWA Database

The RWA database needs to be seeded with initial assets. There are two ways to do this:

## Method 1: Automatic Seeding (Recommended)

The database will automatically seed when you:
1. Visit the RWA page at `/app/rwa` in your browser
2. Or call the assets API endpoint: `GET /api/rwa/assets`

The seeding is **idempotent** - it won't create duplicates if assets already exist.

## Method 2: Manual Seeding via API

You can manually trigger seeding by calling:

```bash
# Check if database needs seeding
curl http://localhost:3000/api/rwa/seed

# Seed the database
curl -X POST http://localhost:3000/api/rwa/seed
```

## Method 3: Direct Database Call (For Development)

If you have direct access to your MongoDB, you can also seed it programmatically:

```typescript
import { seedInitialAssets } from '@/lib/mongodb/rwa';

// In a Next.js API route or server component
await seedInitialAssets();
```

## What Gets Seeded

The following 3 assets will be created:

1. **Bangalore Flag Tower**
   - Location: Bangalore, India
   - Total Shares: 100
   - Available Shares: 85
   - Price per Share: 100 APT

2. **Mumbai Shopping Mall**
   - Location: Mumbai, India
   - Total Shares: 50
   - Available Shares: 32
   - Price per Share: 250 APT

3. **Delhi Commerce Center**
   - Location: Delhi, India
   - Total Shares: 75
   - Available Shares: 60
   - Price per Share: 150 APT

## Troubleshooting

If assets don't appear:
1. Check that `NEXT_MONGODB_URI` environment variable is set correctly
2. Verify MongoDB connection is working
3. Check browser console for any errors
4. Try calling the seed endpoint directly: `POST /api/rwa/seed`

