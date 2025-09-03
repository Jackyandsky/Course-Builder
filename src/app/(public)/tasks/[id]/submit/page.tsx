'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Spinner, Badge } from '@/components/ui';
import { MediaUpload } from '@/components/tasks/MediaUpload';
import { ArrowLeft, CheckCircle, AlertCircle, Download, RefreshCw } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  points?: number;
  media_required: boolean;
  allowed_media_types: string[];
  max_file_size_mb: number;
  max_files_count: number;
  submission_type: 'text_only' | 'media_only' | 'both' | 'either';
  text_submission_enabled: boolean;
  min_text_length: number;
  max_text_length: number;
  text_submission_placeholder: string;
  text_submission_instructions: string;
}

interface SubmissionStatus {
  submission: any;
  can_submit: boolean;
  can_revise: boolean;
  review_feedback: {
    notes: string;
    score: number;
    reviewed_at: string;
    reviewer: string;
    response_file_url?: string;
  } | null;
  revision_count: number;
}

export default function TaskSubmitPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const courseId = searchParams.get('courseId');
  const lessonId = searchParams.get('lessonId');
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Wait for auth and prevent multiple initializations
    if (!authLoading) {
      if (user && !initialized) {
        setInitialized(true);
        loadTask();
        loadExistingFiles();
        checkSubmissionStatus();
      } else if (!user) {
        // Redirect to login if not authenticated
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
    }
  }, [params.id, authLoading, user, initialized]);

  const loadTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`);
      if (!response.ok) throw new Error('Failed to load task');
      const data = await response.json();
      setTask(data);
    } catch (error) {
      console.error('Error loading task:', error);
      alert('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingFiles = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}/media/list`);
      if (!response.ok) return;
      const data = await response.json();
      setUploadedFiles(data.media || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const checkSubmissionStatus = async () => {
    try {
      const url = new URL(`/api/tasks/${params.id}/submit`, window.location.origin);
      if (courseId) url.searchParams.append('courseId', courseId);
      if (lessonId) url.searchParams.append('lessonId', lessonId);
      const response = await fetch(url.toString());
      if (!response.ok) {
        console.log('Failed to check submission status, defaulting to can_submit: true');
        // If we can't check status, default to allowing submission
        setSubmissionStatus({
          submission: null,
          can_submit: true,
          can_revise: false,
          review_feedback: null,
          revision_count: 0
        });
        return;
      }
      const data = await response.json();
      console.log('Submission status:', data);
      setSubmissionStatus(data);
      
      // If there's existing submission text, load it
      if (data.submission?.submission_text) {
        setSubmissionText(data.submission.submission_text);
      }
    } catch (error) {
      console.error('Error checking submission status:', error);
      // Default to allowing submission on error
      setSubmissionStatus({
        submission: null,
        can_submit: true,
        can_revise: false,
        review_feedback: null,
        revision_count: 0
      });
    }
  };

  const handleSubmit = async () => {
    if (!task) return;
    
    // Prevent double submission
    if (submitting) {
      console.log('Already submitting, please wait...');
      return;
    }

    // Validation based on submission type
    const hasText = submissionText.trim().length > 0;
    const hasFiles = uploadedFiles.length > 0;

    if (task.submission_type === 'text_only' && !hasText) {
      alert('Please enter a text response before submitting');
      return;
    }

    if (task.submission_type === 'media_only' && !hasFiles) {
      alert('Please upload at least one file before submitting');
      return;
    }

    if (task.submission_type === 'both' && (!hasText || !hasFiles)) {
      alert('Please provide both a text response and upload at least one file');
      return;
    }

    // For 'either' type, allow empty submissions (just marking complete)
    // No validation needed - continue with submission


    setSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission_text: submissionText.trim(),
          course_id: courseId, // From URL params
          lesson_id: lessonId, // From URL params
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit');
      }

      const data = await response.json();
      
      // Check if this was a revision
      const isRevision = submissionStatus?.can_revise || submissionStatus?.submission?.status === 'revision_requested';
      
      if (isRevision) {
        alert('Your revision has been submitted successfully!');
        // Go back to submissions page for revisions
        router.push('/account/submissions');
      } else {
        alert('Task submitted successfully!');
        // Go to submissions page instead of tasks to avoid potential loops
        router.push('/account/submissions');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
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
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          {task.description && (
            <p className="mt-2 text-gray-600">{task.description}</p>
          )}
        </div>

        {/* Review Feedback Section */}
        {submissionStatus?.review_feedback && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Review Feedback
                </h2>
                <Badge variant="warning">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Revision Requested
                </Badge>
              </div>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Reviewed By</h3>
                  <p className="text-gray-900">{submissionStatus.review_feedback.reviewer}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Review Date</h3>
                  <p className="text-gray-900">
                    {new Date(submissionStatus.review_feedback.reviewed_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {submissionStatus.review_feedback.score !== null && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Current Score</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {submissionStatus.review_feedback.score}/{task.points || 0}
                  </p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-700">Reviewer's Notes</h3>
                <div className="mt-2 p-3 bg-white rounded-lg border border-yellow-300">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {submissionStatus.review_feedback.notes || 'No specific feedback provided.'}
                  </p>
                </div>
              </div>
              
              {submissionStatus.review_feedback.response_file_url && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Attached Resources</h3>
                  <a
                    href={submissionStatus.review_feedback.response_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Reviewer's File
                  </a>
                </div>
              )}
              
              {submissionStatus.revision_count > 0 && (
                <div className="text-sm text-gray-600">
                  This is revision #{submissionStatus.revision_count + 1}
                </div>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Submission Status Banner */}
        {submissionStatus?.submission && submissionStatus.submission.status === 'approved' && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <Card.Content className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Submission Approved!</h3>
                    <p className="text-sm text-green-700">
                      Score: {submissionStatus.submission.score}/{task.points || 0}
                    </p>
                  </div>
                </div>
                <Badge variant="success">Approved</Badge>
              </div>
            </Card.Content>
          </Card>
        )}

        {submissionStatus?.submission && submissionStatus.submission.status === 'rejected' && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <Card.Content className="py-4">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-red-900">Submission Rejected</h3>
                  <p className="text-sm text-red-700">
                    Please review the feedback and contact your instructor if needed.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}

        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold">
              {submissionStatus?.can_revise ? 'Revise Your Submission' : 'Task Submission'}
            </h2>
          </Card.Header>
          <Card.Content>
            <div className="space-y-6">
              {/* Text Submission Field */}
              {task.submission_type !== 'media_only' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Text Response
                    {(task.submission_type === 'text_only' || task.submission_type === 'both') && 
                      <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  
                  {task.text_submission_instructions && (
                    <p className="text-sm text-gray-600 mb-3">
                      {task.text_submission_instructions}
                    </p>
                  )}
                  
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter your response here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    rows={8}
                  />
                </div>
              )}

              {/* File Upload Field */}
              {task.submission_type !== 'text_only' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Upload Files
                    {(task.submission_type === 'media_only' || task.submission_type === 'both') && 
                      <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  
                  <MediaUpload
                    taskId={task.id}
                    mediaRequired={task.media_required}
                    allowedTypes={task.allowed_media_types}
                    maxFileSize={task.max_file_size_mb}
                    maxFiles={task.max_files_count}
                    existingFiles={uploadedFiles}
                    onUploadComplete={(file) => {
                      setUploadedFiles(prev => [...prev, file]);
                    }}
                    onDeleteComplete={(fileId) => {
                      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
                    }}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={
                    !submissionStatus?.can_submit ||
                    ((task.submission_type === 'text_only' && submissionText.trim().length === 0) ||
                    (task.submission_type === 'media_only' && uploadedFiles.length === 0) ||
                    (task.submission_type === 'both' && (submissionText.trim().length === 0 || uploadedFiles.length === 0)))
                    // 'either' type can be submitted empty (just marking complete)
                  }
                  leftIcon={submissionStatus?.can_revise ? <RefreshCw className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                >
                  {submissionStatus?.can_revise ? 'Resubmit with Revisions' : 
                   task.submission_type === 'either' && submissionText.trim().length === 0 && uploadedFiles.length === 0 
                     ? 'Mark as Complete' : 'Submit Task'}
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Submission Requirements Note */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> 
            {task.submission_type === 'text_only' && ' This task requires a text response.'}
            {task.submission_type === 'media_only' && ' This task requires file upload. Please upload at least one file before submitting.'}
            {task.submission_type === 'both' && ' This task requires both a text response and file upload.'}
            {task.submission_type === 'either' && ' This task is optional. You can provide a text response, upload files, or simply mark it as complete.'}
          </p>
        </div>
      </div>
    </div>
  );
}