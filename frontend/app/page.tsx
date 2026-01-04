import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Hero from '@/components/Hero';

// Lazy load components below the fold for better initial page load
// These components are loaded only when needed, reducing initial bundle size

// Stats is a server component, can be SSR
const Stats = dynamic(() => import('@/components/Stats'), {
  ssr: true,
});

// InvestmentOptionsWithContract uses client-side hooks and browser APIs
const InvestmentOptionsWithContract = dynamic(
  () => import('@/components/InvestmentOptionsWithContract'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-yellow mb-4"></div>
          <p className="text-primary-gray-lighter">Loading investment options...</p>
        </div>
      </div>
    ),
  }
);

// Features uses React Query hooks
const Features = dynamic(() => import('@/components/Features'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[300px] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-accent-yellow mb-4"></div>
        <p className="text-primary-gray-lighter">Loading features...</p>
      </div>
    </div>
  ),
});

// Footer uses client-side hooks (useStats)
const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Stats />
      <InvestmentOptionsWithContract />
      <Features />
      <Footer />
    </main>
  );
}

