'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RichTextDisplay } from '@/components/ui/RichTextDisplay';
import { 
  ArrowLeft, ArrowRight, BookOpen, Clock, Calendar, 
  FileText, BookMarked, Type, CheckCircle, Circle,
  ChevronLeft, ChevronRight, List, Target, Download,
  Users, Play, Upload, X, File, Image, Video, Music,
  XCircle, Edit
} from 'lucide-react';
import Link from 'next/link';

interface Lesson {
  id: string;
  schedule_id: string;
  course_id: string;
  title: string;
  description?: string;
  content?: string;
  pdf_url?: string;
  pdf_page?: number;
  lesson_number: number;
  date?: string;
  start_time?: string;
  duration_minutes: number;
  location?: string;
  status: string;
  metadata?: any;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  is_completed?: boolean;
  is_required?: boolean;
  points?: number;
  media_required?: boolean;
  allowed_media_types?: string[];
  max_file_size_mb?: number;
  max_files_count?: number;
  submission_type?: 'text_only' | 'media_only' | 'both' | 'either';
  text_submission_enabled?: boolean;
  text_submission_instructions?: string;
  submission?: {
    id: string;
    status: string;
    submission_data?: any;
    submission_text?: string;
    submitted_at?: string;
  } | null;
}

interface Book {
  id: string;
  title: string;
  author?: string;
  pages?: string;
  is_required: boolean;
}

interface VocabularyItem {
  id: string;
  word: string;
  definition?: string;
  example?: string;
  language?: string;
}

interface Course {
  id: string;
  title: string;
}

export default function LessonContentPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [previousLesson, setPreviousLesson] = useState<Lesson | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [taskFiles, setTaskFiles] = useState<{ [taskId: string]: File[] }>({});
  const [taskTexts, setTaskTexts] = useState<{ [taskId: string]: string }>({});
  const [uploadingTasks, setUploadingTasks] = useState<Set<string>>(new Set());
  const [clearingTasks, setClearingTasks] = useState<Set<string>>(new Set());
  const [userProgress, setUserProgress] = useState<any>(null);
  const [lessonStartTime] = useState<number>(Date.now());

  // Load lesson content immediately - don't wait for auth
  useEffect(() => {
    if (lessonId) {
      // Try to load content right away - API will handle auth
      fetchLessonContent();
    }
  }, [lessonId]);
  
  // Handle user-specific actions after auth loads (non-blocking)
  useEffect(() => {
    // Once auth is ready and user exists, initialize user features
    if (!authLoading && user && lessonId) {
      // Retry fetching lesson content if it failed due to auth
      if (!lesson && !loading) {
        fetchLessonContent();
      }
      initializeSubmissions();
      trackLessonStart();
      fetchUserProgress();
    }
    // Don't redirect here - let the layout handle it if needed
  }, [authLoading, user, lessonId]);

  // Initialize draft submissions when entering the lesson
  const initializeSubmissions = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/init-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Submissions initialized:', data);
      }
    } catch (error) {
      console.error('Error initializing submissions:', error);
    }
  };

  // Track when user starts the lesson
  const trackLessonStart = async () => {
    if (!user || !lessonId) return;
    
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data);
        console.log('Lesson progress started:', data);
      }
    } catch (error) {
      console.error('Error tracking lesson start:', error);
    }
  };

  // Fetch existing user progress
  const fetchUserProgress = async () => {
    if (!user || !lessonId) return;
    
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`);
      
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setUserProgress(data);
          console.log('Existing progress:', data);
        }
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  // Mark lesson as completed
  const markLessonAsComplete = async () => {
    const timeSpent = Math.floor((Date.now() - lessonStartTime) / 1000 / 60); // in minutes
    
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpent,
          assessmentData: {
            tasksCompleted: Array.from(completedTasks),
            totalTasks: tasks.length
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data);
        console.log('Lesson marked as complete:', data);
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };
  
  // Check and mark lesson as completed when all required tasks are done
  const checkAndMarkLessonComplete = async () => {
    if (userProgress?.is_completed) return; // Already completed
    
    const requiredTasks = tasks.filter(t => t.is_required !== false);
    const allRequiredComplete = requiredTasks.every(task => 
      completedTasks.has(task.id) || task.is_completed
    );

    if (allRequiredComplete && requiredTasks.length > 0) {
      markLessonAsComplete();
    }
  };

  // Check completion status whenever tasks are completed
  useEffect(() => {
    if (tasks.length > 0) {
      checkAndMarkLessonComplete();
    }
  }, [completedTasks, tasks]);

  const fetchLessonContent = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/content`, {
        credentials: 'include', // Ensure cookies are sent
      });
      
      if (!response.ok) {
        // If unauthorized, don't throw - just wait for auth to complete
        if (response.status === 401) {
          const data = await response.json();
          console.log('Auth required, will retry after auth loads');
          // Don't set loading false - keep skeleton showing
          // Will be retried after auth completes
          if (data.retry) {
            return; // Will be called again after auth loads
          }
        }
        // For other errors, still handle gracefully
        console.error(`HTTP error! status: ${response.status}`);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      console.log('Lesson data received:', data);
      console.log('Tasks with details:', data.tasks);
      
      setLesson(data.lesson);
      setCourse(data.course);
      setPreviousLesson(data.previousLesson);
      setNextLesson(data.nextLesson);
      setTasks(data.tasks || []);
      setBooks(data.books || []);
      setVocabulary(data.vocabulary || []);
      
      // Set completed tasks based on submissions
      const completed = new Set<string>();
      data.tasks?.forEach((task: Task) => {
        if (task.submission && (task.submission.status === 'submitted' || task.submission.status === 'approved')) {
          completed.add(task.id);
        }
      });
      setCompletedTasks(completed);
      
      // Check if lesson should be marked as complete based on existing submissions
      if (!userProgress?.is_completed) {
        const requiredTasks = data.tasks?.filter((t: Task) => t.is_required !== false) || [];
        const allRequiredComplete = requiredTasks.every((task: Task) => 
          task.submission && (task.submission.status === 'submitted' || task.submission.status === 'approved')
        );
        
        if (allRequiredComplete && requiredTasks.length > 0) {
          // Mark lesson as complete since all required tasks are done
          markLessonAsComplete();
        }
      }

    } catch (error) {
      console.error('Error fetching lesson content:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleFileSelect = (taskId: string, files: FileList | null) => {
    if (!files) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const maxFiles = task.max_files_count || 5;
    const maxSize = (task.max_file_size_mb || 200) * 1024 * 1024; // Convert to bytes
    const allowedTypes = task.allowed_media_types || ['image', 'video', 'audio', 'document'];
    
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    Array.from(files).forEach(file => {
      // Check file count
      if (validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }
      
      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name} exceeds ${task.max_file_size_mb}MB limit`);
        return;
      }
      
      // Check file type
      const fileType = getFileCategory(file.type);
      if (!allowedTypes.includes(fileType)) {
        errors.push(`${file.name} type not allowed`);
        return;
      }
      
      validFiles.push(file);
    });
    
    if (errors.length > 0) {
      alert(errors.join('\n'));
    }
    
    if (validFiles.length > 0) {
      setTaskFiles(prev => ({
        ...prev,
        [taskId]: validFiles
      }));
    }
  };

  const getFileCategory = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const removeFile = (taskId: string, index: number) => {
    setTaskFiles(prev => ({
      ...prev,
      [taskId]: prev[taskId].filter((_, i) => i !== index)
    }));
  };

  const clearTaskSubmission = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    
    // For 'either' type tasks, don't show confirmation for empty submissions
    if (task?.submission_type !== 'either' || 
        (task?.submission?.submission_text || task?.submission?.submission_data?.files?.length > 0)) {
      if (!confirm('Are you sure you want to clear this submission? This will delete all uploaded files.')) {
        return;
      }
    }

    setClearingTasks(prev => new Set(prev).add(taskId));
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/submission`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear submission');
      }
      
      // Update local state
      setCompletedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      
      // Update tasks array to reflect the change
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            submission: null,
            is_completed: false
          };
        }
        return task;
      }));
      
      // Clear any selected files and text for this task
      setTaskFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[taskId];
        return newFiles;
      });
      setTaskTexts(prev => {
        const newTexts = { ...prev };
        delete newTexts[taskId];
        return newTexts;
      });
      
      // Get task again to check type (since task was declared at top of function)
      const clearedTask = tasks.find(t => t.id === taskId);
      // Only show alert for non-'either' tasks or 'either' tasks with content
      if (clearedTask?.submission_type !== 'either' || 
          (clearedTask?.submission?.submission_text || clearedTask?.submission?.submission_data?.files?.length > 0)) {
        alert('Submission cleared successfully. You can now resubmit.');
      }
    } catch (error) {
      console.error('Clear submission error:', error);
      alert(`Failed to clear submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setClearingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const submitTask = async (taskId: string, allowEmpty: boolean = false) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const files = taskFiles[taskId] || [];
    const text = taskTexts[taskId] || '';
    
    // Validate based on submission type (skip for empty 'either' submissions)
    if (!allowEmpty) {
      if (task.submission_type === 'text_only' || task.submission_type === 'both') {
        if (!text.trim()) {
          alert('Please enter your text response');
          return;
        }
      }
      
      if (task.submission_type === 'media_only' || (task.submission_type === 'both' && task.media_required)) {
        if (files.length === 0) {
          alert('Please select files to upload');
          return;
        }
      }
      
      if (task.submission_type === 'either') {
        // For 'either' type, allow empty submissions when called with allowEmpty=true
        // This happens when clicking the task card directly
        if (!text.trim() && files.length === 0 && !allowEmpty) {
          // This path is for the submit button, not direct click
          // Direct click will pass allowEmpty=true
        }
      }
    }
    
    setUploadingTasks(prev => new Set(prev).add(taskId));
    
    try {
      let response;
      
      // For 'either' type with empty submission, use JSON instead of FormData
      if (task.submission_type === 'either' && !text.trim() && files.length === 0) {
        response = await fetch(`/api/tasks/${taskId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            submission_text: '',
            course_id: courseId,
            lesson_id: lessonId,
          })
        });
      } else {
        // Create FormData for normal submissions
        const formData = new FormData();
        
        // Add text if present
        if (text.trim()) {
          formData.append('submissionText', text);
        }
        
        // Add files if present
        files.forEach(file => {
          formData.append('files', file);
        });
        
        formData.append('courseId', courseId);
        formData.append('lessonId', lessonId);
        
        // Submit to API
        response = await fetch(`/api/tasks/${taskId}/submit`, {
          method: 'POST',
          body: formData
        });
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      const result = await response.json();
      
      // Mark task as completed after successful upload
      setCompletedTasks(prev => new Set(prev).add(taskId));
      
      // Update tasks array with the new submission
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            submission: result.submission,
            is_completed: true
          };
        }
        return task;
      }));
      
      // Clear files and text for this task
      setTaskFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[taskId];
        return newFiles;
      });
      setTaskTexts(prev => {
        const newTexts = { ...prev };
        delete newTexts[taskId];
        return newTexts;
      });
      
      // Only show alert for non-'either' tasks
      if (task.submission_type !== 'either') {
        alert('Submission successful!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Only show error alert for non-'either' tasks
      if (task.submission_type !== 'either') {
        alert(`Failed to submit: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setUploadingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const getFileIcon = (file: File) => {
    const type = getFileCategory(file.type);
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderContent = () => {
    if (!lesson?.content) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p>No content available for this session</p>
        </div>
      );
    }

    // Use RichTextDisplay component for proper rendering
    return (
      <RichTextDisplay 
        content={lesson.content}
        className="max-w-none"
      />
    );
  };

  const renderPdf = () => {
    if (!lesson?.pdf_url) return null;

    // The PDF URL already contains the toolbar parameters from the form
    let pdfUrl = lesson.pdf_url;
    
    // Convert Google Drive links to embed format
    if (pdfUrl.includes('drive.google.com')) {
      const fileIdMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        // Extract any existing fragment/hash from the URL
        const hashIndex = pdfUrl.indexOf('#');
        const existingHash = hashIndex > -1 ? pdfUrl.substring(hashIndex) : '';
        pdfUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview${existingHash}`;
      }
    }
    
    // Add page parameter if needed (and not already in URL)
    if (lesson.pdf_page && lesson.pdf_page > 1 && !pdfUrl.includes('page=')) {
      const separator = pdfUrl.includes('#') ? '&' : '#';
      pdfUrl = pdfUrl + separator + `page=${lesson.pdf_page}`;
    }

    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Document
        </h2>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <iframe
            src={pdfUrl}
            className="w-full"
            style={{ height: '700px' }}
            title="Session PDF Document"
            allowFullScreen
          />
        </div>
      </Card>
    );
  };

  // Show skeleton while loading (auth or content)
  // This prevents the "Session not found" flash
  if ((loading || authLoading) && !lesson) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header skeleton with better layout matching actual content */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-7 bg-gray-200 rounded w-64"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Session info bar skeleton */}
        <div className="bg-white rounded-lg p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
            </div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mt-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-36 mb-3"></div>
              <div className="space-y-3">
                <div className="border-l-2 border-gray-200 pl-3">
                  <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="border-l-2 border-gray-200 pl-3">
                  <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show "Session not found" if loading is complete and still no lesson
  // Also ensure auth has had time to complete
  if (!loading && !authLoading && !lesson) {
    // Give a bit more time for retry after auth completes
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Session not found</h2>
          <p className="text-gray-500 mt-2">The requested lesson could not be found.</p>
          <Link href={`/account/courses/${courseId}`}>
            <Button className="mt-4">Back to Course</Button>
          </Link>
        </div>
      </div>
    );
  }

  // If we have a lesson, render it
  // If still loading, skeleton was already shown above
  if (!lesson) {
    // This shouldn't happen but handle gracefully
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link 
            href={`/account/courses/${courseId}`} 
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href={`/account/courses/${courseId}`} className="hover:text-gray-700">
                {course?.title || 'Course'}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span>Session {lesson.lesson_number}</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">{lesson.title}</h1>
          </div>
        </div>

        {/* Session Navigation */}
        <div className="flex items-center gap-2">
          {previousLesson ? (
            <Link href={`/account/courses/${courseId}/lessons/${previousLesson.id}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          )}
          {nextLesson ? (
            <Link href={`/account/courses/${courseId}/lessons/${nextLesson.id}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled className="flex items-center gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Session Info Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            {lesson.date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(lesson.date)}
              </span>
            )}
            {lesson.duration_minutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {lesson.duration_minutes} minutes
              </span>
            )}
            {lesson.location && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {lesson.location}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              {tasks.length} tasks • {books.length} books • {vocabulary.length} words
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Description */}
          {lesson.description && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Overview</h2>
              <p className="text-gray-600">{lesson.description}</p>
            </Card>
          )}

          {/* Session Content */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Session Content</h2>
            {renderContent()}
          </Card>

          {/* PDF Document */}
          {renderPdf()}

          {/* Tasks Section */}
          {tasks.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tasks ({completedTasks.size}/{tasks.length} completed)
              </h2>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div 
                      className={`flex items-start gap-3 ${
                        task.submission_type === 'either' ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => {
                        // Only allow click for 'either' type tasks
                        if (task.submission_type === 'either') {
                          if (task.submission) {
                            // If already submitted, clear it
                            clearTaskSubmission(task.id);
                          } else {
                            // If not submitted, submit empty to mark as complete
                            submitTask(task.id, true); // Pass true to allow empty submission
                          }
                        }
                        // Note: 'both', 'text_only', and 'media_only' types require proper submission
                      }}
                    >
                      <button 
                        className="mt-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (task.submission_type === 'either') {
                            if (task.submission) {
                              // If already submitted, clear it
                              clearTaskSubmission(task.id);
                            } else {
                              // If not submitted, submit empty to mark as complete
                              submitTask(task.id, true); // Pass true to allow empty submission
                            }
                          }
                          // Note: 'both', 'text_only', and 'media_only' types need form submission
                        }}
                      >
                        {completedTasks.has(task.id) || 
                         (task.submission && (task.submission.submission_text || task.submission.submission_data?.files?.length > 0)) ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h4 className={`font-medium ${completedTasks.has(task.id) || 
                          (task.submission && (task.submission.submission_text || task.submission.submission_data?.files?.length > 0)) ? 
                          'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {task.title}
                          {task.submission_type === 'either' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Optional - Click to toggle
                            </span>
                          )}
                          {task.submission_type === 'both' && (
                            <>
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                <Edit className="h-3 w-3 mr-1" />
                                Text Response
                              </span>
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                <Upload className="h-3 w-3 mr-1" />
                                Upload Required
                              </span>
                            </>
                          )}
                          {task.submission_type === 'text_only' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              <Edit className="h-3 w-3 mr-1" />
                              Text Response
                            </span>
                          )}
                          {task.submission_type === 'media_only' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              <Upload className="h-3 w-3 mr-1" />
                              Upload Required
                            </span>
                          )}
                        </h4>
                        {task.description && task.description.trim() !== '' && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {task.points && (
                            <span>{task.points} points</span>
                          )}
                          {task.media_required && (
                            <>
                              <span>Max {task.max_files_count || 5} files</span>
                              <span>Max {task.max_file_size_mb || 200}MB each</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Show existing submission if any (but not empty pending submissions) */}
                    {task.submission && (task.submission.submission_text || task.submission.submission_data?.files?.length > 0) && (
                      <div className="mt-4 ml-8 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Submitted on {new Date(task.submission.submitted_at!).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => clearTaskSubmission(task.id)}
                            disabled={clearingTasks.has(task.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Clear submission and re-upload"
                          >
                            {clearingTasks.has(task.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {task.submission.submission_text && (
                            <div className="p-2 bg-white rounded border border-green-100">
                              <p className="text-xs font-medium text-gray-700 mb-1">Your Response:</p>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.submission.submission_text}</p>
                            </div>
                          )}
                          {task.submission.submission_data?.files && task.submission.submission_data.files.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-700">Uploaded Files:</p>
                              {task.submission.submission_data.files.map((file: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-600 flex items-center gap-2 ml-2">
                                  <File className="h-3 w-3" />
                                  <a 
                                    href={file.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-600 underline"
                                  >
                                    {file.name}
                                  </a>
                                  <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Text Input Section - Show for text_only and both types */}
                    {(task.submission_type === 'text_only' || task.submission_type === 'both') && 
                     (!task.submission || (task.submission.status === 'pending' && !task.submission.submission_text && !task.submission.submission_data?.files)) && (
                      <div className="mt-4 ml-8 space-y-3">
                        {task.submission_type === 'both' && (
                          <div className="text-sm font-medium text-purple-700 flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Enter your text response
                          </div>
                        )}
                        {task.text_submission_instructions && (
                          <p className="text-sm text-gray-600">{task.text_submission_instructions}</p>
                        )}
                        <textarea
                          value={taskTexts[task.id] || ''}
                          onChange={(e) => setTaskTexts(prev => ({ ...prev, [task.id]: e.target.value }))}
                          placeholder="Enter your response here..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                          rows={6}
                        />
                        <div className="text-xs text-gray-500">
                          {taskTexts[task.id]?.length || 0} characters
                        </div>
                      </div>
                    )}
                    
                    {/* File Upload Section - Show for media_only and both types */}
                    {(task.submission_type === 'media_only' || task.submission_type === 'both') && 
                     (!task.submission || (task.submission.status === 'pending' && !task.submission.submission_text && !task.submission.submission_data?.files)) && (
                      <div className="mt-4 ml-8 space-y-3">
                        {task.submission_type === 'both' && (
                          <div className="text-sm font-medium text-blue-700 flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Upload your files
                          </div>
                        )}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <label className="flex flex-col items-center cursor-pointer">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">Click to upload files</span>
                            <span className="text-xs text-gray-500 mt-1">
                              Allowed: {task.allowed_media_types?.join(', ') || 'all types'}
                            </span>
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => handleFileSelect(task.id, e.target.files)}
                              accept={task.allowed_media_types?.map(type => {
                                switch(type) {
                                  case 'image': return 'image/*';
                                  case 'video': return 'video/*';
                                  case 'audio': return 'audio/*';
                                  case 'document': return '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx';
                                  default: return '*';
                                }
                              }).join(',')}
                            />
                          </label>
                        </div>
                        
                        {/* Selected Files */}
                        {taskFiles[task.id] && taskFiles[task.id].length > 0 && (
                          <div className="space-y-2">
                            {taskFiles[task.id].map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  {getFileIcon(file)}
                                  <span className="text-sm text-gray-700">{file.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({(file.size / 1024 / 1024).toFixed(2)}MB)
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeFile(task.id, index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            
                            {/* Submit button only for media_only type - both type has its own button below */}
                            {task.submission_type === 'media_only' && (
                              <Button
                                onClick={() => submitTask(task.id)}
                                disabled={uploadingTasks.has(task.id)}
                                className="w-full"
                              >
                                {uploadingTasks.has(task.id) ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Submit Files
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Simple info text for Either Tasks */}
                    {task.submission_type === 'either' && !task.submission && (
                      <div className="mt-4 ml-8">
                        <p className="text-xs text-gray-500 text-center italic">
                          Click the checkbox above to mark as complete
                        </p>
                      </div>
                    )}
                    
                    {/* Submit Button for Text-Only, Both, or Media-Only Tasks */}
                    {((task.submission_type === 'text_only' || task.submission_type === 'both' || 
                      (task.submission_type === 'media_only' && taskFiles[task.id]?.length > 0)) && 
                      !task.submission) && (
                      <div className="mt-4 ml-8 space-y-2">
                        {/* Helper message for 'both' type tasks */}
                        {task.submission_type === 'both' && (!taskTexts[task.id]?.trim() || !taskFiles[task.id]?.length) && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-800">
                              ⚠️ Both text response and file upload are required for this task.
                              {!taskTexts[task.id]?.trim() && !taskFiles[task.id]?.length && (
                                <span> Please complete both steps above.</span>
                              )}
                              {taskTexts[task.id]?.trim() && !taskFiles[task.id]?.length && (
                                <span> Please upload at least one file.</span>
                              )}
                              {!taskTexts[task.id]?.trim() && taskFiles[task.id]?.length > 0 && (
                                <span> Please enter your text response.</span>
                              )}
                            </p>
                          </div>
                        )}
                        <Button
                          onClick={() => submitTask(task.id)}
                          disabled={uploadingTasks.has(task.id) || 
                            (task.submission_type === 'text_only' && !taskTexts[task.id]?.trim()) ||
                            (task.submission_type === 'media_only' && !taskFiles[task.id]?.length) ||
                            (task.submission_type === 'both' && (!taskTexts[task.id]?.trim() || !taskFiles[task.id]?.length))}
                          className="w-full"
                        >
                          {uploadingTasks.has(task.id) ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {task.submission_type === 'both' ? 'Submit Text & Files' : 'Submit Response'}
                            </>
                          )}
                        </Button>
                        <Link href="/account/submissions" className="block">
                          <Button variant="outline" className="w-full">
                            <FileText className="h-4 w-4 mr-2" />
                            View All Submissions
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Books Section */}
          {books.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                <BookMarked className="h-5 w-5" />
                Reading Materials
              </h3>
              <div className="space-y-3">
                {books.map((book) => (
                  <div key={book.id} className="border-l-2 border-gray-200 pl-3">
                    <h4 className="font-medium text-gray-900 text-sm">{book.title}</h4>
                    {book.author && (
                      <p className="text-xs text-gray-500">by {book.author}</p>
                    )}
                    {book.pages && (
                      <p className="text-xs text-gray-600 mt-1">Pages: {book.pages}</p>
                    )}
                    {book.is_required && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        Required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Vocabulary Section */}
          {vocabulary.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 text-gray-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Vocabulary ({vocabulary.length})
                </span>
                <button
                  onClick={() => setShowVocabulary(!showVocabulary)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {showVocabulary ? 'Hide' : 'Show'}
                </button>
              </h3>
              {showVocabulary && (
                <div className="space-y-3 mt-3">
                  {vocabulary.map((item) => (
                    <div key={item.id} className="border-b border-gray-100 pb-2 last:border-0">
                      <h4 className="font-medium text-gray-900 text-sm">{item.word}</h4>
                      {item.definition && (
                        <p className="text-xs text-gray-600 mt-1">{item.definition}</p>
                      )}
                      {item.example && (
                        <p className="text-xs text-gray-500 italic mt-1">"{item.example}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Progress Card */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3 text-gray-900">Session Progress</h3>
            <div className="space-y-3">
              {userProgress && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${
                      userProgress.is_completed ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {userProgress.is_completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  {userProgress.started_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Started</span>
                      <span className="text-gray-900">
                        {new Date(userProgress.started_at).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {userProgress.time_spent && userProgress.time_spent > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Time Spent</span>
                      <span className="text-gray-900">{userProgress.time_spent} min</span>
                    </div>
                  )}
                  {userProgress.attempts > 1 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Attempts</span>
                      <span className="text-gray-900">{userProgress.attempts}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Content Read</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tasks Completed</span>
                <span className="text-gray-900 font-medium">
                  {completedTasks.size}/{tasks.length}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-900 transition-all"
                  style={{ 
                    width: `${tasks.length > 0 ? (completedTasks.size / tasks.length) * 100 : 100}%` 
                  }}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-2 mt-4">
                {!userProgress?.is_completed && (
                  <Button
                    onClick={markLessonAsComplete}
                    className="w-full"
                    variant="outline"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Session Complete
                  </Button>
                )}
                <Link href="/account/submissions" className="block">
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Submissions
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Start Teams Button */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Join Team Session</h3>
                  <p className="text-sm text-gray-600">Connect with your instructor and classmates</p>
                </div>
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                size="lg"
                onClick={() => {
                  // For now, just show an alert
                  alert('Team stream feature coming soon!');
                }}
              >
                <Play className="h-5 w-5" />
                Start Teams
              </Button>
              
              <div className="text-xs text-gray-500 text-center">
                Live sessions available during scheduled class times
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}