import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardSection from '@/components/DashboardSection';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Header />
        <DashboardSection />
        <Footer />
      </main>
    </ProtectedRoute>
  );
}

