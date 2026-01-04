'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to periodically send heartbeat to update user's online status
 * Sends heartbeat every 2 minutes when user is logged in
 */
export function useHeartbeat() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(0);
  
  // Memoize user data to prevent unnecessary re-renders
  const userKey = useMemo(() => {
    if (!user) return null;
    return `${user.address}_${user.isConnected ? '1' : '0'}_${user.authType || 'none'}`;
  }, [user?.address, user?.isConnected, user?.authType]);

  useEffect(() => {
    if (!user || !user.isConnected) {
      // Clear interval if user is not connected
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastHeartbeatRef.current = 0;
      return;
    }

    // Prevent multiple intervals from being created
    if (intervalRef.current) {
      return;
    }

    // Send initial heartbeat immediately (but only if enough time has passed)
    const sendHeartbeat = async () => {
      const now = Date.now();
      // Throttle: don't send heartbeat more than once per 30 seconds
      if (now - lastHeartbeatRef.current < 30000) {
        return;
      }
      
      lastHeartbeatRef.current = now;
      
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
        // Only log if it's not a network error (which is expected during development)
        if (!(error instanceof TypeError && error.message.includes('fetch'))) {
          console.debug('Heartbeat failed:', error);
        }
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
      lastHeartbeatRef.current = 0;
    };
  }, [userKey]); // Use userKey instead of user object to prevent unnecessary re-renders
}

