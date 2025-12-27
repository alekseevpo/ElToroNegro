import Header from '@/components/Header';
import MyInvestmentsSection from '@/components/MyInvestmentsSection';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MyInvestmentsPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Header />
        <MyInvestmentsSection />
        <Footer />
      </main>
    </ProtectedRoute>
  );
}

