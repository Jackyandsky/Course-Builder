'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'select';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  value?: string | string[] | [number, number];
}

export interface FilterPanelProps {
  filters: FilterGroup[];
  values: Record<string, any>;
  onChange: (filterId: string, value: any) => void;
  onReset?: () => void;
  onApply?: () => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  showApplyButton?: boolean;
  showResetButton?: boolean;
  title?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values,
  onChange,
  onReset,
  onApply,
  className,
  collapsible = true,
  defaultCollapsed = false,
  showApplyButton = false,
  showResetButton = true,
  title = 'Filters',
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleCheckboxChange = (filterId: string, option: string, checked: boolean) => {
    const currentValues = (values[filterId] as string[]) || [];
    const newValues = checked
      ? [...currentValues, option]
      : currentValues.filter((v) => v !== option);
    onChange(filterId, newValues);
  };

  const handleRadioChange = (filterId: string, value: string) => {
    onChange(filterId, value);
  };

  const handleRangeChange = (filterId: string, index: number, value: number) => {
    const currentValues = (values[filterId] as [number, number]) || [0, 100];
    const newValues: [number, number] = [...currentValues] as [number, number];
    newValues[index] = value;
    onChange(filterId, newValues);
  };

  const hasActiveFilters = Object.values(values).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value !== '';
    return false;
  });

  const renderFilterGroup = (filter: FilterGroup) => {
    const isExpanded = expandedGroups[filter.id] !== false;

    return (
      <div key={filter.id} className="border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => toggleGroup(filter.id)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {filter.label}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 pb-3">
            {filter.type === 'checkbox' && filter.options && (
              <div className="space-y-2">
                {filter.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(values[filter.id] as string[] || []).includes(option.value)}
                      onChange={(e) =>
                        handleCheckboxChange(filter.id, option.value, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      {option.label}
                      {option.count !== undefined && (
                        <span className="ml-1 text-gray-500">({option.count})</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {filter.type === 'radio' && filter.options && (
              <div className="space-y-2">
                {filter.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={filter.id}
                      value={option.value}
                      checked={values[filter.id] === option.value}
                      onChange={() => handleRadioChange(filter.id, option.value)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {filter.type === 'range' && filter.min !== undefined && filter.max !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={filter.min}
                    max={filter.max}
                    step={filter.step}
                    value={(values[filter.id] as [number, number])?.[0] || filter.min}
                    onChange={(e) =>
                      handleRangeChange(filter.id, 0, Number(e.target.value))
                    }
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min={filter.min}
                    max={filter.max}
                    step={filter.step}
                    value={(values[filter.id] as [number, number])?.[1] || filter.max}
                    onChange={(e) =>
                      handleRangeChange(filter.id, 1, Number(e.target.value))
                    }
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {filter.type === 'select' && filter.options && (
              <select
                value={values[filter.id] || ''}
                onChange={(e) => onChange(filter.id, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    );
  };

  const content = (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Active
            </span>
          )}
        </div>
        {collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            )}
          </button>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="max-h-96 overflow-y-auto">
            {filters.map(renderFilterGroup)}
          </div>

          {(showResetButton || showApplyButton) && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              {showResetButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  disabled={!hasActiveFilters}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
              {showApplyButton && (
                <Button
                  type="button"
                  size="sm"
                  onClick={onApply}
                  className="ml-auto"
                >
                  Apply Filters
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {content}
    </div>
  );
};

FilterPanel.displayName = 'FilterPanel';
