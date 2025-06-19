'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface QuickNavigationProps {
  items: NavigationItem[];
  activeSection?: string;
  onNavigate: (sectionId: string) => void;
  className?: string;
}

export function QuickNavigation({
  items,
  activeSection,
  onNavigate,
  className
}: QuickNavigationProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            "border border-gray-200 dark:border-gray-600",
            activeSection === item.id
              ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/50 dark:border-blue-600 dark:text-blue-300"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
          )}
        >
          {item.icon && (
            <span className="h-4 w-4">
              {item.icon}
            </span>
          )}
          {item.label}
        </button>
      ))}
    </div>
  );
}