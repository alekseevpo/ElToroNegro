'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      <div className="relative max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 py-20 lg:py-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-accent-yellow mb-6 tracking-tight">
            Invest in Tokenized
            <br />
            <span className="text-primary-gray-lighter">Assets</span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-gray-lighter mb-12 max-w-3xl mx-auto leading-relaxed">
            Start investing from just €10. Trade tokenized stocks, gold, oil, and other assets.
            <br />
            Grow your wealth with our innovative platform.
          </p>
          
          {/* Additional Benefits */}
          <div className="mb-10 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-primary-gray border border-primary-gray-light rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-accent-yellow mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-accent-yellow">Link Your Card</h3>
                </div>
                <p className="text-primary-gray-lighter leading-relaxed">
                  Link your card and invest small amounts every day. Build your portfolio gradually with ease.
                </p>
              </div>
              
              <div className="bg-primary-gray border border-primary-gray-light rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-accent-yellow mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-accent-yellow">Invite Friends</h3>
                </div>
                <p className="text-primary-gray-lighter leading-relaxed">
                  Invite friends and increase your percentage on the total volume of invested funds. The more people you bring, the more you earn.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/buy-tokens"
              className="px-8 py-4 bg-accent-yellow text-black text-lg font-medium rounded-lg hover:bg-accent-yellow-light transition-colors whitespace-nowrap min-w-[180px] text-center"
            >
              Start Investing
            </Link>
            <a 
              href="#features"
              className="px-8 py-4 bg-transparent text-accent-yellow text-lg font-medium rounded-lg border-2 border-accent-yellow hover:bg-primary-gray transition-colors whitespace-nowrap min-w-[180px] text-center"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

