import { NextRequest, NextResponse } from 'next/server';
import { calculateFreeTickets } from '@/lib/lottery-utils';
import { LOTTERY_FREE_TICKET_PER_INVESTMENT } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';

/**
 * API endpoint for awarding free lottery tickets based on investments
 * 
 * POST /api/lottery/free-tickets
 * Body: { userId: string, investmentAmount: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, investmentAmount } = body;

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!investmentAmount || investmentAmount < 0) {
      return NextResponse.json(
        { error: 'Invalid investment amount' },
        { status: 400 }
      );
    }

    // Calculate free tickets
    const freeTickets = calculateFreeTickets(investmentAmount);

    if (freeTickets === 0) {
      return NextResponse.json({
        success: true,
        freeTickets: 0,
        message: 'No free tickets earned (minimum 10€ per ticket)',
      });
    }

    // TODO: Save to database
    // - Update user's free ticket balance
    // - Record the award transaction
    // - Link to investment transaction

    logger.info('Free lottery tickets awarded', {
      userId,
      investmentAmount,
      freeTickets,
    });

    return NextResponse.json({
      success: true,
      freeTickets,
      message: `You earned ${freeTickets} free lottery ticket${freeTickets > 1 ? 's' : ''}!`,
    });
  } catch (error: unknown) {
    const { message } = handleError(error);
    logger.error('Error awarding free lottery tickets', error);
    
    return NextResponse.json(
      { error: message || 'Failed to award free tickets' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lottery/free-tickets?userId=...
 * Get user's current free ticket balance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // TODO: Get from database
    // For now, return 0
    const freeTickets = 0;

    return NextResponse.json({
      success: true,
      freeTickets,
    });
  } catch (error: unknown) {
    const { message } = handleError(error);
    logger.error('Error getting free ticket balance', error);
    
    return NextResponse.json(
      { error: message || 'Failed to get free ticket balance' },
      { status: 500 }
    );
  }
}

