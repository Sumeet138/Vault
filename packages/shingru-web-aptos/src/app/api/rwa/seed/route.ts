import { NextRequest, NextResponse } from 'next/server';
import { seedInitialAssets } from '@/lib/mongodb/rwa';

/**
 * API endpoint to seed the database with initial RWA assets
 * This can be called manually to populate the database
 * POST /api/rwa/seed - Seeds the database (idempotent - won't duplicate if assets exist)
 */
export async function POST(request: NextRequest) {
  try {
    await seedInitialAssets();
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
    });
  } catch (error) {
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

/**
 * GET endpoint to check if database needs seeding
 */
export async function GET(request: NextRequest) {
  try {
    const { getAssetsFromDB } = await import('@/lib/mongodb/rwa');
    const assets = await getAssetsFromDB();
    
    return NextResponse.json({
      success: true,
      assetCount: assets.length,
      needsSeeding: assets.length === 0,
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check database status',
      },
      { status: 500 }
    );
  }
}

