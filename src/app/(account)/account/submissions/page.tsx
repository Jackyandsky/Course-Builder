'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText, Upload, Download, Eye, 
  Search, Filter, Calendar, Clock,
  CheckCircle, AlertCircle, XCircle, Edit,
  File, Image, Video, Music, Paperclip, RefreshCw,
  ChevronDown, ChevronUp, BookOpen
} from 'lucide-react';
import Link from 'next/link';

interface SubmissionFile {
  name: string;
  url: string;
  size: number;
  type: string;
  category: string;
  uploadedAt?: string;
}

interface Submission {
  id: string;
  title: string;
  assignment: string;
  course: string;
  courseId?: string;
  lessonId?: string;
  lessonTitle?: string;
  lessonNumber?: number;
  type: 'essay' | 'project' | 'assignment' | 'quiz' | 'exam';
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'revision_requested';
  submitted_at?: string;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string;
  score?: number;
  max_points?: number;
  review_notes?: string;
  response_file_url?: string;
  files?: SubmissionFile[];
  file_count?: number;
  total_size?: number;
  task_id: string;
  media_required?: boolean;
  submission_text?: string;
}

interface Stats {
  total: number;
  pending: number;
  submitted: number;
  approved: number;
  rejected: number;
  revision_requested: number;
  avgScore: number | null;
}

type FilterType = 'all' | 'pending' | 'submitted' | 'approved' | 'rejected' | 'revision_requested' | 'needs_action';

// Helper functions
const getStatusBadge = (status: Submission['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" size="sm">Draft</Badge>;
    case 'submitted':
      return <Badge variant="info" size="sm">Submitted</Badge>;
    case 'approved':
      return <Badge variant="success" size="sm">Approved</Badge>;
    case 'rejected':
      return <Badge variant="danger" size="sm">Rejected</Badge>;
    case 'revision_requested':
      return <Badge variant="warning" size="sm">Revision</Badge>;
    default:
      return <Badge variant="default" size="sm">{status}</Badge>;
  }
};

const getStatusIcon = (status: Submission['status']) => {
  switch (status) {
    case 'pending':
      return <Edit className="h-4 w-4 text-gray-400" />;
    case 'submitted':
      return <Upload className="h-4 w-4 text-blue-500" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'revision_requested':
      return <RefreshCw className="h-4 w-4 text-yellow-500" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getFileIcon = (category: string) => {
  switch (category) {
    case 'image':
      return <Image className="h-4 w-4" />;
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'audio':
      return <Music className="h-4 w-4" />;
    default:
      return <File className="h-4 w-4" />;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Optimized Submission Card Component with lazy loading
const SubmissionCard = React.memo(({ 
  submission, 
  onResubmit,
  editingSubmission,
  editFiles,
  onFileSelect,
  onRemoveFile,
  uploading
}: {
  submission: Submission;
  onResubmit: (submission: Submission) => void;
  editingSubmission: string | null;
  editFiles: { [submissionId: string]: File[] };
  onFileSelect: (submissionId: string, files: FileList | null) => void;
  onRemoveFile: (submissionId: string, index: number) => void;
  uploading: string | null;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-lg p-3 transition-all ${
      submission.status === 'revision_requested' ? 'border-yellow-300 bg-yellow-50/50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Header - Always visible */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {getStatusIcon(submission.status)}
          <h3 className="text-base font-semibold text-gray-900">{submission.title}</h3>
          {getStatusBadge(submission.status)}
          {submission.media_required && (
            <Badge variant="info" size="sm">
              <Paperclip className="h-3 w-3 mr-1" />
              Files
            </Badge>
          )}
          {submission.score !== undefined && submission.max_points && (
            <span className="text-xs font-bold text-gray-700">
              {submission.score}/{submission.max_points} ({Math.round((submission.score / submission.max_points) * 100)}%)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {submission.status === 'pending' && submission.task_id && (
            <Link href={`/tasks/${submission.task_id}/submit${submission.courseId || submission.lessonId ? '?' : ''}${submission.courseId ? `courseId=${submission.courseId}` : ''}${submission.courseId && submission.lessonId ? '&' : ''}${submission.lessonId ? `lessonId=${submission.lessonId}` : ''}`}>
              <Button variant="primary" size="sm">
                <Edit className="h-3.5 w-3.5 mr-1" />
                Complete
              </Button>
            </Link>
          )}
          
          {submission.status === 'revision_requested' && submission.task_id && (
            <Link href={`/tasks/${submission.task_id}/submit${submission.courseId || submission.lessonId ? '?' : ''}${submission.courseId ? `courseId=${submission.courseId}` : ''}${submission.courseId && submission.lessonId ? '&' : ''}${submission.lessonId ? `lessonId=${submission.lessonId}` : ''}`}>
              <Button variant="warning" size="sm" className="animate-pulse">
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Revise
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      {/* Basic Info - Always visible */}
      <div className="mb-2">
        {submission.assignment && (
          <p className="text-sm text-gray-600 mb-1">{submission.assignment}</p>
        )}
        <div className="text-sm text-gray-700">
          <span className="font-medium">{submission.course}</span>
          {submission.lessonTitle && (
            <span className="text-gray-500 ml-2">
              Session {submission.lessonNumber}: {submission.lessonTitle}
            </span>
          )}
        </div>
      </div>
      
      {/* Expand/Collapse Button */}
      {(submission.submission_text || submission.files?.length || submission.review_notes) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show Details
            </>
          )}
        </button>
      )}
      
      {/* Expandable Details - Lazy loaded */}
      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Student Submission */}
          {(submission.submission_text || submission.files?.length) && (
            <div className="border-l-2 border-blue-400 pl-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-600">STUDENT SUBMISSION</span>
                <span className="text-xs text-gray-500">
                  {formatDate(submission.submitted_at || submission.created_at)}
                </span>
              </div>
              
              {submission.submission_text && (
                <div className="bg-white border border-gray-200 rounded p-2 mb-2">
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                    {submission.submission_text}
                  </p>
                </div>
              )}
              
              {submission.files?.length > 0 && (
                <div className="bg-gray-50 rounded p-2 border border-gray-200">
                  {submission.files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-0.5">
                      {getFileIcon(file.category)}
                      <a
                        href={`/api/account/submissions/${submission.id}/download?fileIndex=${idx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {file.name}
                      </a>
                      <span className="text-xs text-gray-500">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Reviewer Feedback */}
          {submission.review_notes && (
            <div className="border-l-2 border-green-400 pl-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-600">REVIEWER FEEDBACK</span>
                {submission.reviewed_at && (
                  <span className="text-xs text-gray-500">
                    {formatDate(submission.reviewed_at)}
                  </span>
                )}
              </div>
              
              <div className={`border rounded p-2 ${
                submission.status === 'approved' ? 'bg-green-50 border-green-200' :
                submission.status === 'revision_requested' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <p className="text-xs text-gray-700">{submission.review_notes}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SubmissionCard.displayName = 'SubmissionCard';

export default function SubmissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    revision_requested: 0,
    avgScore: null
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterType>('needs_action');
  const [editingSubmission, setEditingSubmission] = useState<string | null>(null);
  const [editFiles, setEditFiles] = useState<{ [submissionId: string]: File[] }>({});
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Course filter state
  const [showCourseFilter, setShowCourseFilter] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const courseFilterRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch submissions with caching
  const fetchSubmissions = useCallback(async (forceRefresh = false) => {
    try {
      const cacheKey = `submissions-${filterStatus}`;
      const now = Date.now();
      
      // Use cache if less than 30 seconds old (SSR safe)
      if (!forceRefresh && typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        const cached = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(`${cacheKey}-time`);
        
        if (cached && cacheTime) {
          const age = now - parseInt(cacheTime);
          if (age < 30000) {
            const cachedData = JSON.parse(cached);
            setSubmissions(cachedData.submissions);
            setStats(cachedData.stats);
            setLoading(false);
            return;
          }
        }
      }
      
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all' && filterStatus !== 'needs_action') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/account/submissions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      let filteredData = data.submissions || [];
      
      // Apply needs_action filter on client side
      if (filterStatus === 'needs_action') {
        filteredData = filteredData.filter((s: Submission) => 
          s.status === 'pending' || 
          s.status === 'submitted' || 
          s.status === 'revision_requested' ||
          s.status === 'rejected'
        );
      }
      
      setSubmissions(filteredData);
      setStats(data.stats || {
        total: 0,
        pending: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        revision_requested: 0,
        avgScore: null
      });
      
      // Cache results (SSR safe)
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          submissions: filteredData,
          stats: data.stats
        }));
        sessionStorage.setItem(`${cacheKey}-time`, now.toString());
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  // Initial fetch
  useEffect(() => {
    if (!authLoading && user) {
      fetchSubmissions();
    }
  }, [authLoading, user, fetchSubmissions]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Handle click outside course filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseFilterRef.current && !courseFilterRef.current.contains(event.target as Node)) {
        setShowCourseFilter(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter and paginate submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      // Course filter
      if (selectedCourse && submission.course !== selectedCourse) {
        return false;
      }
      
      // Search filter
      if (debouncedSearchTerm === '') return true;
      const search = debouncedSearchTerm.toLowerCase();
      return (
        submission.title.toLowerCase().includes(search) ||
        submission.assignment.toLowerCase().includes(search) ||
        submission.course.toLowerCase().includes(search) ||
        (submission.lessonTitle?.toLowerCase().includes(search) ?? false)
      );
    });
  }, [submissions, debouncedSearchTerm, selectedCourse]);

  // Calculate pagination
  useEffect(() => {
    const total = Math.ceil(filteredSubmissions.length / itemsPerPage);
    setTotalPages(total);
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredSubmissions.length, itemsPerPage, currentPage]);

  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredSubmissions.slice(start, end);
  }, [filteredSubmissions, currentPage, itemsPerPage]);
  
  // Get unique courses for filter dropdown
  const uniqueCourses = useMemo(() => {
    const courses = new Set<string>();
    submissions.forEach(sub => {
      if (sub.course) {
        courses.add(sub.course);
      }
    });
    return Array.from(courses).sort();
  }, [submissions]);
  
  // Get filtered courses for dropdown search
  const getFilteredCourses = useCallback(() => {
    if (!courseSearchTerm) return uniqueCourses;
    
    const searchLower = courseSearchTerm.toLowerCase();
    return uniqueCourses.filter(course => 
      course.toLowerCase().includes(searchLower)
    );
  }, [uniqueCourses, courseSearchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById('submissions-list')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  const handleFileSelect = (submissionId: string, files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    const maxSize = 200 * 1024 * 1024; // 200MB
    
    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        alert(`${file.name} exceeds 200MB limit`);
        return;
      }
      validFiles.push(file);
    });
    
    if (validFiles.length > 0) {
      setEditFiles(prev => ({
        ...prev,
        [submissionId]: validFiles
      }));
    }
  };

  const removeEditFile = (submissionId: string, index: number) => {
    setEditFiles(prev => ({
      ...prev,
      [submissionId]: prev[submissionId].filter((_, i) => i !== index)
    }));
  };

  const handleResubmit = async (submission: Submission) => {
    const files = editFiles[submission.id];
    if (!files || files.length === 0) {
      alert('Please select files to upload');
      return;
    }
    
    setUploading(submission.id);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch(`/api/tasks/${submission.task_id}/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      setEditingSubmission(null);
      setEditFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[submission.id];
        return newFiles;
      });
      
      await fetchSubmissions(true);
      alert('Files resubmitted successfully!');
    } catch (error) {
      console.error('Resubmit error:', error);
      alert('Failed to resubmit files');
    } finally {
      setUploading(null);
    }
  };

  // Loading skeleton
  if (loading && submissions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-5">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">My Submissions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your task submissions and uploaded files
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Course Filter Button */}
            <div className="relative" ref={courseFilterRef}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCourseFilter(!showCourseFilter)}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                {selectedCourse || 'All Courses'}
                <ChevronDown className={`h-3 w-3 transition-transform ${showCourseFilter ? 'rotate-180' : ''}`} />
              </Button>
              
              {showCourseFilter && (
                <div className="absolute top-full mt-2 left-0 w-80 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={courseSearchTerm}
                        onChange={(e) => setCourseSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    <div
                      onClick={() => {
                        setSelectedCourse(null);
                        setShowCourseFilter(false);
                        setCourseSearchTerm('');
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b text-sm font-medium"
                    >
                      All Courses
                    </div>
                    {getFilteredCourses().length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No courses match your search
                      </div>
                    ) : (
                      getFilteredCourses().map(course => (
                        <div
                          key={course}
                          onClick={() => {
                            setSelectedCourse(course);
                            setShowCourseFilter(false);
                            setCourseSearchTerm('');
                          }}
                          className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                            selectedCourse === course ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="text-sm font-medium">{course}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {submissions.filter(s => s.course === course).length} submissions
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedCourse || filterStatus !== 'needs_action') && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Active filters:</span>
          {selectedCourse && (
            <Badge 
              variant="info" 
              className="cursor-pointer hover:bg-blue-200"
              onClick={() => setSelectedCourse(null)}
            >
              Course: {selectedCourse} ×
            </Badge>
          )}
          {filterStatus !== 'needs_action' && (
            <Badge 
              variant="secondary"
              className="cursor-pointer hover:bg-gray-200"
              onClick={() => setFilterStatus('needs_action')}
            >
              Status: {filterStatus === 'all' ? 'All Submissions' : 
                       filterStatus === 'pending' ? 'Draft' :
                       filterStatus === 'submitted' ? 'Submitted' :
                       filterStatus === 'approved' ? 'Approved' :
                       filterStatus === 'rejected' ? 'Rejected' :
                       filterStatus === 'revision_requested' ? 'Revision' :
                       filterStatus} ×
            </Badge>
          )}
          <button
            onClick={() => {
              setSelectedCourse(null);
              setFilterStatus('needs_action');
            }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Stats Grid - Flattened Clickable Status Filters */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <div 
          className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-gray-300 ${filterStatus === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
          onClick={() => setFilterStatus('all')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-semibold">{stats.total}</p>
            </div>
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div 
          className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-gray-300 ${filterStatus === 'pending' ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}
          onClick={() => setFilterStatus('pending')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Draft</p>
              <p className="text-xl font-semibold">{stats.pending}</p>
            </div>
            <Edit className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div 
          className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-gray-300 ${filterStatus === 'submitted' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
          onClick={() => setFilterStatus('submitted')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Submitted</p>
              <p className="text-xl font-semibold text-blue-600">{stats.submitted}</p>
            </div>
            <Upload className="h-4 w-4 text-blue-400" />
          </div>
        </div>
        
        <div 
          className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-gray-300 ${filterStatus === 'revision_requested' ? 'border-yellow-500 bg-yellow-50' : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'}`}
          onClick={() => setFilterStatus('revision_requested')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-700">Revision</p>
              <p className="text-xl font-semibold text-yellow-700">{stats.revision_requested}</p>
            </div>
            <RefreshCw className="h-4 w-4 text-yellow-600" />
          </div>
        </div>
        
        <div 
          className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-gray-300 ${filterStatus === 'approved' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
          onClick={() => setFilterStatus('approved')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-xl font-semibold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
        </div>

        <div 
          className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-gray-300 ${filterStatus === 'rejected' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
          onClick={() => setFilterStatus('rejected')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-xl font-semibold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
        </div>
        
        <div className="p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Avg Score</p>
              <p className="text-xl font-semibold">
                {stats.avgScore !== null ? `${stats.avgScore}%` : '--'}
              </p>
            </div>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div id="submissions-list">
        {filteredSubmissions.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No matching submissions' : 'No submissions yet'}
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Your task submissions will appear here'
                }
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onResubmit={handleResubmit}
                  editingSubmission={editingSubmission}
                  editFiles={editFiles}
                  onFileSelect={handleFileSelect}
                  onRemoveFile={removeEditFile}
                  uploading={uploading}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredSubmissions.length)} of{' '}
                  {filteredSubmissions.length} submissions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            pageNum === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}