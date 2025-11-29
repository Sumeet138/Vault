import { NextRequest, NextResponse } from 'next/server';
import { getAssetsFromDB, seedInitialAssets } from '@/lib/mongodb/rwa';

export async function GET(request: NextRequest) {
  try {
    // Seed initial assets if database is empty (works in all environments)
    // This ensures the database always has assets available
    try {
      await seedInitialAssets();
    } catch (seedError) {
      console.error('Error seeding assets (continuing anyway):', seedError);
      // Continue even if seeding fails - might already be seeded
    }
    
    const assets = await getAssetsFromDB();
    
    // If still no assets after seeding attempt, return helpful error
    if (assets.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No assets found. Please seed the database by visiting /app/rwa/seed',
          data: [],
        },
        { status: 200 } // Return 200 so UI can show the message
      );
    }
    
    return NextResponse.json({
      success: true,
      data: assets,
    });
  } catch (error) {
    console.error('Error fetching RWA assets:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch assets',
        data: [],
      },
      { status: 500 }
    );
  }
}

