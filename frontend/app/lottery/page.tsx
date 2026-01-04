'use client';

import Header from '@/components/Header';
import InstantLottery from '@/components/InstantLottery';
import Footer from '@/components/Footer';

export default function LotteryPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <InstantLottery />
      <Footer />
    </main>
  );
}

