'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import WalletButton from './WalletButton';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Base navigation items
  const baseNavigation = [
    { name: 'Invest', href: '/' },
    { name: 'Buy Tokens', href: '/buy-tokens' },
    { name: 'My Investments', href: '/my-investments' },
    { name: 'Mission', href: '/mission' },
    { name: 'Lottery', href: '/lottery' },
    { name: 'BTC Bets', href: '/btc-bets' },
  ];

  // Add Dashboard as first item if user is authenticated
  const navigation = user?.isConnected
    ? [{ name: 'Dashboard', href: '/dashboard' }, ...baseNavigation]
    : baseNavigation;

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-primary-gray">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex flex-col items-start">
              <span className="text-2xl font-bold text-accent-yellow">El Toro Negro</span>
              <span className="text-xs text-primary-gray-lighter mt-0.5">investment platform for people, for the future</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-accent-yellow border-b-2 border-accent-yellow pb-1'
                    : 'text-primary-gray-lighter hover:text-accent-yellow'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <WalletButton />
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-primary-gray-lighter hover:text-accent-yellow hover:bg-primary-gray"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-primary-gray text-accent-yellow'
                      : 'text-primary-gray-lighter hover:bg-primary-gray hover:text-accent-yellow'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

