/**
 * Hook to handle referral codes from URL and local storage
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getUserProfile, initializeProfile } from '@/lib/profile-utils';

export const useReferralCode = (account: string | null) => {
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Get referral code from URL
    const refFromUrl = searchParams?.get('ref');
    
    if (refFromUrl && account) {
      // Check if user already has a profile
      const profile = getUserProfile(account);
      
      // If no profile exists, initialize with referral code
      if (!profile) {
        setReferralCode(refFromUrl);
        // Store in localStorage for later use when profile is created
        localStorage.setItem(`pending_ref_${account.toLowerCase()}`, refFromUrl);
      } else if (!profile.referredBy) {
        // Profile exists but no referral code set yet
        setReferralCode(refFromUrl);
        localStorage.setItem(`pending_ref_${account.toLowerCase()}`, refFromUrl);
      }
    } else if (account) {
      // Check for pending referral code in localStorage
      const pendingRef = localStorage.getItem(`pending_ref_${account.toLowerCase()}`);
      if (pendingRef) {
        const profile = getUserProfile(account);
        if (profile && !profile.referredBy) {
          setReferralCode(pendingRef);
        } else if (!profile) {
          setReferralCode(pendingRef);
        }
      }
    }
  }, [account, searchParams]);

  const clearPendingReferral = () => {
    if (account) {
      localStorage.removeItem(`pending_ref_${account.toLowerCase()}`);
      setReferralCode(null);
    }
  };

  return { referralCode, clearPendingReferral };
};

