'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { isKYCVerified } from '@/lib/profile-utils';

interface KYCGateProps {
  children: React.ReactNode;
  requiredAmount?: number;
  message?: string;
  redirectTo?: string;
}

export default function KYCGate({ 
  children, 
  requiredAmount,
  message,
  redirectTo = '/dashboard?tab=profile&section=kyc'
}: KYCGateProps) {
  const { user } = useAuth();
  const isVerified = user?.address ? isKYCVerified(user.address) : false;

  if (!isVerified) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Verification Required
            </h3>
            <p className="text-gray-600 mb-4">
              {message || (
                requiredAmount 
                  ? `To invest more than €${requiredAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, please verify your identity. This helps us comply with financial regulations and protect all users.`
                  : 'Please verify your identity to continue. This helps us comply with financial regulations and protect all users.'
              )}
            </p>
            <Link href={redirectTo}>
              <button className="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors">
                Start Verification
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

