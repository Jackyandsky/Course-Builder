import React from 'react';
import { Spinner } from './Spinner';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  message = 'Loading...',
  fullScreen = false,
  className,
}) => {
  if (!show) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50',
        'flex items-center justify-center',
        fullScreen && 'fixed',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-4">
        <Spinner size="lg" />
        {message && (
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};