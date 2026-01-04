'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import WalletButton from './WalletButton';
import KYCBadge from './KYCBadge';
import { useAuth } from '@/contexts/AuthContext';

// Lazy load LoginModal - only load when needed
const LoginModal = dynamic(() => import('./LoginModal'), {
  ssr: false,
});

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'signup'>('login');
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Listen for custom event to open login modal
  useEffect(() => {
    const handleOpenLoginModal = () => {
      setIsLoginModalOpen(true);
    };

    window.addEventListener('openLoginModal', handleOpenLoginModal);
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
    };
  }, []);

  // Base navigation items (Dashboard removed - now shown as button next to user name)
  const navigation = [
    { name: 'Invest', href: '/' },
    { name: 'Buy Tokens', href: '/buy-tokens' },
    { name: 'Mission', href: '/mission' },
    { name: 'News', href: '/news' },
    { name: 'Lottery', href: '/lottery' },
    { name: 'BTC Bets', href: '/btc-bets' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-primary-gray">
      <nav className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4" aria-label="Top">
        <div className="w-full py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src="/logo.png" 
                alt="El Toro Negro Logo" 
                className="h-24 object-contain"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
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
            {!user?.isConnected && (
              <>
                <button
                  onClick={() => {
                    setLoginModalMode('login');
                    setIsLoginModalOpen(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-primary-gray-lighter hover:text-accent-yellow transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setLoginModalMode('signup');
                    setIsLoginModalOpen(true);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-accent-yellow/20 text-accent-yellow hover:bg-accent-yellow/30 rounded-lg transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
            {user?.isConnected && (
              <>
                {/* Dashboard button - small yellow button */}
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-accent-yellow text-black'
                      : 'bg-accent-yellow/80 text-black hover:bg-accent-yellow'
                  }`}
                >
                  Dashboard
                </Link>
                <KYCBadge showText={false} size="sm" />
              </>
            )}
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
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        mode={loginModalMode}
      />
    </header>
  );
}

