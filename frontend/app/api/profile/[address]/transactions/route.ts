import { NextRequest, NextResponse } from 'next/server';
import { getUserProfileFromDB, addTransactionToDB } from '@/lib/db-profile-utils';
import type { Transaction } from '@/lib/profile-utils';
import { addressParamSchema, transactionCreateSchema } from '@/lib/validation-schemas';
import { logger } from '@/lib/logger';

/**
 * GET /api/profile/[address]/transactions
 * Get user transactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as Transaction['type'] | null;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate address
    const validationResult = addressParamSchema.safeParse({ address });
    if (!validationResult.success) {
      logger.warn('Invalid address parameter in transactions GET', { address, errors: validationResult.error.issues });
      return NextResponse.json(
        { error: 'Invalid address format', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedAddress = validationResult.data.address;

    const profile = await getUserProfileFromDB(validatedAddress);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    let transactions = profile.transactions || [];

    // Filter by type if provided
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    // Apply pagination
    const paginatedTransactions = transactions.slice(offset, offset + limit);

    return NextResponse.json({
      transactions: paginatedTransactions,
      total: transactions.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    logger.error('Error fetching transactions', error as Error, { address: params.address });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/[address]/transactions
 * Add a new transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const transactionData = await request.json();

    // Validate address
    const addressValidation = addressParamSchema.safeParse({ address });
    if (!addressValidation.success) {
      logger.warn('Invalid address parameter in transactions POST', { address, errors: addressValidation.error.issues });
      return NextResponse.json(
        { error: 'Invalid address format', details: addressValidation.error.issues },
        { status: 400 }
      );
    }

    // Validate transaction data
    const validationResult = transactionCreateSchema.safeParse(transactionData);
    if (!validationResult.success) {
      logger.warn('Invalid transaction data', { errors: validationResult.error.issues });
      return NextResponse.json(
        { error: 'Invalid transaction data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedAddress = addressValidation.data.address;
    const validatedTransaction = validationResult.data;

    // Check if profile exists
    const profile = await getUserProfileFromDB(validatedAddress);
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Create profile first.' },
        { status: 404 }
      );
    }

    const transaction = await addTransactionToDB(validatedAddress, validatedTransaction);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Failed to add transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error adding transaction', error as Error, { address: params.address });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add transaction' },
      { status: 500 }
    );
  }
}

