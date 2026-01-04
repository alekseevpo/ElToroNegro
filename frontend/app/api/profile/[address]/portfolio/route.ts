import { NextRequest, NextResponse } from 'next/server';
import { getUserProfileFromDB, addAssetToPortfolioInDB } from '@/lib/db-profile-utils';
import { addressParamSchema, portfolioAssetSchema } from '@/lib/validation-schemas';
import { logger } from '@/lib/logger';
import type { PortfolioAsset } from '@/lib/profile-utils';

/**
 * GET /api/profile/[address]/portfolio
 * Get user portfolio
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    // Validate address
    const validationResult = addressParamSchema.safeParse({ address });
    if (!validationResult.success) {
      logger.warn('Invalid address parameter in portfolio GET', { address, errors: validationResult.error.issues });
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

    return NextResponse.json({
      portfolio: profile.portfolio || [],
    });
  } catch (error: unknown) {
    logger.error('Error fetching portfolio', error as Error, { address: params.address });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/[address]/portfolio
 * Add asset to portfolio
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const assetData = await request.json();

    // Validate address
    const addressValidation = addressParamSchema.safeParse({ address });
    if (!addressValidation.success) {
      logger.warn('Invalid address parameter in portfolio POST', { address, errors: addressValidation.error.issues });
      return NextResponse.json(
        { error: 'Invalid address format', details: addressValidation.error.issues },
        { status: 400 }
      );
    }

    // Validate asset data
    const validationResult = portfolioAssetSchema.safeParse(assetData);
    if (!validationResult.success) {
      logger.warn('Invalid portfolio asset data', { errors: validationResult.error.issues });
      return NextResponse.json(
        { error: 'Invalid asset data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedAddress = addressValidation.data.address;
    const validatedAsset = validationResult.data;

    // Check if profile exists
    const profile = await getUserProfileFromDB(validatedAddress);
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Create profile first.' },
        { status: 404 }
      );
    }

    const asset = await addAssetToPortfolioInDB(validatedAddress, validatedAsset);

    if (!asset) {
      return NextResponse.json(
        { error: 'Failed to add asset to portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json(asset, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error adding asset to portfolio', error as Error, { address: params.address });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add asset to portfolio' },
      { status: 500 }
    );
  }
}

