'use client';

import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  onSearch?: (value: string) => void;
  onClear?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'ghost';
  fullWidth?: boolean;
  showClearButton?: boolean;
  debounceDelay?: number;
}

const sizeClasses = {
  sm: 'h-8 text-sm pl-8 pr-3',
  md: 'h-10 text-base pl-10 pr-4',
  lg: 'h-12 text-lg pl-12 pr-5',
};

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const iconPositionClasses = {
  sm: 'left-2',
  md: 'left-3',
  lg: 'left-4',
};

const variantClasses = {
  default: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
  filled: 'border border-transparent bg-gray-100 dark:bg-gray-700',
  ghost: 'border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700',
};

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  (
    {
      onSearch,
      onClear,
      size = 'md',
      variant = 'default',
      fullWidth = false,
      showClearButton = true,
      debounceDelay = 300,
      className,
      value: controlledValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState('');
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      
      onChange?.(e);

      // Debounced search
      if (onSearch) {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        const timer = setTimeout(() => {
          onSearch(newValue);
        }, debounceDelay);
        setDebounceTimer(timer);
      }
    };

    const handleClear = () => {
      if (controlledValue === undefined) {
        setInternalValue('');
      }
      
      // Create synthetic event for onChange
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange?.(syntheticEvent);
      onClear?.();
      onSearch?.('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        onSearch(value as string);
      }
    };

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
          <Search
            className={cn(
              'text-gray-400',
              iconSizeClasses[size],
              iconPositionClasses[size]
            )}
          />
        </div>
        
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            'rounded-md transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'text-gray-900 dark:text-gray-100',
            sizeClasses[size],
            variantClasses[variant],
            showClearButton && value && 'pr-10',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        
        {showClearButton && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className={iconSizeClasses[size]} />
          </button>
        )}
      </div>
    );
  }
);

SearchBox.displayName = 'SearchBox';
