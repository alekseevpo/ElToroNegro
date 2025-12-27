import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-primary-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-1 text-accent-yellow">El Toro Negro</h3>
            <p className="text-primary-gray-lighter text-xs mb-4">investment platform for people, for the future</p>
            <p className="text-primary-gray-lighter text-sm">
              Your trusted investment platform for tokenized assets.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-primary-gray-lighter">
              <li><Link href="/" className="hover:text-accent-yellow transition-colors">Invest</Link></li>
              <li><Link href="/buy-tokens" className="hover:text-accent-yellow transition-colors">Buy Tokens</Link></li>
              <li><Link href="/my-investments" className="hover:text-accent-yellow transition-colors">My Investments</Link></li>
              <li><Link href="/mission" className="hover:text-accent-yellow transition-colors">Mission</Link></li>
              <li><Link href="/lottery" className="hover:text-accent-yellow transition-colors">Lottery</Link></li>
              <li><Link href="/btc-bets" className="hover:text-accent-yellow transition-colors">BTC Bets</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-accent-yellow">Resources</h4>
            <ul className="space-y-2 text-sm text-primary-gray-lighter">
              <li><a href="#" className="hover:text-accent-yellow transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-accent-yellow transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-accent-yellow transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-accent-yellow">Legal</h4>
            <ul className="space-y-2 text-sm text-primary-gray-lighter">
              <li><a href="#" className="hover:text-accent-yellow transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-accent-yellow transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-accent-yellow transition-colors">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-gray mt-8 pt-8 text-center text-sm text-primary-gray-lighter">
          <p>&copy; {new Date().getFullYear()} El Toro Negro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

