import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
  className = '', 
  variant = 'text', 
  width, 
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClass = 'bg-gray-200 dark:bg-gray-700';
  
  const animationClass = animation === 'pulse' 
    ? 'animate-pulse' 
    : animation === 'wave'
    ? 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]'
    : '';
  
  const variantClass = 
    variant === 'circular' ? 'rounded-full' :
    variant === 'rectangular' ? 'rounded-none' :
    variant === 'rounded' ? 'rounded-lg' :
    'rounded';

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`${baseClass} ${variantClass} ${animationClass} ${className}`}
      style={style}
    />
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
      {/* Title */}
      <div className="flex items-start justify-between">
        <Skeleton variant="text" height={28} className="w-3/4" />
        <div className="flex gap-2">
          <Skeleton variant="rounded" width={60} height={24} />
        </div>
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <Skeleton variant="text" height={16} className="w-full" />
        <Skeleton variant="text" height={16} className="w-full" />
        <Skeleton variant="text" height={16} className="w-2/3" />
      </div>
      
      {/* Book info */}
      <div className="flex items-center gap-2">
        <Skeleton variant="text" height={14} width={60} />
        <Skeleton variant="text" height={14} className="flex-1" />
      </div>
      
      {/* Tags */}
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={50} height={20} />
        <Skeleton variant="rounded" width={60} height={20} />
        <Skeleton variant="rounded" width={45} height={20} />
      </div>
      
      {/* Date info */}
      <Skeleton variant="text" height={12} className="w-1/2" />
      
      {/* Action buttons */}
      <div className="flex gap-2">
        <Skeleton variant="rounded" height={32} className="flex-1" />
        <Skeleton variant="rounded" height={32} className="flex-1" />
        <Skeleton variant="rounded" width={32} height={32} />
      </div>
    </div>
  );
}

export function ContentListSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ContentCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ContentPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton variant="text" height={36} width={200} className="mb-2" />
          <Skeleton variant="text" height={20} width={300} />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rounded" width={140} height={40} />
          <Skeleton variant="rounded" width={160} height={40} />
        </div>
      </div>

      {/* Analytics Bar */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width={100} height={16} />
              <Skeleton variant="text" width={40} height={20} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="text" width={60} height={16} />
              <Skeleton variant="text" width={100} height={16} />
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-4">
            <Skeleton variant="text" width={60} height={16} />
            <div className="flex gap-2">
              <Skeleton variant="rounded" width={70} height={28} />
              <Skeleton variant="rounded" width={80} height={28} />
              <Skeleton variant="rounded" width={80} height={28} />
              <Skeleton variant="rounded" width={70} height={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Skeleton variant="rounded" height={40} className="w-full" />
      </div>

      {/* Content Grid */}
      <ContentListSkeleton count={9} />
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-center gap-2 pt-8">
        <Skeleton variant="rounded" width={100} height={32} />
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width={32} height={32} />
          ))}
        </div>
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </div>
  );
}

// Add shimmer animation to tailwind.config if not present
export const shimmerAnimation = {
  '@keyframes shimmer': {
    '0%': {
      'background-position': '-200% 0',
    },
    '100%': {
      'background-position': '200% 0',
    },
  },
  '.animate-shimmer': {
    animation: 'shimmer 2s linear infinite',
  },
};