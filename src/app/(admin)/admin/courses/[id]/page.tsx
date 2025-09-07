'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Edit, Trash2, Globe, Lock, 
  Book, Bookmark, Calendar, Clock, Target, AlertCircle,
  MoreVertical, Share2, Copy, CheckCircle, Settings, FileText, ExternalLink, LayoutList, Rows
} from 'lucide-react';
import { Course } from '@/types/database';
import { courseService } from '@/lib/supabase/courses';
import { Button, Card, Badge, Modal, Spinner, Tabs, TabsList, TabsTrigger, RichTextDisplay } from '@/components/ui';
import { 
  CourseBookManager, 
  CourseVocabularyManager, 
  CourseScheduleList,
  CourseLessonsWithSchedules,
  CourseObjectiveManager,
  CourseMethodManager,
  CourseTaskManager
} from '@/components/relationships';
import { AccordionCourseView } from '@/components/courses/AccordionCourseView';
import { cn } from '@/lib/utils';

const statusColors = {
  draft: 'default',
  published: 'success',
  archived: 'secondary',
} as const;

const difficultyColors = {
  basic: 'info',
  standard: 'warning',
  premium: 'primary',
} as const;

const difficultyLabels = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
} as const;

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Initialize activeTab from sessionStorage or URL param
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = sessionStorage.getItem(`course-tab-${courseId}`);
    return savedTab || searchParams.get('tab') || 'overview';
  });
  
  // Initialize viewMode from sessionStorage or URL param
  const [viewMode, setViewMode] = useState<'tabs' | 'accordion'>(() => {
    const savedView = sessionStorage.getItem(`course-view-${courseId}`);
    return (savedView as 'tabs' | 'accordion') || 
           (searchParams.get('view') === 'tabs' ? 'tabs' : 'accordion');
  });
  
  const [copied, setCopied] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Save state changes to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(`course-tab-${courseId}`, activeTab);
  }, [activeTab, courseId]);

  useEffect(() => {
    sessionStorage.setItem(`course-view-${courseId}`, viewMode);
  }, [viewMode, courseId]);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  useEffect(() => {
    const attachedCount = searchParams.get('attached');
    if (attachedCount && parseInt(attachedCount) > 0) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [searchParams]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      console.log(`[CourseDetail] Loading complete course data for ${courseId}`);
      const startTime = Date.now();
      
      // Load ALL course data in one request with cache-busting
      const cacheBuster = Date.now();
      const response = await fetch(`/api/courses/${courseId}/complete?t=${cacheBuster}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load course data');
      }
      
      const completeData = await response.json();
      const endTime = Date.now();
      
      console.log(`[CourseDetail] Loaded all data in ${endTime - startTime}ms`);
      console.log('[CourseDetail] Complete data:', {
        objectives: completeData.objectives?.length || 0,
        methods: completeData.methods?.length || 0,
        books: completeData.books?.length || 0,
        vocabulary: completeData.vocabulary?.length || 0,
        tasks: completeData.tasks?.length || 0,
        schedules: completeData.schedules?.length || 0,
        lessons: completeData.lessons?.length || 0
      });
      
      setCourse(completeData.course);
      setCourseData(completeData);
    } catch (error) {
      console.error('Failed to load course:', error);
      router.push('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await courseService.deleteCourse(courseId);
      router.push('/admin/courses');
    } catch (error) {
      console.error('Failed to delete course:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };


  const handlePublish = async () => {
    try {
      await courseService.publishCourse(courseId);
      await loadCourse();
    } catch (error) {
      console.error('Failed to publish course:', error);
    }
  };

  const handleCopyPublicLink = () => {
    if (course?.public_slug) {
      const publicUrl = `${window.location.origin}/public/courses/${course.public_slug}`;
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareCourse = () => {
    const shareUrl = `${window.location.origin}/share/${courseId}`;
    window.open(shareUrl, '_blank');
  };

  const handleViewModeChange = (mode: 'tabs' | 'accordion') => {
    setViewMode(mode);
    const currentUrl = new URL(window.location.href);
    if (mode === 'tabs') {
      currentUrl.searchParams.set('view', 'tabs');
    } else {
      currentUrl.searchParams.delete('view'); // accordion is default, no need for param
    }
    router.replace(currentUrl.pathname + currentUrl.search);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Book className="h-4 w-4" /> },
    { id: 'materials', label: 'Materials', icon: <Bookmark className="h-4 w-4" /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar className="h-4 w-4" /> },
    { id: 'lessons', label: 'Sessions', icon: <Clock className="h-4 w-4" /> },
    { id: 'objectives', label: 'Objectives', icon: <Target className="h-4 w-4" /> },
    { id: 'methods', label: 'Methods', icon: <Settings className="h-4 w-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/courses')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          Back to Courses
        </Button>
        
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-start gap-4">
              {course.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {course.title}
                  </h1>
                  <Badge variant={statusColors[course.status]}>
                    {course.status}
                  </Badge>
                  {course.is_public ? (
                    <Globe className="h-5 w-5 text-green-500" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                
                {course.short_description && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    {course.short_description}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <Badge variant={difficultyColors[course.difficulty]} size="sm">
                    {difficultyLabels[course.difficulty]}
                  </Badge>
                  
                  {course.duration_hours && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration_hours} hours</span>
                    </div>
                  )}
                  
                  {/* Books Count */}
                  {course.course_books && course.course_books.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Book className="h-4 w-4" />
                      <span>{course.course_books.length} book{course.course_books.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {/* Price Display */}
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      ${course.price?.toLocaleString() || '7,000'} {course.currency || 'CAD'}
                    </span>
                    {course.is_free && (
                      <Badge variant="success" size="sm">Free</Badge>
                    )}
                  </div>
                  
                  {course.category && (
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: course.category.color ? `${course.category.color}20` : undefined,
                        color: course.category.color || undefined,
                      }}
                    >
                      {course.category.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-2">
              <button
                onClick={() => handleViewModeChange('tabs')}
                className={cn(
                  "p-2 rounded text-sm font-medium transition-colors",
                  viewMode === 'tabs'
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}
                title="Tab View"
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('accordion')}
                className={cn(
                  "p-2 rounded text-sm font-medium transition-colors",
                  viewMode === 'accordion'
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}
                title="Accordion View"
              >
                <Rows className="h-4 w-4" />
              </button>
            </div>

            {course.status === 'draft' && (
              <Button
                variant="primary"
                onClick={handlePublish}
                leftIcon={<CheckCircle className="h-4 w-4" />}
              >
                Publish
              </Button>
            )}
            
            {course.status === 'published' && course.public_slug && (
              <Button
                variant="outline"
                onClick={handleCopyPublicLink}
                leftIcon={copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/courses/${courseId}/edit`)}
              leftIcon={<Edit className="h-4 w-4" />}
            >
              Edit
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              leftIcon={<Trash2 className="h-4 w-4" />}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">
              Successfully attached {searchParams.get('attached')} schedule{parseInt(searchParams.get('attached') || '0') !== 1 ? 's' : ''} to this course!
            </span>
          </div>
        </div>
      )}

      {/* Conditional View Rendering */}
      {viewMode === 'accordion' ? (
        <AccordionCourseView 
          course={course}
          courseId={courseId}
          courseData={courseData}
          onUpdate={loadCourse}
          onShare={handleShareCourse}
        />
      ) : (
        <>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">Description</h2>
              </Card.Header>
              <Card.Content>
                {course.description ? (
                  <RichTextDisplay 
                    content={course.description} 
                    size="sm"
                    className="max-w-none"
                  />
                ) : (
                  <p className="text-gray-500 italic">No description provided</p>
                )}
              </Card.Content>
            </Card>


            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <Card>
                <Card.Header>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Prerequisites
                  </h2>
                </Card.Header>
                <Card.Content>
                  <ul className="space-y-2">
                    {course.prerequisites.map((prerequisite, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span className="text-sm">{prerequisite}</span>
                      </li>
                    ))}
                  </ul>
                </Card.Content>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <Card>
                <Card.Header>
                  <h3 className="text-sm font-semibold">Tags</h3>
                </Card.Header>
                <Card.Content>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Course Information</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareCourse}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Share course publicly"
                  >
                    <span className="text-sm">Share</span>
                    <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                    <dd className="font-medium">
                      {new Date(course.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Last Updated</dt>
                    <dd className="font-medium">
                      {new Date(course.updated_at).toLocaleDateString()}
                    </dd>
                  </div>
                  {course.published_at && (
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Published</dt>
                      <dd className="font-medium">
                        {new Date(course.published_at).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Course ID</dt>
                    <dd className="font-mono text-xs">{course.id}</dd>
                  </div>
                </dl>
              </Card.Content>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="space-y-6">
          {/* Books */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Course Materials</h2>
            </Card.Header>
            <Card.Content className="space-y-8">
              <CourseBookManager courseId={courseId} onUpdate={loadCourse} />
              <div className="border-t pt-8">
                <CourseVocabularyManager courseId={courseId} onUpdate={loadCourse} />
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {activeTab === 'schedule' && (
        <Card>
          <Card.Content>
            <CourseScheduleList courseId={courseId} />
          </Card.Content>
        </Card>
      )}

      {activeTab === 'lessons' && (
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold">Course Sessions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select a schedule to view and manage its sessions. Sessions are automatically created from course schedules.
            </p>
          </Card.Header>
          <Card.Content>
            <CourseLessonsWithSchedules courseId={courseId} />
          </Card.Content>
        </Card>
      )}

      {activeTab === 'objectives' && (
        <Card>
          <Card.Content>
            <CourseObjectiveManager courseId={courseId} onUpdate={loadCourse} />
          </Card.Content>
        </Card>
      )}

      {activeTab === 'methods' && (
        <Card>
          <Card.Content>
            <CourseMethodManager courseId={courseId} onUpdate={loadCourse} />
          </Card.Content>
        </Card>
      )}

      {activeTab === 'tasks' && (
        <Card>
          <Card.Content>
            <CourseTaskManager courseId={courseId} onUpdate={loadCourse} />
          </Card.Content>
        </Card>
      )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Course"
        className="max-w-md"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete &quot;{course.title}&quot;? This action cannot be undone.
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
            Delete Course
          </Button>
        </div>
      </Modal>
    </div>
  );
}
