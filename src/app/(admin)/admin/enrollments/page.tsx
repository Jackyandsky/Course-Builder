'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, Users, BookOpen, Calendar, 
  Search, Filter, Plus, Edit, Trash2, Eye,
  Download, Upload, CheckCircle, XCircle,
  Clock, TrendingUp, AlertCircle, ArrowLeft
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  schedule_id?: string;
  enrollment_date: string;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  completion_date?: string;
  resource: {
    type: string;
    source: string;
  };
  enrolled_by?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  course?: {
    id: string;
    title: string;
    difficulty: string;
    duration_hours: number;
  };
  schedule?: {
    id: string;
    name: string;
    start_date: string;
    end_date?: string;
  };
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  averageProgress: number;
  recentEnrollments: number;
}

export default function EnrollmentsPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    averageProgress: 0,
    recentEnrollments: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // New enrollment form state
  const [newEnrollment, setNewEnrollment] = useState({
    user_id: '',
    course_id: '',
    schedule_id: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [creatingEnrollment, setCreatingEnrollment] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState('');

  useEffect(() => {
    loadData();
    loadCourses();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/enrollments');
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      
      const data = await response.json();
      setEnrollments(data.enrollments || []);
      
      // Calculate stats
      const stats = data.enrollments?.reduce((acc: Stats, enrollment: Enrollment) => {
        acc.total++;
        if (enrollment.status === 'active') acc.active++;
        if (enrollment.status === 'completed') acc.completed++;
        if (enrollment.status === 'cancelled') acc.cancelled++;
        acc.averageProgress += enrollment.progress || 0;
        
        // Count recent enrollments (last 7 days)
        const enrollDate = new Date(enrollment.enrollment_date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (enrollDate >= sevenDaysAgo) acc.recentEnrollments++;
        
        return acc;
      }, {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        averageProgress: 0,
        recentEnrollments: 0
      }) || {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        averageProgress: 0,
        recentEnrollments: 0
      };
      
      if (stats.total > 0) {
        stats.averageProgress = Math.round(stats.averageProgress / stats.total);
      }
      
      setStats(stats);
    } catch (error) {
      console.error('Error loading enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.data?.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSchedules = async (courseId: string) => {
    if (!courseId) {
      setSchedules([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/schedules?course_id=${courseId}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setSchedules([]);
    }
  };
  
  const updateAvailableCourses = (userId: string) => {
    if (!userId) {
      setAvailableCourses(courses);
      return;
    }
    
    // Get courses that the user is already enrolled in
    const userEnrollments = enrollments.filter(e => e.user_id === userId);
    const enrolledCourseIds = userEnrollments.map(e => e.course_id);
    
    // Filter out already enrolled courses
    const available = courses.filter(course => !enrolledCourseIds.includes(course.id));
    setAvailableCourses(available);
  };

  const handleCreateEnrollment = async () => {
    setEnrollmentError('');
    
    if (!newEnrollment.user_id || !newEnrollment.course_id) {
      setEnrollmentError('Please select both a user and a course');
      return;
    }
    
    setCreatingEnrollment(true);
    try {
      const response = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEnrollment)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create enrollment');
      }
      
      // Reload enrollments
      await loadData();
      
      // Reset form and close modal
      setNewEnrollment({ user_id: '', course_id: '', schedule_id: '' });
      setShowAddModal(false);
      setSchedules([]);
    } catch (error: any) {
      console.error('Error creating enrollment:', error);
      setEnrollmentError(error.message || 'Failed to create enrollment');
    } finally {
      setCreatingEnrollment(false);
    }
  };

  const handleDelete = async (enrollmentId: string) => {
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete enrollment');
      
      await loadData();
      setShowDeleteModal(false);
      setSelectedEnrollment(null);
    } catch (error) {
      console.error('Error deleting enrollment:', error);
    }
  };

  const handleStatusChange = async (enrollmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update enrollment status');
      
      await loadData();
    } catch (error) {
      console.error('Error updating enrollment:', error);
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesUser = enrollment.user?.full_name?.toLowerCase().includes(search) ||
                          enrollment.user?.email?.toLowerCase().includes(search);
      const matchesCourse = enrollment.course?.title?.toLowerCase().includes(search);
      if (!matchesUser && !matchesCourse) return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'all' && enrollment.status !== statusFilter) return false;
    
    // Apply course filter
    if (courseFilter !== 'all' && enrollment.course_id !== courseFilter) return false;
    
    return true;
  });

  const statusColors = {
    active: 'success',
    completed: 'primary',
    cancelled: 'danger',
    paused: 'warning'
  } as const;

  const columns = [
    {
      key: 'user',
      label: 'Student',
      render: (enrollment: Enrollment) => (
        <div>
          <button
            onClick={() => router.push(`/admin/users/${enrollment.user_id}`)}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
          >
            {enrollment.user?.full_name || 'Unknown User'}
          </button>
          <p className="text-sm text-gray-600">{enrollment.user?.email}</p>
        </div>
      )
    },
    {
      key: 'course',
      label: 'Course',
      render: (enrollment: Enrollment) => (
        <div>
          <p className="font-medium">{enrollment.course?.title || 'Unknown Course'}</p>
          {enrollment.schedule && (
            <p className="text-sm text-gray-600">Schedule: {enrollment.schedule.name}</p>
          )}
        </div>
      )
    },
    {
      key: 'resource',
      label: 'Source',
      render: (enrollment: Enrollment) => (
        <div>
          <p className="text-sm font-medium">
            {(enrollment as any).resource?.source || 'Unknown'}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (enrollment: Enrollment) => (
        <Select
          value={enrollment.status}
          onChange={(e) => handleStatusChange(enrollment.id, e.target.value)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'paused', label: 'Paused' }
          ]}
          className="w-32"
        />
      )
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (enrollment: Enrollment) => (
        <div className="w-40">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${enrollment.progress || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium">{enrollment.progress || 0}%</span>
          </div>
          <p className="text-xs text-gray-600">
            {(enrollment as any).completed_lessons || 0}/{(enrollment as any).total_lessons || 0} lessons
          </p>
        </div>
      )
    },
    {
      key: 'enrolled',
      label: 'Enrolled',
      render: (enrollment: Enrollment) => (
        <div>
          <p className="text-sm">{new Date(enrollment.enrollment_date).toLocaleDateString()}</p>
          {enrollment.completion_date && (
            <p className="text-xs text-gray-600">
              Completed: {new Date(enrollment.completion_date).toLocaleDateString()}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (enrollment: Enrollment) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/enrollments/${enrollment.id}`)}
            title="View enrollment details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedEnrollment(enrollment);
              setShowDeleteModal(true);
            }}
            className="text-red-600 hover:bg-red-50"
            title="Delete enrollment"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/users')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Users
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Enrollment Management</h1>
            <p className="text-gray-600 mt-1">Manage course enrollments and student progress</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary"
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export
          </Button>
          <Button 
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setShowAddModal(true);
              loadUsers();
              setAvailableCourses(courses);
              setNewEnrollment({ user_id: '', course_id: '', schedule_id: '' });
              setSchedules([]);
            }}
          >
            New Enrollment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-500" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold">{stats.averageProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{stats.recentEnrollments}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by student or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'paused', label: 'Paused' }
              ]}
              className="w-48"
            />
            <Select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Courses' },
                ...courses.map(course => ({
                  value: course.id,
                  label: course.title
                }))
              ]}
              className="w-64"
            />
          </div>
        </Card.Content>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <Card.Content className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <Spinner size="lg" />
              <p className="text-gray-600 mt-4">Loading enrollments...</p>
            </div>
          ) : filteredEnrollments.length > 0 ? (
            <Table columns={columns} data={filteredEnrollments} />
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No enrollments found</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm || statusFilter !== 'all' || courseFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create your first enrollment to get started'}
              </p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedEnrollment(null);
        }}
        title="Delete Enrollment"
        className="max-w-md"
      >
        <p className="text-gray-600">
          Are you sure you want to delete this enrollment? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedEnrollment(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => selectedEnrollment && handleDelete(selectedEnrollment.id)}
          >
            Delete Enrollment
          </Button>
        </div>
      </Modal>

      {/* Add Enrollment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewEnrollment({ user_id: '', course_id: '', schedule_id: '' });
          setEnrollmentError('');
          setSchedules([]);
          setAvailableCourses(courses);
        }}
        title="New Enrollment"
        className="max-w-lg"
      >
        <div className="space-y-4">
          {enrollmentError && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-md">
              <p className="text-sm text-red-800">{enrollmentError}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User <span className="text-red-500">*</span>
            </label>
            <Select
              value={newEnrollment.user_id}
              onChange={(e) => {
                const userId = e.target.value;
                setNewEnrollment({...newEnrollment, user_id: userId, course_id: '', schedule_id: ''});
                updateAvailableCourses(userId);
                setSchedules([]);
              }}
              options={[
                { value: '', label: 'Select a user...' },
                ...users.map(user => ({
                  value: user.id,
                  label: `${user.full_name || 'Unnamed'} (${user.email || user.id}) - ${user.role}`
                }))
              ]}
              className="w-full"
            />
            {users.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">No users available. Create a user first.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Course <span className="text-red-500">*</span>
            </label>
            <Select
              value={newEnrollment.course_id}
              onChange={(e) => {
                setNewEnrollment({...newEnrollment, course_id: e.target.value, schedule_id: ''});
                loadSchedules(e.target.value);
              }}
              disabled={!newEnrollment.user_id}
              options={[
                { value: '', label: newEnrollment.user_id ? 'Select a course...' : 'Select a user first' },
                ...availableCourses.map(course => ({
                  value: course.id,
                  label: course.title
                }))
              ]}
              className="w-full"
            />
            {newEnrollment.user_id && availableCourses.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">This user is already enrolled in all available courses.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Schedule (Optional)
            </label>
            <Select
              value={newEnrollment.schedule_id}
              onChange={(e) => setNewEnrollment({...newEnrollment, schedule_id: e.target.value})}
              disabled={!newEnrollment.course_id}
              options={[
                { value: '', label: 'No schedule (flexible learning)' },
                ...schedules.map(schedule => ({
                  value: schedule.id,
                  label: `${schedule.name} (${new Date(schedule.start_date).toLocaleDateString()})`
                }))
              ]}
              className="w-full"
            />
            {newEnrollment.course_id && schedules.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">No schedules available for this course.</p>
            )}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Enrollment Summary</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• User will be enrolled immediately</li>
              <li>• Status will be set to "Active"</li>
              <li>• Progress will start at 0%</li>
              <li>• User will receive access to course materials</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowAddModal(false);
              setNewEnrollment({ user_id: '', course_id: '', schedule_id: '' });
              setEnrollmentError('');
              setSchedules([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateEnrollment}
            loading={creatingEnrollment}
            disabled={!newEnrollment.user_id || !newEnrollment.course_id}
          >
            Create Enrollment
          </Button>
        </div>
      </Modal>
    </div>
  );
}