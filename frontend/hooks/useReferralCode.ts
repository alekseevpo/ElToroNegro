/**
 * Hook to handle referral codes from URL
 * Now uses API instead of localStorage
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProfile } from './useProfile';

export const useReferralCode = (account: string | null) => {
  const searchParams = useSearchParams();
  const { profile } = useProfile(account);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Get referral code from URL
    const refFromUrl = searchParams?.get('ref');
    
    if (refFromUrl && account) {
      // If profile exists and already has referral code, don't set
      if (profile?.referredBy) {
        setReferralCode(null);
        return;
      }
      
      // Set referral code from URL (will be applied when profile is created/updated)
      setReferralCode(refFromUrl);
    } else {
      // No referral code in URL
      setReferralCode(null);
    }
  }, [account, searchParams, profile]);

  const clearPendingReferral = () => {
    setReferralCode(null);
  };

  return { referralCode, clearPendingReferral };
};

