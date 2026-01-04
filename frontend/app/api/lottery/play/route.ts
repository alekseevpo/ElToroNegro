import { NextRequest, NextResponse } from 'next/server';
import { determinePrize, generateTicketId } from '@/lib/lottery-utils';
import { LOTTERY_TICKET_PRICE } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';

/**
 * API endpoint for playing instant lottery
 * 
 * POST /api/lottery/play
 * Body: { ticketCount: number, userId: string, isFreeTicket?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketCount, userId, isFreeTicket = false } = body;

    // Validate input - ticketCount
    if (typeof ticketCount !== 'number' || !Number.isInteger(ticketCount)) {
      return NextResponse.json(
        { error: 'Invalid ticket count. Must be an integer.' },
        { status: 400 }
      );
    }

    if (ticketCount < 1 || ticketCount > 100) {
      return NextResponse.json(
        { error: 'Invalid ticket count. Must be between 1 and 100.' },
        { status: 400 }
      );
    }

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return NextResponse.json(
        { error: 'User ID is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Sanitize userId (basic protection against injection)
    const sanitizedUserId = userId.trim().substring(0, 200); // Limit length

    // Process tickets and determine prizes
    const results = [];
    let totalPrize = 0;

    try {
      for (let i = 0; i < ticketCount; i++) {
        const ticketId = generateTicketId();
        const prize = determinePrize();
        
        // Validate prize is valid
        if (typeof prize !== 'number' || prize <= 0 || !isFinite(prize)) {
          logger.error('Invalid prize determined', { ticketId, prize });
          throw new Error('Failed to determine valid prize');
        }
        
        totalPrize += prize;

        results.push({
          ticketId,
          prize,
          timestamp: Date.now(),
        });
      }
    } catch (prizeError: unknown) {
      logger.error('Error determining prizes', prizeError);
      return NextResponse.json(
        { error: 'Failed to process lottery tickets. Please try again.' },
        { status: 500 }
      );
    }

    // Calculate total cost (only for paid tickets)
    const totalCost = isFreeTicket ? 0 : ticketCount * LOTTERY_TICKET_PRICE;

    // Log the lottery play
    logger.info('Lottery tickets played', {
      userId: sanitizedUserId,
      ticketCount,
      isFreeTicket,
      totalCost,
      totalPrize,
      results: results.map(r => ({ ticketId: r.ticketId, prize: r.prize })),
    });

    // TODO: Save to database
    // - Record lottery play
    // - Update user balance with prizes
    // - Track statistics

    return NextResponse.json({
      success: true,
      tickets: results,
      totalPrize,
      totalCost,
      isFreeTicket,
    });
  } catch (error: unknown) {
    const { message } = handleError(error);
    logger.error('Error processing lottery tickets', error);
    
    return NextResponse.json(
      { error: message || 'Failed to process lottery tickets' },
      { status: 500 }
    );
  }
}

