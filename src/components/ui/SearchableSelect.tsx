'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
  showClearButton?: boolean;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  className,
  disabled = false,
  maxDisplayItems = 15,
  showClearButton = true,
  emptyMessage = 'No options found'
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Find the selected option
  const selectedOption = useMemo(() => 
    options.find(opt => opt.value === value),
    [options, value]
  );

  // Filter and limit options based on search query
  const { filteredOptions, hasMoreItems, totalMatches } = useMemo(() => {
    if (!searchQuery.trim()) {
      const sliced = options.slice(0, maxDisplayItems);
      return {
        filteredOptions: sliced,
        hasMoreItems: options.length > maxDisplayItems,
        totalMatches: options.length
      };
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    // Filter options that match the search query
    const filtered = options.filter((option) => {
      const labelLower = option.label.toLowerCase();
      const descLower = option.description?.toLowerCase() || '';
      
      // Check if query matches anywhere in the label or description
      if (labelLower.includes(normalizedQuery) || descLower.includes(normalizedQuery)) {
        return true;
      }
      
      // Check if any word in the label starts with the query
      const labelWords = labelLower.split(/[\s\-_.,()]+/); // More aggressive word splitting
      if (labelWords.some(word => word.startsWith(normalizedQuery))) {
        return true;
      }
      
      // Check if any word in the description starts with the query
      if (option.description) {
        const descWords = descLower.split(/[\s\-_.,()]+/);
        if (descWords.some(word => word.startsWith(normalizedQuery))) {
          return true;
        }
      }
      
      // Fuzzy match: check if all characters of query appear in order in the label
      let queryIndex = 0;
      for (let i = 0; i < labelLower.length && queryIndex < normalizedQuery.length; i++) {
        if (labelLower[i] === normalizedQuery[queryIndex]) {
          queryIndex++;
        }
      }
      if (queryIndex === normalizedQuery.length) {
        return true;
      }
      
      return false;
    });
    
    // Debug log for development
    if (searchQuery) {
      console.log(`SearchableSelect: query="${normalizedQuery}", total options=${options.length}, found ${filtered.length} matches`);
      console.log('Filtered options:', filtered.map(o => o.label));
      
      if (filtered.length > 0) {
        console.log('First few matches:', filtered.slice(0, 3).map(o => o.label));
      } else if (options.length > 0) {
        console.log('No matches found! Should show empty message.');
        console.log('ALL options available:', options.map(o => `"${o.label}"`).join(', '));
        // Test the search on first non-empty option
        const testOption = options.find(o => o.label && o.label !== 'All Courses');
        if (testOption) {
          console.log(`Testing search on "${testOption.label}":`, {
            lowercase: testOption.label.toLowerCase(),
            includesQuery: testOption.label.toLowerCase().includes(normalizedQuery),
            words: testOption.label.toLowerCase().split(/[\s\-_.,()]+/)
          });
        }
      }
    }
    
    const sliced = filtered.slice(0, maxDisplayItems);
    
    // Debug: log what we're returning
    if (searchQuery) {
      console.log('Returning filteredOptions:', sliced.length, 'items');
      console.log('Sliced array:', sliced);
      if (sliced.length === 0) {
        console.log('WARNING: filteredOptions is empty but should trigger empty message');
      }
    }
    
    return {
      filteredOptions: sliced,
      hasMoreItems: filtered.length > maxDisplayItems,
      totalMatches: filtered.length
    };
  }, [options, searchQuery, maxDisplayItems]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset search and highlighted index when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
    }
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          'w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'hover:border-gray-400 transition-colors',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <span className={cn(
            'block truncate',
            !selectedOption && 'text-gray-500'
          )}>
            {selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {showClearButton && value && !disabled && (
              <X
                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                onClick={handleClear}
              />
            )}
            <ChevronDown className={cn(
              'h-4 w-4 text-gray-400 transition-transform',
              isOpen && 'transform rotate-180'
            )} />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 min-w-full w-max mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden" style={{ maxWidth: '600px' }}>
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
            {(searchQuery.trim() ? totalMatches > 0 : options.length > maxDisplayItems) && (
              <div className="text-xs text-gray-500 mt-1 px-1">
                {searchQuery.trim() 
                  ? totalMatches > maxDisplayItems
                    ? `Showing ${filteredOptions.length} of ${totalMatches} matches`
                    : `Found ${totalMatches} match${totalMatches !== 1 ? 'es' : ''}`
                  : `Showing ${Math.min(maxDisplayItems, options.length)} of ${options.length} items`
                }
              </div>
            )}
          </div>

          {/* Options List */}
          <ul 
            className="max-h-60 overflow-auto py-1"
            role="listbox"
            key={`${searchQuery}-${filteredOptions.length}`}
          >
            {/* Debug: Log what we're about to render */}
            {searchQuery && console.log('Render check:', {
              query: searchQuery,
              filteredLength: filteredOptions.length,
              willShowEmpty: filteredOptions.length === 0,
              filteredLabels: filteredOptions.map(o => o.label)
            })}
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">
                {emptyMessage}
              </li>
            ) : (
              <>
                {filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    className={cn(
                      'px-3 py-2 cursor-pointer text-sm',
                      'hover:bg-gray-100',
                      highlightedIndex === index && 'bg-gray-100',
                      value === option.value && 'bg-primary-50 text-primary-700 font-medium'
                    )}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    <div className="flex flex-col">
                      <span className="block break-words whitespace-normal">{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-gray-500 break-words whitespace-normal">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
                {hasMoreItems && (
                  <li className="px-3 py-2 text-xs text-gray-500 text-center border-t">
                    More results available. Keep typing to refine...
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}