import Link from 'next/link';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import InvestmentOptionsWithContract from '@/components/InvestmentOptionsWithContract';
import Features from '@/components/Features';
import Stats from '@/components/Stats';
import Footer from '@/components/Footer';

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

