'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to periodically send heartbeat to update user's online status
 * Sends heartbeat every 2 minutes when user is logged in
 */
export function useHeartbeat() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !user.isConnected) {
      // Clear interval if user is not connected
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Send initial heartbeat immediately
    const sendHeartbeat = async () => {
      try {
        const body: { address?: string; email?: string; authType?: string; name?: string } = {};
        
        // Use address for wallet connections, email for Google auth
        if (user.authType === 'google' && user.address.includes('@')) {
          body.email = user.address;
          body.authType = 'google';
          body.name = user.name;
        } else {
          body.address = user.address;
          body.authType = user.authType || 'wallet';
        }

        await fetch('/api/profile/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      } catch (error) {
        // Silently fail - heartbeat is not critical
        console.debug('Heartbeat failed:', error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval to send heartbeat every 2 minutes (120000ms)
    // This ensures user stays "online" as long as they have the page open
    intervalRef.current = setInterval(sendHeartbeat, 120000);

    // Cleanup on unmount or when user disconnects
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user]);
}

