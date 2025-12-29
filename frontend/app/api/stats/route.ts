import { NextResponse } from 'next/server';
import { getPlatformStats } from '@/lib/db-profile-utils';

/**
 * API Route for platform statistics
 */
export async function GET() {
  try {
    const stats = await getPlatformStats();

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        activeToday: 0,
        onlineNow: 0,
        totalRegistrations: 0,
      },
      { status: 500 }
    );
  }
}

