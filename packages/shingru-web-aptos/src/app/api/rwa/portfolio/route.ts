import { NextRequest, NextResponse } from 'next/server';
import { getUserPortfolioFromDB } from '@/lib/mongodb/rwa';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        },
        { status: 400 }
      );
    }
    
    const portfolio = await getUserPortfolioFromDB(userId);
    
    return NextResponse.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    console.error('Error fetching user portfolio:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch portfolio',
      },
      { status: 500 }
    );
  }
}

