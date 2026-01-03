/**
 * React hook for fetching user profile from API
 */

import { useState, useEffect, useRef } from 'react';
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
  const fetchingRef = useRef(false); // Track if fetch is in progress

  const fetchProfile = async () => {
    if (!address) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      return;
    }
    
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Auto-detect if address is an email (contains @)
      const isEmailAddress = address.includes('@');
      
      let response: Response;
      
      // If it's an email, use the by-email endpoint directly to avoid validation errors
      if (isEmailAddress && !byEmail) {
        response = await fetch(`/api/profile/by-email?email=${encodeURIComponent(address)}`);
      } else {
        // For wallet addresses, try the address endpoint
        response = await fetch(`/api/profile/${address}`);
        
        // If not found and it's an email, try searching by email field
        if (!response.ok && response.status === 404 && isEmailAddress) {
          response = await fetch(`/api/profile/by-email?email=${encodeURIComponent(address)}`);
        }
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
      // Only log non-network errors (network errors are expected during development)
      if (!err.message?.includes('Failed to fetch') && !err.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.error('Error fetching profile:', err);
      }
      setError(err.message || 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, byEmail]); // Only re-fetch when address or byEmail changes

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}

