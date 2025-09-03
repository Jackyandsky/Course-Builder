'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Spinner, Badge } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { Eye, CheckCircle, XCircle, Clock, Download, FileText, Calendar, User, Search, Filter, RefreshCw, FileDown } from 'lucide-react';

interface Submission {
  id: string;
  task_id: string;
  user_id: string;
  course_id?: string;
  lesson_id?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'revision_requested';
  submission_text?: string;
  submission_data?: any;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  score?: number;
  task?: {
    title: string;
    points?: number;
    media_required?: boolean;
  };
  user?: {
    email: string;
    user_profiles?: {
      full_name?: string;
    };
  };
  course?: {
    id: string;
    title: string;
  };
  lesson?: {
    id: string;
    title: string;
    lesson_number: number;
  };
  media_count?: number;
}

interface Course {
  id: string;
  title: string;
}

interface Schedule {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_active?: boolean;
}

interface Lesson {
  id: string;
  title: string;
  lesson_number: number;
  course_id: string;
  schedule_id: string;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'approved' | 'rejected' | 'revision_requested'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'task' | 'student'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // New state for course, schedule and session filtering
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('all');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadSubmissions();
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId !== 'all') {
      loadSchedules(selectedCourseId);
    } else {
      setSchedules([]);
      setSelectedScheduleId('all');
      setLessons([]);
      setSelectedLessonId('all');
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedScheduleId !== 'all' && selectedCourseId !== 'all') {
      loadLessons(selectedCourseId, selectedScheduleId);
    } else {
      setLessons([]);
      setSelectedLessonId('all');
    }
  }, [selectedScheduleId]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/submissions');
      if (!response.ok) throw new Error('Failed to load submissions');
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Failed to load courses');
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadSchedules = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/schedules`);
      if (!response.ok) throw new Error('Failed to load schedules');
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setSchedules([]);
    }
  };

  const loadLessons = async (courseId: string, scheduleId?: string) => {
    try {
      let url = `/api/courses/${courseId}/lessons`;
      if (scheduleId) {
        url += `?schedule_id=${scheduleId}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load lessons');
      const data = await response.json();
      setLessons(data.lessons || []);
    } catch (error) {
      console.error('Error loading lessons:', error);
      setLessons([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>,
      submitted: <Badge variant="primary"><FileText className="h-3 w-3 mr-1" />Submitted</Badge>,
      approved: <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>,
      rejected: <Badge variant="danger"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>,
      revision_requested: <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Revision Requested</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
  };

  // Filter and sort submissions
  let filteredSubmissions = submissions.filter(sub => {
    const matchesFilter = filter === 'all' || sub.status === filter;
    const matchesSearch = searchTerm === '' || 
      sub.task?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourseId === 'all' || sub.course_id === selectedCourseId;
    const matchesLesson = selectedLessonId === 'all' || sub.lesson_id === selectedLessonId;
    return matchesFilter && matchesSearch && matchesCourse && matchesLesson;
  });

  // Sort submissions
  filteredSubmissions = [...filteredSubmissions].sort((a, b) => {
    let compareValue = 0;
    switch (sortBy) {
      case 'date':
        compareValue = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        break;
      case 'status':
        compareValue = a.status.localeCompare(b.status);
        break;
      case 'task':
        compareValue = (a.task?.title || '').localeCompare(b.task?.title || '');
        break;
      case 'student':
        const nameA = a.user?.user_profiles?.full_name || a.user?.email || '';
        const nameB = b.user?.user_profiles?.full_name || b.user?.email || '';
        compareValue = nameA.localeCompare(nameB);
        break;
    }
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const handleUpdateStatus = async (submissionId: string, newStatus: string, score?: number) => {
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, score }),
      });
      
      if (!response.ok) throw new Error('Failed to update submission');
      
      await loadSubmissions(); // Reload data
      showSuccess(`Submission ${newStatus}`, 'The submission has been updated successfully.');
    } catch (error) {
      console.error('Error updating submission:', error);
      showError('Update Failed', 'Failed to update the submission. Please try again.');
    }
  };

  const exportToCSV = () => {
    const headers = ['Task', 'Student Name', 'Email', 'Status', 'Score', 'Submitted Date', 'Media Files'];
    const rows = filteredSubmissions.map(sub => [
      sub.task?.title || '',
      sub.user?.user_profiles?.full_name || '',
      sub.user?.email || '',
      sub.status,
      sub.score !== undefined ? `${sub.score}/${sub.task?.points || '?'}` : '',
      new Date(sub.submitted_at).toLocaleDateString(),
      sub.media_count || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `submissions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Submissions</h1>
            <p className="text-gray-600 mt-1">Review and manage student task submissions</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={filteredSubmissions.length === 0}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={loadSubmissions}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by task name, student name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Course Filters
                {(selectedCourseId !== 'all' || selectedScheduleId !== 'all' || selectedLessonId !== 'all') && (
                  <span className="ml-1 bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">
                    Active
                  </span>
                )}
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
                <option value="task">Sort by Task</option>
                <option value="student">Sort by Student</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Course, Schedule and Session Filters */}
          {showFilters && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Course
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setSelectedScheduleId('all');
                      setSelectedLessonId('all');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Courses</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedCourseId !== 'all' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Schedule
                    </label>
                    <select
                      value={selectedScheduleId}
                      onChange={(e) => {
                        setSelectedScheduleId(e.target.value);
                        setSelectedLessonId('all');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={schedules.length === 0}
                    >
                      <option value="all">All Schedules</option>
                      {schedules.map(schedule => (
                        <option key={schedule.id} value={schedule.id}>
                          {schedule.name}
                          {schedule.start_date && ` (${new Date(schedule.start_date).toLocaleDateString()})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {selectedScheduleId !== 'all' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Session
                    </label>
                    <select
                      value={selectedLessonId}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={lessons.length === 0}
                    >
                      <option value="all">All Sessions</option>
                      {lessons.map(lesson => (
                        <option key={lesson.id} value={lesson.id}>
                          Session {lesson.lesson_number}: {lesson.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCourseId('all');
                      setSelectedScheduleId('all');
                      setSelectedLessonId('all');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
              
              {selectedCourseId !== 'all' && (
                <div className="text-sm text-gray-600">
                  Showing submissions for: 
                  <span className="font-medium ml-1">
                    {courses.find(c => c.id === selectedCourseId)?.title}
                  </span>
                  {selectedScheduleId !== 'all' && (
                    <span className="font-medium">
                      {' › '}
                      {schedules.find(s => s.id === selectedScheduleId)?.name}
                    </span>
                  )}
                  {selectedLessonId !== 'all' && (
                    <span className="font-medium">
                      {' › '}
                      {lessons.find(l => l.id === selectedLessonId)?.title}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2">
          {(['all', 'pending', 'submitted', 'approved', 'rejected', 'revision_requested'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'revision_requested' ? 'Revision' : status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {submissions.filter(s => s.status === status).length}
                </span>
              )}
            </Button>
          ))}
          </div>
        </div>

        {/* Submissions Table */}
        <Card>
          <Card.Content className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Media
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.task?.title || 'Unknown Task'}
                          </div>
                          {submission.task?.points && (
                            <div className="text-xs text-gray-500">
                              {submission.task.points} points
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {submission.user?.user_profiles?.full_name || submission.user?.email || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {submission.user?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(submission.submitted_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {submission.media_count && submission.media_count > 0 ? (
                            <>
                              <Download className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-gray-900">
                                {submission.media_count} file{submission.media_count > 1 ? 's' : ''}
                              </span>
                            </>
                          ) : submission.submission_data?.media_count > 0 ? (
                            <>
                              <Download className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-gray-900">
                                {submission.submission_data.media_count} file{submission.submission_data.media_count > 1 ? 's' : ''}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">
                              {submission.task?.media_required ? 'Required' : 'No files'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {submission.score !== undefined && submission.score !== null ? (
                            <span className="font-medium">
                              {submission.score}/{submission.task?.points || '?'}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/submissions/${submission.id}`)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(submission.status === 'submitted' || submission.status === 'pending') && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => {
                                  const maxPoints = submission.task?.points || 100;
                                  const score = prompt(`Enter score (0-${maxPoints}):`);
                                  if (score !== null) {
                                    const scoreNum = parseInt(score);
                                    if (!isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= maxPoints) {
                                      handleUpdateStatus(submission.id, 'approved', scoreNum);
                                    } else {
                                      showError('Invalid Score', `Please enter a valid score between 0 and ${maxPoints}`);
                                    }
                                  }
                                }}
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  if (confirm('Are you sure you want to reject this submission?')) {
                                    handleUpdateStatus(submission.id, 'rejected');
                                  }
                                }}
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredSubmissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No submissions found
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <Card.Content className="p-4">
              <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
              <div className="text-sm text-gray-600">Total Submissions</div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {submissions.filter(s => s.status === 'submitted').length}
              </div>
              <div className="text-sm text-gray-600">Awaiting Review</div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {submissions.filter(s => s.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-600">Approved</div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {submissions.filter(s => s.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-600">Rejected</div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}