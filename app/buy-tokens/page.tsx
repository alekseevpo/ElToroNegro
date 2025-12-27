'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import BuyTokensSection from '@/components/BuyTokensSection';
import Footer from '@/components/Footer';

function BuyTokensContent() {
  return <BuyTokensSection />;
}

export default function BuyTokensPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
        <BuyTokensContent />
      </Suspense>
      <Footer />
    </main>
  );
}

