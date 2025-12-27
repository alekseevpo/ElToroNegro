'use client';

import { useEffect } from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { useAuth } from '@/contexts/AuthContext';

interface TonConnectButtonWrapperProps {
  onConnect?: (address: string) => void;
}

export default function TonConnectButtonWrapper({ onConnect }: TonConnectButtonWrapperProps) {
  const userFriendlyAddress = useTonAddress();
  const { onTonConnect } = useAuth();

  useEffect(() => {
    if (userFriendlyAddress) {
      console.log('TON Wallet connected:', userFriendlyAddress);
      // Call the auth context handler
      if (onTonConnect) {
        onTonConnect(userFriendlyAddress);
      }
      
      // Call the optional callback
      if (onConnect) {
        onConnect(userFriendlyAddress);
      }
    }
  }, [userFriendlyAddress, onTonConnect, onConnect]);

  return (
    <div className="w-full">
      <TonConnectButton />
    </div>
  );
}

