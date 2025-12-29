import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-yellow/20 rounded-full mb-6">
            <svg className="w-8 h-8 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Support Center</h1>
          <p className="text-xl text-primary-gray-lighter max-w-2xl mx-auto">
            We're here to help! Find answers to common questions or contact our support team.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* FAQ Section */}
          <Link
            href="/faq"
            className="bg-primary-gray border border-primary-gray-light rounded-xl p-6 hover:border-accent-yellow/50 transition-colors group"
          >
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-accent-yellow mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-white group-hover:text-accent-yellow transition-colors">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-primary-gray-lighter">
              Browse our FAQ section to find quick answers to common questions about investing, withdrawals, and platform features.
            </p>
          </Link>

          {/* Contact Support */}
          <div className="bg-primary-gray border border-primary-gray-light rounded-xl p-6">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-accent-yellow mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-xl font-semibold text-white">Contact Support</h2>
            </div>
            <p className="text-primary-gray-lighter mb-4">
              Need personalized assistance? Reach out to our support team.
            </p>
            <a
              href="mailto:support@eltoronegro.com"
              className="inline-flex items-center px-4 py-2 bg-accent-yellow text-black font-medium rounded-lg hover:bg-accent-yellow-light transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@eltoronegro.com
            </a>
          </div>

          {/* Documentation */}
          <Link
            href="/how-it-works"
            className="bg-primary-gray border border-primary-gray-light rounded-xl p-6 hover:border-accent-yellow/50 transition-colors group"
          >
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-accent-yellow mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2 className="text-xl font-semibold text-white group-hover:text-accent-yellow transition-colors">
                How It Works
              </h2>
            </div>
            <p className="text-primary-gray-lighter">
              Learn about our platform, investment options, and how to get started with tokenized assets.
            </p>
          </Link>

          {/* Work with Us */}
          <Link
            href="/work"
            className="bg-primary-gray border border-primary-gray-light rounded-xl p-6 hover:border-accent-yellow/50 transition-colors group"
          >
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-accent-yellow mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-xl font-semibold text-white group-hover:text-accent-yellow transition-colors">
                Work with Us
              </h2>
            </div>
            <p className="text-primary-gray-lighter">
              Join our team! Check out open positions, bug bounties, and developer challenges.
            </p>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="bg-primary-gray border border-primary-gray-light rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Links</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/terms" className="text-primary-gray-lighter hover:text-accent-yellow transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-primary-gray-lighter hover:text-accent-yellow transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookie-policy" className="text-primary-gray-lighter hover:text-accent-yellow transition-colors">
              Cookie Policy
            </Link>
            <Link href="/disclaimer" className="text-primary-gray-lighter hover:text-accent-yellow transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

