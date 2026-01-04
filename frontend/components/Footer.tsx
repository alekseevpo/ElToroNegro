'use client';

import Link from 'next/link';
import { useStats } from '@/hooks/useStats';
import { useHeartbeat } from '@/hooks/useHeartbeat';

export default function Footer() {
  const { data: stats, isLoading } = useStats();
  // Send heartbeat to update user's online status
  useHeartbeat();

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('en-US');
  };

  return (
    <footer className="bg-black text-white border-t border-primary-gray">
      <div className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 py-12">
        {/* Stats Section */}
        <div className="mb-8 pb-8 border-b border-primary-gray-light">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-primary-gray-lighter">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-yellow rounded-full animate-pulse"></div>
                <span>Loading stats...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>
                    <span className="text-white font-semibold">{formatNumber(stats?.onlineNow || 0)}</span> online now
                  </span>
                </div>
                <div className="hidden sm:block text-primary-gray">•</div>
                <div className="flex items-center gap-2">
                  <span>
                    <span className="text-white font-semibold">{formatNumber(stats?.activeToday || 0)}</span> active today
                  </span>
                </div>
                <div className="hidden sm:block text-primary-gray">•</div>
                <div className="flex items-center gap-2">
                  <span>
                    <span className="text-white font-semibold">{formatNumber(stats?.totalRegistrations || 0)}</span> total users
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-2">
              <img 
                src="/logo.png" 
                alt="El Toro Negro Logo" 
                className="h-32 object-contain"
              />
            </div>
            <p className="text-primary-gray-lighter text-sm">
              Your trusted investment platform for tokenized assets.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-primary-gray-lighter">
              <li><Link href="/" className="hover:text-accent-yellow transition-colors">Invest</Link></li>
              <li><Link href="/buy-tokens" className="hover:text-accent-yellow transition-colors">Buy Tokens</Link></li>
              <li><Link href="/mission" className="hover:text-accent-yellow transition-colors">Mission</Link></li>
              <li><Link href="/news" className="hover:text-accent-yellow transition-colors">News</Link></li>
              <li><Link href="/lottery" className="hover:text-accent-yellow transition-colors">Lottery</Link></li>
              <li><Link href="/btc-bets" className="hover:text-accent-yellow transition-colors">BTC Bets</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-accent-yellow">Resources</h4>
            <ul className="space-y-2 text-sm text-primary-gray-lighter">
              <li><Link href="/how-it-works" className="hover:text-accent-yellow transition-colors">How It Works</Link></li>
              <li><Link href="/faq" className="hover:text-accent-yellow transition-colors">FAQ</Link></li>
              <li><Link href="/work" className="hover:text-accent-yellow transition-colors">Work with Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-accent-yellow">Legal</h4>
            <ul className="space-y-2 text-sm text-primary-gray-lighter">
              <li><Link href="/terms" className="hover:text-accent-yellow transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-accent-yellow transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-accent-yellow transition-colors">Cookie Policy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-accent-yellow transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-gray mt-8 pt-8 text-center text-sm text-primary-gray-lighter">
          <p>&copy; 2025 El Toro Negro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

