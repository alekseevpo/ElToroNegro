import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import TonConnectProvider from '@/providers/TonConnectProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import AnimatedGradientBackground from '@/components/AnimatedGradientBackground';
import SupportButton from '@/components/SupportButton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'El Toro Negro - Invest in Tokenized Assets',
  description: 'Invest from 10 EUR and earn returns. Trade tokenized stocks, gold, oil, and other assets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        />
      </head>
      <body className="antialiased bg-white text-gray-900" suppressHydrationWarning>
        <AnimatedGradientBackground />
        <ErrorBoundary>
          <QueryProvider>
            <ToastProvider>
              <TonConnectProvider>
                <AuthProvider>
                  {children}
                  <SupportButton />
                </AuthProvider>
              </TonConnectProvider>
            </ToastProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

