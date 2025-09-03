'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText, Upload, Download, Eye, 
  Search, Filter, Calendar, Clock,
  CheckCircle, AlertCircle, XCircle, Edit,
  File, Image, Video, Music, Paperclip, RefreshCw,
  ChevronDown, ChevronUp
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
    <Card className={`p-5 transition-all ${
      submission.status === 'revision_requested' ? 'border-yellow-300 bg-yellow-50/50' : ''
    }`}>
      {/* Header - Always visible */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {getStatusIcon(submission.status)}
          <h3 className="text-base font-semibold text-gray-900">{submission.title}</h3>
          {getStatusBadge(submission.status)}
          {submission.media_required && (
            <Badge variant="info" size="sm">
              <Paperclip className="h-3 w-3 mr-1" />
              Files Required
            </Badge>
          )}
          {submission.score !== undefined && submission.max_points && (
            <span className="text-sm font-bold text-gray-700">
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
      <div className="mb-3">
        {submission.assignment && (
          <p className="text-sm text-gray-600 mb-2">{submission.assignment}</p>
        )}
        <div className="text-sm text-gray-700">
          <span className="font-medium">{submission.course}</span>
          {submission.lessonTitle && (
            <span className="text-gray-500 ml-3">
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
              <ChevronUp className="h-4 w-4" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show Details
            </>
          )}
        </button>
      )}
      
      {/* Expandable Details - Lazy loaded */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Student Submission */}
          {(submission.submission_text || submission.files?.length) && (
            <div className="border-l-2 border-blue-400 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-600">STUDENT SUBMISSION</span>
                <span className="text-xs text-gray-500">
                  {formatDate(submission.submitted_at || submission.created_at)}
                </span>
              </div>
              
              {submission.submission_text && (
                <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {submission.submission_text}
                  </p>
                </div>
              )}
              
              {submission.files?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  {submission.files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1">
                      {getFileIcon(file.category)}
                      <a
                        href={`/api/account/submissions/${submission.id}/download?fileIndex=${idx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
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
            <div className="border-l-2 border-green-400 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-600">REVIEWER FEEDBACK</span>
                {submission.reviewed_at && (
                  <span className="text-xs text-gray-500">
                    {formatDate(submission.reviewed_at)}
                  </span>
                )}
              </div>
              
              <div className={`border rounded-lg p-3 ${
                submission.status === 'approved' ? 'bg-green-50 border-green-200' :
                submission.status === 'revision_requested' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <p className="text-sm text-gray-700">{submission.review_notes}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch submissions with caching
  const fetchSubmissions = useCallback(async (forceRefresh = false) => {
    try {
      const cacheKey = `submissions-${filterStatus}`;
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(`${cacheKey}-time`);
      const now = Date.now();
      
      // Use cache if less than 30 seconds old
      if (!forceRefresh && cached && cacheTime) {
        const age = now - parseInt(cacheTime);
        if (age < 30000) {
          const cachedData = JSON.parse(cached);
          setSubmissions(cachedData.submissions);
          setStats(cachedData.stats);
          setLoading(false);
          return;
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
      
      // Cache results
      sessionStorage.setItem(cacheKey, JSON.stringify({
        submissions: filteredData,
        stats: data.stats
      }));
      sessionStorage.setItem(`${cacheKey}-time`, now.toString());
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

  // Filter and paginate submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      if (debouncedSearchTerm === '') return true;
      const search = debouncedSearchTerm.toLowerCase();
      return (
        submission.title.toLowerCase().includes(search) ||
        submission.assignment.toLowerCase().includes(search) ||
        submission.course.toLowerCase().includes(search) ||
        (submission.lessonTitle?.toLowerCase().includes(search) ?? false)
      );
    });
  }, [submissions, debouncedSearchTerm]);

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
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterType)}
              className="border border-gray-300 rounded-lg px-4 py-2 pr-10 min-w-[180px] focus:ring-2 focus:ring-blue-500"
            >
              <option value="needs_action">🔔 Needs Action</option>
              <option value="all">All Submissions</option>
              <option value="pending">📝 Draft</option>
              <option value="submitted">Submitted</option>
              <option value="revision_requested">⚠️ Revision</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Draft</p>
              <p className="text-2xl font-semibold">{stats.pending}</p>
            </div>
            <Edit className="h-5 w-5 text-gray-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Submitted</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.submitted}</p>
            </div>
            <Upload className="h-5 w-5 text-blue-400" />
          </div>
        </Card>
        
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Revision</p>
              <p className="text-2xl font-semibold text-yellow-700">{stats.revision_requested}</p>
            </div>
            <RefreshCw className="h-5 w-5 text-yellow-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-semibold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="h-5 w-5 text-red-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Score</p>
              <p className="text-2xl font-semibold">
                {stats.avgScore !== null ? `${stats.avgScore}%` : '--'}
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-gray-400" />
          </div>
        </Card>
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