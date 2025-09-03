'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, FileText } from 'lucide-react';

interface Essay {
  id: string;
  title: string;
  thesis_statement: string;
  book_title: string;
  book_author: string;
  difficulty_level: string;
  grade: string;
  word_count: number;
}

interface EssaySelectorProps {
  onSelectEssay: (essayId: string, essayTitle?: string) => void;
  placeholder?: string;
  className?: string;
}

export const EssaySelector: React.FC<EssaySelectorProps> = ({
  onSelectEssay,
  placeholder = "Search essays...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [essays, setEssays] = useState<Essay[]>([]);
  const [filteredEssays, setFilteredEssays] = useState<Essay[]>([]);
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch essays on mount
  useEffect(() => {
    fetchEssays();
  }, []);

  // Filter essays when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = essays.filter(essay =>
        essay.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        essay.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        essay.book_author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        essay.thesis_statement?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEssays(filtered);
    } else {
      setFilteredEssays(essays);
    }
  }, [searchTerm, essays]);

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

  const fetchEssays = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/essays?published=true');
      if (response.ok) {
        const data = await response.json();
        setEssays(data);
        setFilteredEssays(data);
      }
    } catch (error) {
      console.error('Error fetching essays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEssay = (essay: Essay) => {
    setSelectedEssay(essay);
    const title = essay.title || `Essay on ${essay.book_title}`;
    onSelectEssay(essay.id, title);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    setSelectedEssay(null);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="w-full">
          {selectedEssay ? (
            <div className="flex items-center gap-1 px-2 py-1 border rounded-lg bg-blue-50 border-blue-200">
              <span className="text-xs font-medium text-blue-900 truncate">
                {selectedEssay.title || selectedEssay.book_title}
              </span>
              <button
                onClick={clearSelection}
                className="ml-auto text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 px-2 py-1 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-transparent"
            >
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="flex-1 outline-none bg-transparent text-xs focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(true);
                }}
              />
              <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          )}
      </div>

      {isOpen && (
        <div 
          className="absolute z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto mt-1" 
          style={{ 
            width: '100%',
            minWidth: '200px'
          }}>
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading essays...</div>
          ) : filteredEssays.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No essays found</div>
          ) : (
            <div className="py-1">
              {filteredEssays.map((essay) => (
                <button
                  key={essay.id}
                  onClick={() => handleSelectEssay(essay)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm text-gray-900">
                      {essay.title || `Essay on ${essay.book_title}`}
                    </div>
                    <div className="text-xs text-gray-600">
                      {essay.book_title} by {essay.book_author}
                    </div>
                    {essay.thesis_statement && (
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {essay.thesis_statement}
                      </div>
                    )}
                    <div className="flex gap-3 text-xs text-gray-400">
                      {essay.grade && <span>Grade: {essay.grade}</span>}
                      {essay.word_count && <span>{essay.word_count} words</span>}
                      {essay.difficulty_level && <span>{essay.difficulty_level}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};