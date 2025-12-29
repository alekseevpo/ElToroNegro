'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { isKYCVerified, getKYCStatus } from '@/lib/profile-utils';

interface KYCBadgeProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function KYCBadge({ showText = true, size = 'md', className = '' }: KYCBadgeProps) {
  const { user } = useAuth();
  const account = user?.address || null;
  
  if (!account) return null;

  const isVerified = isKYCVerified(account);
  const kycStatus = getKYCStatus(account);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (isVerified) {
    return (
      <Link
        href="/dashboard?tab=profile&section=kyc"
        className={`inline-flex items-center gap-2 ${sizeClasses[size]} bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors ${className}`}
        title="Identity Verified"
      >
        <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        {showText && <span>Verified</span>}
      </Link>
    );
  }

  // Show different states based on KYC status
  if (kycStatus?.status === 'pending') {
    return (
      <Link
        href="/dashboard?tab=profile&section=kyc"
        className={`inline-flex items-center gap-2 ${sizeClasses[size]} bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors ${className}`}
        title="Verification Pending"
      >
        <svg className={`${iconSizes[size]} animate-spin`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {showText && <span>Pending</span>}
      </Link>
    );
  }

  if (kycStatus?.status === 'failed') {
    return (
      <Link
        href="/dashboard?tab=profile&section=kyc"
        className={`inline-flex items-center gap-2 ${sizeClasses[size]} bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors ${className}`}
        title="Verification Failed - Click to retry"
      >
        <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {showText && <span>Failed</span>}
      </Link>
    );
  }

  // Not verified - show warning badge
  return (
    <Link
      href="/dashboard?tab=profile&section=kyc"
      className={`inline-flex items-center gap-2 ${sizeClasses[size]} bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors ${className}`}
      title="Identity verification required - Click to verify"
    >
      <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {showText && <span>Not Verified</span>}
    </Link>
  );
}

