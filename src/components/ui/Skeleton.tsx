import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={cn(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={style}
    />
  );
}

// Book Card Skeleton
export function BookCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3">
      {/* Cover Image Skeleton */}
      <Skeleton variant="rounded" height={200} className="w-full" />
      
      {/* Title */}
      <Skeleton variant="text" className="w-3/4" />
      
      {/* Author */}
      <Skeleton variant="text" className="w-1/2" height="0.875em" />
      
      {/* Description */}
      <div className="space-y-1">
        <Skeleton variant="text" className="w-full" height="0.875em" />
        <Skeleton variant="text" className="w-5/6" height="0.875em" />
      </div>
      
      {/* Footer with badges */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={40} height={24} />
      </div>
    </div>
  );
}

// Book List Item Skeleton
export function BookListItemSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <Skeleton variant="rounded" width={80} height={120} />
        
        <div className="flex-1 space-y-2">
          {/* Title */}
          <Skeleton variant="text" className="w-1/3" height="1.25em" />
          
          {/* Author and year */}
          <div className="flex items-center gap-2">
            <Skeleton variant="text" width={120} height="0.875em" />
            <Skeleton variant="text" width={40} height="0.875em" />
          </div>
          
          {/* Description */}
          <div className="space-y-1">
            <Skeleton variant="text" className="w-full" height="0.875em" />
            <Skeleton variant="text" className="w-4/5" height="0.875em" />
          </div>
          
          {/* Badges */}
          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" width={60} height={24} />
            <Skeleton variant="rounded" width={50} height={24} />
            <Skeleton variant="rounded" width={40} height={24} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton variant="text" width={60} height="0.875em" />
          <Skeleton variant="text" width={40} height="1.5em" />
        </div>
        <Skeleton variant="circular" width={32} height={32} />
      </div>
    </div>
  );
}