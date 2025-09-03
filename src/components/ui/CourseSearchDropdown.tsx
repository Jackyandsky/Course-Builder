'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { Course } from '@/types/database';
import { cn } from '@/lib/utils';

interface CourseSearchDropdownProps {
  courses: Course[];
  selectedCourses: string[];
  onSelectionChange: (courseIds: string[]) => void;
  placeholder?: string;
  maxHeight?: number;
  loading?: boolean;
  className?: string;
}

export function CourseSearchDropdown({
  courses,
  selectedCourses,
  onSelectionChange,
  placeholder = "Search and select courses...",
  maxHeight = 360, // Reduced height for neater appearance (~9 lines)
  loading = false,
  className
}: CourseSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCourses, setFilteredCourses] = useState(courses);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter courses based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.code?.toLowerCase().includes(query)
      );
      setFilteredCourses(filtered);
    }
  }, [searchQuery, courses]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCourse = useCallback((courseId: string) => {
    const newSelection = selectedCourses.includes(courseId)
      ? selectedCourses.filter(id => id !== courseId)
      : [...selectedCourses, courseId];
    onSelectionChange(newSelection);
  }, [selectedCourses, onSelectionChange]);

  const clearSelection = useCallback(() => {
    onSelectionChange([]);
    setSearchQuery('');
  }, [onSelectionChange]);

  const selectedCourseTitles = courses
    .filter(course => selectedCourses.includes(course.id))
    .map(course => course.title);

  // Group courses by first letter for better organization
  const groupedCourses = filteredCourses.reduce((acc, course) => {
    const firstLetter = course.title[0]?.toUpperCase() || '#';
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  const sortedGroups = Object.keys(groupedCourses).sort();

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Input Field */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 cursor-pointer",
            "hover:border-gray-400 dark:hover:border-gray-600 transition-colors",
            isOpen && "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20"
          )}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
        >
          <Search className="h-4 w-4 text-gray-400" />
          
          {selectedCourses.length > 0 && !isOpen ? (
            <div className="flex-1 flex items-center gap-2 overflow-hidden">
              <span className="text-sm">
                {selectedCourses.length === 1
                  ? selectedCourseTitles[0]
                  : `${selectedCourses.length} courses selected`}
              </span>
              {selectedCourses.length > 1 && (
                <div className="flex gap-1">
                  {selectedCourseTitles.slice(0, 2).map((title, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                    >
                      {title.length > 15 ? title.substring(0, 15) + '...' : title}
                    </span>
                  ))}
                  {selectedCourseTitles.length > 2 && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                      +{selectedCourseTitles.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isOpen ? "Type to search..." : placeholder}
              className="flex-1 bg-transparent outline-none text-sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
            />
          )}

          <div className="flex items-center gap-1">
            {selectedCourses.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg",
            "animate-in fade-in-0 zoom-in-95 duration-200"
          )}
          style={{ maxHeight: `${maxHeight}px` }}
        >
          {/* Search input in dropdown */}
          <div className="sticky top-0 p-2 border-b bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="flex-1 bg-transparent outline-none text-sm"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="h-3 w-3 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Selected count and clear all */}
          {selectedCourses.length > 0 && (
            <div className="sticky top-10 px-2 py-1.5 border-b bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {selectedCourses.length} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Course list */}
          <div className="overflow-y-auto" style={{ maxHeight: `${maxHeight - 80}px` }}>
            {loading ? (
              <div className="p-3 text-center text-sm text-gray-500">Loading courses...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-500">
                {searchQuery ? `No courses found for "${searchQuery}"` : 'No courses available'}
              </div>
            ) : (
              <div className="py-1">
                {/* Display in multi-column grid */}
                <div className="grid grid-cols-2 gap-0.5 px-1">
                  {filteredCourses.map((course) => {
                    const isSelected = selectedCourses.includes(course.id);
                    return (
                      <button
                        key={course.id}
                        onClick={() => toggleCourse(course.id)}
                        className={cn(
                          "flex items-start gap-1.5 p-1.5 rounded-md text-left transition-colors",
                          "hover:bg-gray-100 dark:hover:bg-gray-700",
                          isSelected && "bg-blue-50 dark:bg-blue-900/30"
                        )}
                      >
                        <div className="mt-0.5">
                          <div
                            className={cn(
                              "w-3.5 h-3.5 border rounded flex items-center justify-center",
                              isSelected
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300 dark:border-gray-600"
                            )}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            {course.code && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {course.code}
                              </span>
                            )}
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                              {course.title}
                            </p>
                          </div>
                          {course.description && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="sticky bottom-0 px-2 py-1 border-t bg-gray-50 dark:bg-gray-900">
            <span className="text-[10px] text-gray-500">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      )}
    </div>
  );
}