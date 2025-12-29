import { NextRequest, NextResponse } from 'next/server';
import { getUserProfileFromDB, addTransactionToDB } from '@/lib/db-profile-utils';
import type { Transaction } from '@/lib/profile-utils';

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

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const profile = await getUserProfileFromDB(address);

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
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
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

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['type', 'status', 'amount', 'currency', 'description'];
    for (const field of requiredFields) {
      if (!transactionData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check if profile exists
    const profile = await getUserProfileFromDB(address);
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Create profile first.' },
        { status: 404 }
      );
    }

    const transaction = await addTransactionToDB(address, transactionData);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Failed to add transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error('Error adding transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add transaction' },
      { status: 500 }
    );
  }
}

