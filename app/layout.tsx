import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import TonConnectProvider from '@/providers/TonConnectProvider';
import AnimatedGradientBackground from '@/components/AnimatedGradientBackground';

export const metadata: Metadata = {
  title: 'El Toro Negro - Invest in Tokenized Assets',
  description: 'Invest from €10 and earn returns. Trade tokenized stocks, gold, oil, and other assets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900">
        <AnimatedGradientBackground />
        <TonConnectProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TonConnectProvider>
      </body>
    </html>
  );
}

