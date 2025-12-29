'use client';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export default function SkeletonLoader({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-primary-gray-light rounded';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton for dashboard stats cards
 */
export function StatsCardSkeleton() {
  return (
    <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SkeletonLoader variant="text" width="60%" className="mb-2" />
          <SkeletonLoader variant="text" width="40%" height={32} />
        </div>
        <SkeletonLoader variant="circular" width={48} height={48} />
      </div>
    </div>
  );
}

/**
 * Skeleton for dashboard overview
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-primary-gray rounded-xl p-6 shadow-sm border border-primary-gray-light">
        <SkeletonLoader variant="text" width="30%" height={28} className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonLoader key={i} variant="rectangular" height={80} />
          ))}
        </div>
      </div>
    </div>
  );
}

