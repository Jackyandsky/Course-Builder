'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, BookOpen, Calendar, Clock, 
  CheckCircle, AlertCircle, TrendingUp, Users,
  Edit, Trash2, ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';

interface EnrollmentDetail {
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
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  course: {
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

export default function EnrollmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const enrollmentId = params.id as string;
  
  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEnrollment();
  }, [enrollmentId]);

  const loadEnrollment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`);
      if (!response.ok) throw new Error('Failed to fetch enrollment');
      
      const data = await response.json();
      setEnrollment(data.enrollment);
    } catch (error) {
      console.error('Error loading enrollment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      await loadEnrollment();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete enrollment');
      
      router.push('/admin/enrollments');
    } catch (error) {
      console.error('Error deleting enrollment:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Enrollment not found</h2>
        <Button onClick={() => router.push('/admin/enrollments')}>
          Back to Enrollments
        </Button>
      </div>
    );
  }

  const statusColors = {
    active: 'success',
    completed: 'primary',
    cancelled: 'danger',
    paused: 'warning'
  } as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/enrollments')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Enrollments
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Enrollment Details</h1>
            <p className="text-gray-600 mt-1">
              {enrollment.user?.full_name || 'Unknown User'} - {enrollment.course?.title || 'Unknown Course'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/users/${enrollment.user_id}`)}
            leftIcon={<ExternalLink className="h-4 w-4" />}
          >
            View Student Profile
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="text-red-600 hover:bg-red-50"
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="font-medium">{enrollment.user?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="font-medium">{enrollment.user?.email || 'No email'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Role</label>
                  <Badge variant="secondary">{enrollment.user?.role || 'unknown'}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User ID</label>
                  <p className="text-sm font-mono text-gray-600">{enrollment.user_id}</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Course Information */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Information
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Course Title</label>
                  <p className="font-medium">{enrollment.course?.title || 'Unknown Course'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Difficulty</label>
                  <Badge variant="outline">{enrollment.course?.difficulty || 'unknown'}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Duration</label>
                  <p className="font-medium">{enrollment.course?.duration_hours || 0} hours</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Course ID</label>
                  <p className="text-sm font-mono text-gray-600">{enrollment.course_id}</p>
                </div>
              </div>

              {enrollment.schedule && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Schedule Name</label>
                      <p className="font-medium">{enrollment.schedule?.name || 'No schedule'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Start Date</label>
                      <p className="font-medium">
                        {enrollment.schedule?.start_date 
                          ? new Date(enrollment.schedule.start_date).toLocaleDateString()
                          : 'Not set'
                        }
                      </p>
                    </div>
                    {enrollment.schedule?.end_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">End Date</label>
                        <p className="font-medium">
                          {new Date(enrollment.schedule.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Progress Details */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Details
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-lg font-bold">{enrollment.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{enrollment.completed_lessons}</p>
                    <p className="text-sm text-gray-600">Completed Lessons</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{enrollment.total_lessons}</p>
                    <p className="text-sm text-gray-600">Total Lessons</p>
                  </div>
                </div>

                {enrollment.total_lessons > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Lessons Remaining</p>
                    <p className="text-lg font-semibold">
                      {enrollment.total_lessons - enrollment.completed_lessons} lessons left
                    </p>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Status Management</h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Status</label>
                  <div className="mt-2">
                    <Badge variant={statusColors[enrollment.status]} size="lg">
                      {enrollment.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button
                    variant={enrollment.status === 'active' ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() => handleStatusChange('active')}
                    disabled={enrollment.status === 'active'}
                  >
                    Mark as Active
                  </Button>
                  <Button
                    variant={enrollment.status === 'completed' ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() => handleStatusChange('completed')}
                    disabled={enrollment.status === 'completed'}
                  >
                    Mark as Completed
                  </Button>
                  <Button
                    variant={enrollment.status === 'paused' ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() => handleStatusChange('paused')}
                    disabled={enrollment.status === 'paused'}
                  >
                    Mark as Paused
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Enrollment Details */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Enrollment Details</h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Enrolled Date</label>
                  <p className="font-medium">
                    {new Date(enrollment.enrollment_date).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Source</label>
                  <p className="font-medium">{enrollment.resource?.source || 'Unknown source'}</p>
                </div>

                {enrollment.enrolled_by && enrollment.enrolled_by.id !== enrollment.user_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Enrolled By</label>
                    <p className="font-medium">{enrollment.enrolled_by.full_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{enrollment.enrolled_by.email || ''}</p>
                  </div>
                )}

                {enrollment.completion_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Completed Date</label>
                    <p className="font-medium">
                      {new Date(enrollment.completion_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Enrollment ID</label>
                  <p className="text-xs font-mono text-gray-600">{enrollment.id}</p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Enrollment"
        className="max-w-md"
      >
        <p className="text-gray-600">
          Are you sure you want to delete this enrollment for{' '}
          <strong>{enrollment.user?.full_name || 'Unknown User'}</strong> in{' '}
          <strong>{enrollment.course?.title || 'Unknown Course'}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleting}
          >
            Delete Enrollment
          </Button>
        </div>
      </Modal>
    </div>
  );
}