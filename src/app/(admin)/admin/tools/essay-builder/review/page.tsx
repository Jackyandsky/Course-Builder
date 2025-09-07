'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft, Search, User, Calendar, ChevronLeft, ChevronRight,
  Eye, FileText, Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
}

interface PublishedEssay {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  selectedEssayTitle: string;
  student: Student;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function EssayReviewPage() {
  const router = useRouter();
  const [essays, setEssays] = useState<PublishedEssay[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentSearch, setContentSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [selectedEssay, setSelectedEssay] = useState<PublishedEssay | null>(null);
  const [essayContent, setEssayContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const studentSelectorRef = useRef<HTMLDivElement>(null);

  // Load essays on mount and when filters/pagination change
  useEffect(() => {
    loadEssays();
  }, [pagination.page, contentSearch, studentSearch]);

  // Close student selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentSelectorRef.current && !studentSelectorRef.current.contains(event.target as Node)) {
        setShowStudentSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadEssays = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(contentSearch && { contentSearch }),
        ...(studentSearch && { studentSearch })
      });

      const response = await fetch(`/api/admin/essays/published?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEssays(data.essays || []);
        setPagination(data.pagination || pagination);
      } else {
        console.error('Failed to load essays');
        setEssays([]);
      }
    } catch (error) {
      console.error('Error loading essays:', error);
      setEssays([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEssayContent = async (essay: PublishedEssay) => {
    setSelectedEssay(essay);
    setLoadingContent(true);
    try {
      const response = await fetch(`/api/essays/drafts/${essay.id}`);
      if (response.ok) {
        const content = await response.json();
        setEssayContent(content);
      } else {
        setEssayContent(null);
      }
    } catch (error) {
      console.error('Error loading essay content:', error);
      setEssayContent(null);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleSearch = (type: 'content' | 'student', value: string) => {
    if (type === 'content') {
      setContentSearch(value);
    } else {
      setStudentSearch(value);
    }
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Get unique students for the dropdown
  const uniqueStudents = essays.reduce((acc: Student[], essay) => {
    if (!acc.find(s => s.id === essay.student.id)) {
      acc.push(essay.student);
    }
    return acc;
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/tools/essay-builder')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Essay Builder
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Essay Review</h1>
            <p className="text-gray-600">Review published student essays</p>
          </div>
        </div>
        <Badge className="bg-gray-100 text-gray-700">
          {pagination.total} Published Essays
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Essay List */}
        <div className="space-y-4">
          {/* Search Controls */}
          <div className="bg-white rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Search & Filter</h3>
            
            {/* Content Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search essay content..."
                value={contentSearch}
                onChange={(e) => handleSearch('content', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Student Search */}
            <div className="relative" ref={studentSelectorRef}>
              <Button
                variant="outline"
                onClick={() => setShowStudentSelector(!showStudentSelector)}
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {studentSearch || 'Filter by student...'}
                </span>
                <Search className="h-4 w-4" />
              </Button>

              {showStudentSelector && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-3 border-b">
                    <Input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearch}
                      onChange={(e) => handleSearch('student', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <button
                      onClick={() => {
                        handleSearch('student', '');
                        setShowStudentSelector(false);
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 text-sm"
                    >
                      All Students
                    </button>
                    {uniqueStudents.map(student => (
                      <button
                        key={student.id}
                        onClick={() => {
                          handleSearch('student', student.full_name);
                          setShowStudentSelector(false);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 text-sm"
                      >
                        <div className="font-medium">{student.full_name}</div>
                        <div className="text-xs text-gray-500">{student.email}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {(contentSearch || studentSearch) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setContentSearch('');
                  setStudentSearch('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Essays List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading essays...</p>
              </div>
            ) : essays.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No published essays found</p>
              </div>
            ) : (
              essays.map(essay => (
                <div
                  key={essay.id}
                  onClick={() => loadEssayContent(essay)}
                  className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedEssay?.id === essay.id ? 'border-gray-400 bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{essay.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {essay.student.full_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(essay.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      {essay.selectedEssayTitle && (
                        <div className="text-xs text-gray-400 mt-1">
                          Topic: {essay.selectedEssayTitle}
                        </div>
                      )}
                    </div>
                    <Eye className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} essays
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Essay Content Viewer */}
        <div className="lg:sticky lg:top-6">
          {selectedEssay ? (
            <div className="bg-white rounded-lg border">
              {/* Essay Header */}
              <div className="p-4 border-b">
                <h3 className="font-semibold text-lg text-gray-900">{selectedEssay.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {selectedEssay.student.full_name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedEssay.updated_at).toLocaleDateString()}
                  </div>
                </div>
                {selectedEssay.selectedEssayTitle && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Topic:</span> {selectedEssay.selectedEssayTitle}
                  </p>
                )}
              </div>

              {/* Essay Content */}
              <div className="p-4">
                {loadingContent ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading essay content...</p>
                  </div>
                ) : essayContent ? (
                  <div className="space-y-6">
                    {essayContent.essayParts?.map((part: any, index: number) => (
                      part.isComplete && part.generated && (
                        <div key={index} className="space-y-2">
                          <h4 className="font-medium text-gray-900 text-sm">{part.label}</h4>
                          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 leading-relaxed">
                            {part.generated}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Failed to load essay content</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Select an Essay</h3>
              <p className="text-gray-600">Click on an essay from the list to view its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}