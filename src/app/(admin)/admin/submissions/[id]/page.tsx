'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Spinner, Badge, Textarea } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft, CheckCircle, XCircle, Download, FileText, User, Calendar, Clock, File, Image, Video, Music, Upload, X, Paperclip } from 'lucide-react';

interface SubmissionDetail {
  id: string;
  task_id: string;
  user_id: string;
  status: string;
  submission_text?: string;
  submission_data?: any;
  submitted_at: string;
  reviewed_at?: string;
  review_notes?: string;
  response_file_url?: string;
  score?: number;
  task: {
    id: string;
    title: string;
    description?: string;
    points?: number;
    media_required?: boolean;
    allowed_media_types?: string[];
    max_file_size_mb?: number;
    max_files_count?: number;
  };
  user: {
    email: string;
    user_profiles?: {
      full_name?: string;
    };
  };
  media_files: any[];
}

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSubmission();
  }, [params.id]);

  const loadSubmission = async () => {
    try {
      const response = await fetch(`/api/admin/submissions/${params.id}`);
      if (!response.ok) throw new Error('Failed to load submission');
      const data = await response.json();
      setSubmission(data);
      setScore(data.score || 0);
      setReviewNotes(data.review_notes || '');
    } catch (error) {
      console.error('Error loading submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'approved' | 'rejected' | 'revision_requested') => {
    if (!submission) return;

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('score', score.toString());
      formData.append('review_notes', reviewNotes);
      
      if (responseFile) {
        formData.append('response_file', responseFile);
      }

      const response = await fetch(`/api/admin/submissions/${params.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update submission');
      
      const statusMessages = {
        approved: 'Submission Approved',
        rejected: 'Submission Rejected',
        revision_requested: 'Revision Requested'
      };
      
      showSuccess(
        statusMessages[newStatus],
        'The submission has been reviewed and updated successfully.'
      );
      
      // Reload the page to show updated status instead of redirecting
      await loadSubmission();
      setResponseFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      showError('Update Failed', 'Failed to update the submission. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showError('File Too Large', 'Please select a file smaller than 10MB');
        return;
      }
      setResponseFile(file);
    }
  };

  const removeFile = () => {
    setResponseFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <p className="text-center text-gray-600">Submission not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/submissions')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{submission.task.title}</h1>
              <p className="text-gray-600 mt-1">Submission Review</p>
            </div>
            <div>{getStatusBadge(submission.status)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details */}
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">Task Details</h2>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Description</h3>
                  <p className="mt-1 text-gray-900">
                    {submission.task.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Points</h3>
                    <p className="mt-1 text-gray-900">{submission.task.points || 0}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Media Required</h3>
                    <p className="mt-1 text-gray-900">
                      {submission.task.media_required ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Submission Content */}
            {submission.submission_text && (
              <Card>
                <Card.Header>
                  <h2 className="text-lg font-semibold">Submission Text</h2>
                </Card.Header>
                <Card.Content>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {submission.submission_text}
                  </p>
                </Card.Content>
              </Card>
            )}

            {/* Uploaded Files */}
            {submission.media_files && submission.media_files.length > 0 && (
              <Card>
                <Card.Header>
                  <h2 className="text-lg font-semibold">Uploaded Files</h2>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-3">
                    {submission.media_files.map((file: any, index: number) => {
                      const getFileIcon = () => {
                        if (file.type?.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
                        if (file.type?.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
                        if (file.type?.startsWith('audio/')) return <Music className="h-5 w-5 text-green-500" />;
                        if (file.type?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
                        return <File className="h-5 w-5 text-gray-500" />;
                      };
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            {getFileIcon()}
                            <div>
                              <p className="font-medium text-sm text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.url && (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View/Download"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Review Section - Always visible for flexibility */}
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">
                  {submission.status === 'submitted' ? 'Review Submission' : 'Update Review'}
                </h2>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score (out of {submission.task.points || 0})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={submission.task.points || 100}
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes {submission.status !== 'submitted' && '(Update or add additional feedback)'}
                  </label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    placeholder="Add feedback for the student..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach Response File (Optional)
                  </label>
                  <div className="space-y-2">
                    {!responseFile ? (
                      <div className="flex items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileSelect}
                          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Choose File
                        </Button>
                        <span className="text-sm text-gray-500">
                          PDF, DOC, DOCX, TXT, or image files (max 10MB)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {responseFile.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(responseFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className="p-1"
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    variant="primary"
                    onClick={() => handleUpdateStatus('approved')}
                    loading={updating}
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                    className="font-semibold"
                  >
                    {submission.status === 'approved' ? 'Update & Keep Approved' : 'Approve Submission'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleUpdateStatus('revision_requested')}
                    loading={updating}
                    leftIcon={<Clock className="h-4 w-4" />}
                    className="font-semibold bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    Request Revision
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('rejected')}
                    loading={updating}
                    leftIcon={<XCircle className="h-4 w-4" />}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {submission.status === 'rejected' ? 'Keep Rejected' : 'Reject Submission'}
                  </Button>
                </div>
                
                {submission.status !== 'submitted' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> You can update the review at any time. The student will see the latest feedback and status.
                    </p>
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Previous Review */}
            {(submission.status !== 'submitted' && submission.status !== 'pending') && (
              <Card>
                <Card.Header>
                  <h2 className="text-lg font-semibold">Current Review Details</h2>
                </Card.Header>
                <Card.Content className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Score</h3>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {submission.score || 0}/{submission.task.points || 0}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Reviewed At</h3>
                      <p className="mt-1 text-gray-900">
                        {submission.reviewed_at 
                          ? new Date(submission.reviewed_at).toLocaleString()
                          : 'Not reviewed yet'}
                      </p>
                    </div>
                  </div>
                  
                  {submission.review_notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Review Notes</h3>
                      <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                        {submission.review_notes}
                      </p>
                    </div>
                  )}
                  
                  {submission.response_file_url && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Response File</h3>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              Reviewer's Response Document
                            </span>
                            <p className="text-xs text-gray-600 mt-0.5">
                              File attached by reviewer during assessment
                            </p>
                          </div>
                        </div>
                        <a
                          href={submission.response_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </div>
                    </div>
                  )}
                </Card.Content>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Student Info */}
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">Student Information</h2>
              </Card.Header>
              <Card.Content className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {submission.user.user_profiles?.full_name || 'No name'}
                    </p>
                    <p className="text-xs text-gray-500">{submission.user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Submitted
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Quick Stats */}
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">Submission Stats</h2>
              </Card.Header>
              <Card.Content className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Files Uploaded</span>
                  <span className="text-sm font-medium">
                    {submission.media_files.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Size</span>
                  <span className="text-sm font-medium">
                    {(submission.media_files.reduce((sum, file) => 
                      sum + (file.size || file.file_size || 0), 0) / (1024 * 1024)
                    ).toFixed(2)} MB
                  </span>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}