import { NextRequest, NextResponse } from 'next/server';
import { getUserProfileFromDB, findAddressByReferralCodeInDB } from '@/lib/db-profile-utils';

/**
 * GET /api/profile/[address]/referrals
 * Get user referrals
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

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

    // Get referral details
    const referrals = await Promise.all(
      (profile.referrals || []).map(async (refAddress) => {
        const refProfile = await getUserProfileFromDB(refAddress);
        return refProfile ? {
          address: refAddress,
          username: refProfile.username,
          name: refProfile.name,
          createdAt: refProfile.createdAt,
        } : null;
      })
    );

    const validReferrals = referrals.filter((r): r is NonNullable<typeof r> => r !== null);

    return NextResponse.json({
      referralCode: profile.referralCode,
      referredBy: profile.referredBy || null,
      totalReferrals: validReferrals.length,
      referrals: validReferrals,
    });
  } catch (error: any) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
}

