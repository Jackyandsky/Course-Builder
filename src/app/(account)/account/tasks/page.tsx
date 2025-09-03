'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Spinner, Badge } from '@/components/ui';
import { Eye, Upload, CheckCircle, XCircle, Clock, FileText, Trophy } from 'lucide-react';

interface UserSubmission {
  id: string;
  task_id: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submission_text?: string;
  submitted_at: string;
  reviewed_at?: string;
  review_notes?: string;
  score?: number;
  task: {
    id: string;
    title: string;
    description?: string;
    points?: number;
    media_required?: boolean;
  };
  media_count?: number;
}

export default function UserTasksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'submitted'>('available');

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [authLoading, user]);

  const loadData = async () => {
    try {
      // Load user's submissions
      const submissionsRes = await fetch('/api/account/tasks/submissions');
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData);
      }

      // Load available tasks
      const tasksRes = await fetch('/api/account/tasks/available');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setAvailableTasks(tasksData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>,
      submitted: <Badge variant="primary"><FileText className="h-3 w-3 mr-1" />Submitted</Badge>,
      approved: <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>,
      rejected: <Badge variant="danger"><XCircle className="h-3 w-3 mr-1" />Needs Revision</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
  };

  const getScoreDisplay = (submission: UserSubmission) => {
    if (submission.status !== 'approved' || !submission.score) return null;
    
    const percentage = submission.task.points 
      ? Math.round((submission.score / submission.task.points) * 100)
      : 0;
    
    return (
      <div className="flex items-center gap-2">
        <Trophy className={`h-4 w-4 ${percentage >= 80 ? 'text-yellow-500' : 'text-gray-400'}`} />
        <span className="font-medium">
          {submission.score}/{submission.task.points || '?'} ({percentage}%)
        </span>
      </div>
    );
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600 mt-1">View and submit your assigned tasks</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {submissions.filter(s => s.status === 'approved').length}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </Card.Content>
          </Card>
          
          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {submissions.filter(s => s.status === 'submitted').length}
                  </p>
                  <p className="text-sm text-gray-600">Under Review</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </Card.Content>
          </Card>
          
          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {submissions.filter(s => s.status === 'pending').length}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </Card.Content>
          </Card>
          
          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {submissions
                      .filter(s => s.status === 'approved' && s.score)
                      .reduce((sum, s) => sum + (s.score || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Points</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'available' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('available')}
          >
            Available Tasks ({availableTasks.length})
          </Button>
          <Button
            variant={activeTab === 'submitted' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('submitted')}
          >
            My Submissions ({submissions.length})
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'available' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTasks.map((task) => {
              const submission = submissions.find(s => s.task_id === task.id);
              const isSubmitted = submission && submission.status !== 'pending';
              
              return (
                <Card key={task.id}>
                  <Card.Header>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      {submission && getStatusBadge(submission.status)}
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <p className="text-sm text-gray-600 mb-4">
                      {task.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-gray-500">Points: {task.points || 0}</span>
                      {task.media_required && (
                        <span className="text-blue-600">
                          <Upload className="h-4 w-4 inline mr-1" />
                          Media Required
                        </span>
                      )}
                    </div>
                    
                    <Button
                      variant={isSubmitted ? 'outline' : 'primary'}
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/tasks/${task.id}/submit`)}
                    >
                      {isSubmitted ? 'View Submission' : 'Start Task'}
                    </Button>
                  </Card.Content>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <Card.Content className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {submission.task.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {submission.task.points} points
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(submission.status)}
                        </td>
                        <td className="px-6 py-4">
                          {getScoreDisplay(submission)}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/tasks/${submission.task_id}/submit`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {submissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No submissions yet
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Review Notes for Rejected Tasks */}
        {submissions.filter(s => s.status === 'rejected' && s.review_notes).length > 0 && (
          <Card className="mt-8 border-red-200">
            <Card.Header className="bg-red-50">
              <h2 className="text-lg font-semibold text-red-900">Tasks Requiring Revision</h2>
            </Card.Header>
            <Card.Content className="space-y-4">
              {submissions
                .filter(s => s.status === 'rejected' && s.review_notes)
                .map((submission) => (
                  <div key={submission.id} className="border-l-4 border-red-400 pl-4">
                    <h3 className="font-medium text-gray-900">{submission.task.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{submission.review_notes}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => router.push(`/tasks/${submission.task_id}/submit`)}
                    >
                      Resubmit Task
                    </Button>
                  </div>
                ))}
            </Card.Content>
          </Card>
        )}
      </div>
    </div>
  );
}