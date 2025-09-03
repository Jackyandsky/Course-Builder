'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Spinner, Badge } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, Upload, FileText, Target, Calendar, User } from 'lucide-react';

interface TaskDetail {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  priority?: string;
  points?: number;
  tags?: string[];
  status?: string;
  media_required?: boolean;
  allowed_media_types?: string[];
  max_file_size_mb?: number;
  max_files_count?: number;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
    color?: string;
  };
  submission_count?: number;
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionStats, setSubmissionStats] = useState<any>(null);

  useEffect(() => {
    loadTask();
    loadSubmissionStats();
  }, [params.id]);

  const loadTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`);
      if (!response.ok) throw new Error('Failed to load task');
      const data = await response.json();
      // Set defaults for media settings
      setTask({
        ...data,
        max_file_size_mb: data.max_file_size_mb || 200,
        max_files_count: data.max_files_count || 5,
        allowed_media_types: data.allowed_media_types || ['image', 'video', 'audio', 'document']
      });
    } catch (error) {
      console.error('Error loading task:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionStats = async () => {
    try {
      const response = await fetch(`/api/admin/tasks/${params.id}/submissions/stats`);
      if (response.ok) {
        const data = await response.json();
        setSubmissionStats(data);
      }
    } catch (error) {
      console.error('Error loading submission stats:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');
      
      alert('Task deleted successfully');
      router.push('/admin/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'secondary' as const,
      medium: 'warning' as const,
      high: 'danger' as const,
      urgent: 'primary' as const,
    };
    return <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <p className="text-center text-gray-600">Task not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/tasks')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              {task.category && (
                <span 
                  className="inline-block mt-2 px-3 py-1 text-sm rounded-full"
                  style={{ 
                    backgroundColor: task.category.color + '20', 
                    color: task.category.color 
                  }}
                >
                  {task.category.name}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/submissions?task=${params.id}`)}
                leftIcon={<FileText className="h-4 w-4" />}
              >
                View Submissions
                {submissionStats && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {submissionStats.total}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/tasks/${params.id}/edit`)}
                leftIcon={<Edit className="h-4 w-4" />}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">Description</h2>
              </Card.Header>
              <Card.Content>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.description || 'No description provided'}
                </p>
              </Card.Content>
            </Card>

            {/* Media Requirements */}
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">Media Upload Requirements</h2>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Media Required</span>
                  <Badge variant={task.media_required ? 'primary' : 'secondary'}>
                    {task.media_required ? 'Yes' : 'No'}
                  </Badge>
                </div>

                {task.media_required && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Allowed File Types</h3>
                      <div className="flex flex-wrap gap-2">
                        {task.allowed_media_types?.map((type) => (
                          <Badge key={type} variant="outline">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Max File Size</h3>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {task.max_file_size_mb} MB
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Max Files</h3>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {task.max_files_count} files
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Upload className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-medium mb-1">Upload Information</p>
                          <ul className="space-y-1 text-blue-700">
                            <li>• Images: JPG, PNG, GIF, WebP, SVG (max 50MB each)</li>
                            <li>• Videos: MP4, WebM, MOV, AVI (max 200MB each)</li>
                            <li>• Audio: MP3, WAV, M4A, OGG (max 50MB each)</li>
                            <li>• Documents: PDF, DOC, DOCX, PPT, XLS, ZIP (max 100MB each)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Card.Content>
            </Card>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <Card>
                <Card.Header>
                  <h2 className="text-lg font-semibold">Tags</h2>
                </Card.Header>
                <Card.Content>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card.Content>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">Task Information</h2>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                  <div className="mt-1">{getPriorityBadge(task.priority || 'medium')}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Points</h3>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{task.points || 0}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <Badge variant="secondary">{task.status || 'Active'}</Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(task.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </Card.Content>
            </Card>

            {/* Submission Stats */}
            {submissionStats && (
              <Card>
                <Card.Header>
                  <h2 className="text-lg font-semibold">Submission Statistics</h2>
                </Card.Header>
                <Card.Content className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Submissions</span>
                    <span className="text-sm font-bold">{submissionStats.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending Review</span>
                    <span className="text-sm font-bold text-yellow-600">
                      {submissionStats.submitted || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Approved</span>
                    <span className="text-sm font-bold text-green-600">
                      {submissionStats.approved || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rejected</span>
                    <span className="text-sm font-bold text-red-600">
                      {submissionStats.rejected || 0}
                    </span>
                  </div>
                  {submissionStats.averageScore !== undefined && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Score</span>
                        <span className="text-sm font-bold">
                          {submissionStats.averageScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </Card.Content>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">Quick Actions</h2>
              </Card.Header>
              <Card.Content className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/account/tasks/${params.id}/submit`)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Preview Submission Page
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/tasks/${params.id}/submit`)}
                >
                  Copy Submission Link
                </Button>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}