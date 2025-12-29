/**
 * React hook for creating and updating user profiles via API
 */

import { useState } from 'react';
import type { UserProfile } from '@/lib/profile-utils';

interface UseProfileMutationReturn {
  createProfile: (data: {
    address: string;
    username: string;
    referredBy?: string;
    [key: string]: any;
  }) => Promise<UserProfile | null>;
  updateProfile: (address: string, updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for creating and updating profiles
 */
export function useProfileMutation(): UseProfileMutationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProfile = async (data: {
    address: string;
    username: string;
    referredBy?: string;
    [key: string]: any;
  }): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create profile' }));
        throw new Error(errorData.error || 'Failed to create profile');
      }

      const profile = await response.json();
      setError(null);
      return profile;
    } catch (err: any) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Failed to create profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (
    address: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          ...updates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update profile' }));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const profile = await response.json();
      setError(null);
      return profile;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProfile,
    updateProfile,
    loading,
    error,
  };
}

