'use client';

import React, { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'ghost';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: 'h-8 text-sm pl-3 pr-8',
  md: 'h-10 text-base pl-4 pr-10',
  lg: 'h-12 text-lg pl-5 pr-12',
};

const variantClasses = {
  default: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
  filled: 'border border-transparent bg-gray-100 dark:bg-gray-700',
  ghost: 'border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder,
      size = 'md',
      variant = 'default',
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = props.id || props.name;

    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'rounded-md transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'text-gray-900 dark:text-gray-100',
            'cursor-pointer',
            sizeClasses[size],
            variantClasses[variant],
            error && 'border-red-500 dark:border-red-400',
            fullWidth ? 'w-full' : 'w-auto',
            className
          )}
          disabled={disabled}
          {...props}
          value={props.value ?? ''}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children ? (
            children
          ) : (
            options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))
          )}
        </select>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
