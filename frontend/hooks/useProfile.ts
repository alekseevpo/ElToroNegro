/**
 * React hook for fetching user profile from API
 */

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/profile-utils';

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage user profile
 * @param address - User's Ethereum address or email
 * @param byEmail - If true, fetch by email instead of address
 */
export function useProfile(
  address: string | null | undefined,
  byEmail: boolean = false
): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!address) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Auto-detect if address is an email (contains @)
      const isEmailAddress = address.includes('@');
      
      // Try to fetch by address first (works for both wallet addresses and emails stored as address)
      let response = await fetch(`/api/profile/${address}`);
      
      // If not found and it's an email, try searching by email field
      if (!response.ok && response.status === 404 && isEmailAddress && !byEmail) {
        response = await fetch(`/api/profile/by-email?email=${encodeURIComponent(address)}`);
      }

      if (!response.ok) {
        if (response.status === 404) {
          setProfile(null);
          setError(null); // 404 is not an error, just no profile
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch profile' }));
          setError(errorData.error || 'Failed to fetch profile');
        }
      } else {
        const data = await response.json();
        setProfile(data);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, byEmail]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}

