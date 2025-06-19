'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionSectionProps {
  id: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: (id: string, expanded: boolean) => void;
  className?: string;
}

export function AccordionSection({
  id,
  title,
  icon,
  children,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggle,
  className
}: AccordionSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newExpanded = !expanded;
    
    if (isControlled) {
      onToggle?.(id, newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  return (
    <div
      className={cn(
        "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden",
        "bg-white dark:bg-gray-800 shadow-sm",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={handleToggle}
        className={cn(
          "w-full px-6 py-4 text-left transition-colors duration-200",
          "hover:bg-gray-50 dark:hover:bg-gray-700/50",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
          "flex items-center justify-between"
        )}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-gray-500 dark:text-gray-400">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        
        <div className="text-gray-400">
          {expanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}