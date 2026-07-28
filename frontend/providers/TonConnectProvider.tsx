'use client';

import { useState, useEffect } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

export default function TonConnectProvider({ children }: { children: React.ReactNode }) {
  const [manifestUrl, setManifestUrl] = useState<string>(
    'https://raw.githubusercontent.com/alekseevpo/ElToroNegro/main/frontend/public/tonconnect-manifest.json'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin.startsWith('https://')) {
        setManifestUrl(`${origin}/tonconnect-manifest.json`);
      } else {
        // Fallback to public HTTPS manifest URL when running locally on http://localhost
        setManifestUrl('https://raw.githubusercontent.com/alekseevpo/ElToroNegro/main/frontend/public/tonconnect-manifest.json');
      }
    }
  }, []);

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      uiPreferences={{ theme: 'DARK' }}
    >
      {children}
    </TonConnectUIProvider>
  );
}

