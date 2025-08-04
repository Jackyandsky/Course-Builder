'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Search, Calendar, Users, BookOpen, CheckSquare, Edit, BarChart3, Plus } from 'lucide-react';
import { Lesson, LessonStatus } from '@/types/database';
import { lessonService, LessonFilters } from '@/lib/supabase/lessons';
import { scheduleService } from '@/lib/supabase/schedules';
import { courseService } from '@/lib/supabase/courses';
import { Button, Card, Badge, SearchBox, Select, Spinner, Tabs, TabsList, TabsTrigger, TabsContent, RichTextTruncate } from '@/components/ui';
import { LessonDetailModal } from '@/components/schedules/LessonDetailModal';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
}

interface Schedule {
  id: string;
  name: string;
  course_id: string;
}

const statusColors: Record<LessonStatus, 'default' | 'warning' | 'success' | 'danger'> = {
  draft: 'default',
  scheduled: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export default function LessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [totalStats, setTotalStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    draft: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  // Memoize the load function to prevent unnecessary recreations
  const loadLessons = useCallback(async (search?: string, isFilterChange = false) => {
    try {
      const isInitialLoad = !search && !searchQuery && !isFilterChange;
      
      if (isInitialLoad) {
        setLoading(true);
      } else if (search) {
        setSearching(true);
      } else if (isFilterChange) {
        setFiltering(true);
      }
      
      // Build filters
      const filters: LessonFilters = {};
      
      if (search) {
        filters.search = search;
      }
      if (selectedSchedule) {
        filters.schedule_id = selectedSchedule;
      }
      if (selectedStatus) {
        filters.status = selectedStatus as LessonStatus;
      }

      const data = await lessonService.getLessons(filters);
      
      // Filter by course (if no schedule selected) - now done client-side only for course filtering
      let filteredLessons = data;
      
      if (selectedCourse && !selectedSchedule) {
        filteredLessons = filteredLessons.filter(lesson => 
          lesson.schedule?.course?.id === selectedCourse
        );
      }
      
      setLessons(filteredLessons);
    } catch (error) {
      console.error('Failed to load lessons:', error);
    } finally {
      setLoading(false);
      setSearching(false);
      setFiltering(false);
    }
  }, [selectedCourse, selectedSchedule, selectedStatus, searchQuery]);

  // Handle search with debouncing
  const handleSearch = useCallback((search: string) => {
    setSearchQuery(search);
    loadLessons(search);
  }, [loadLessons]);

  // Handle course selection
  const handleCourseChange = useCallback((courseId: string) => {
    setSelectedCourse(courseId);
    // Don't trigger immediate reload, let useEffect handle it
  }, []);

  // Handle schedule selection
  const handleScheduleChange = useCallback((scheduleId: string) => {
    setSelectedSchedule(scheduleId);
    // Don't trigger immediate reload, let useEffect handle it
  }, []);

  // Handle status selection
  const handleStatusChange = useCallback((status: string) => {
    setSelectedStatus(status);
    // Don't trigger immediate reload, let useEffect handle it
  }, []);

  // Reload when filters change (with debounced effect)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadLessons(undefined, true);
    }, 100); // Small delay to prevent rapid successive calls

    return () => clearTimeout(timeoutId);
  }, [selectedCourse, selectedSchedule, selectedStatus, loadLessons]);

  useEffect(() => {
    // Filter schedules based on selected course
    if (selectedCourse) {
      setSchedules(allSchedules.filter(s => s.course_id === selectedCourse));
      setSelectedSchedule(''); // Reset schedule selection when course changes
    } else {
      setSchedules(allSchedules);
      setSelectedSchedule('');
    }
  }, [selectedCourse, allSchedules]);

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsDetailModalOpen(true);
  };

  const loadInitialData = async () => {
    try {
      // Load courses, schedules, and lesson statistics
      const [coursesData, schedulesData] = await Promise.all([
        courseService.getCourses(),
        scheduleService.getSchedules(),
        loadTotalStats()
      ]);
      
      setCourses(coursesData);
      setAllSchedules(schedulesData);
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadTotalStats = async () => {
    try {
      // Get all lessons without filters to calculate total statistics
      const allLessons = await lessonService.getLessons({});
      
      const stats = {
        total: allLessons.length,
        scheduled: allLessons.filter(lesson => lesson.status === 'scheduled').length,
        completed: allLessons.filter(lesson => lesson.status === 'completed').length,
        draft: allLessons.filter(lesson => lesson.status === 'draft').length
      };
      
      setTotalStats(stats);
    } catch (error) {
      console.error('Failed to load lesson statistics:', error);
    }
  };



  const renderOverviewContent = () => {
    return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{totalStats.total}</p>
                <p className="text-sm text-gray-600">Total Lessons</p>
              </div>
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {totalStats.scheduled}
                </p>
                <p className="text-sm text-gray-600">Scheduled</p>
              </div>
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {totalStats.completed}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {totalStats.draft}
                </p>
                <p className="text-sm text-gray-600">Drafts</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Lessons List */}
      {renderLessonsList()}
    </div>
    );
  };

  const renderBooksContent = () => {
    const lessonsWithBooks = lessons.filter(lesson => 
      lesson.lesson_books && lesson.lesson_books.length > 0
    );

    return (
      <div className="space-y-6">
        <div className="text-sm text-gray-600">
          Showing {lessonsWithBooks.length} lessons with books out of {lessons.length} total lessons
        </div>
        
        {lessonsWithBooks.length === 0 ? (
          <Card>
            <Card.Content className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No lessons with books found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add books to lessons to see them here.
              </p>
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {lessonsWithBooks.map((lesson) => (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <Card.Content className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{lesson.title}</h3>
                        <Badge variant={statusColors[lesson.status]} size="sm">
                          {lesson.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>{new Date(lesson.date).toLocaleDateString()}</span>
                        <span>{lesson.start_time} - {lesson.end_time}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/lessons/${lesson.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  
                  {/* Books */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Associated Books:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {lesson.lesson_books?.map((lessonBook: any) => (
                        <div key={lessonBook.id} className="p-3 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <BookOpen className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{lessonBook.book?.title}</p>
                              {lessonBook.book?.author && (
                                <p className="text-xs text-gray-500 truncate">by {lessonBook.book.author}</p>
                              )}
                              {(lessonBook.pages_from || lessonBook.pages_to) && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Pages: {lessonBook.pages_from || ''}{lessonBook.pages_from && lessonBook.pages_to ? '-' : ''}{lessonBook.pages_to || ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTasksContent = () => {
    const lessonsWithTasks = lessons.filter(lesson => 
      lesson.lesson_tasks && lesson.lesson_tasks.length > 0
    );

    return (
      <div className="space-y-6">
        <div className="text-sm text-gray-600">
          Showing {lessonsWithTasks.length} lessons with tasks out of {lessons.length} total lessons
        </div>
        
        {lessonsWithTasks.length === 0 ? (
          <Card>
            <Card.Content className="p-12 text-center">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No lessons with tasks found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add tasks to lessons to see them here.
              </p>
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {lessonsWithTasks.map((lesson) => (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <Card.Content className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{lesson.title}</h3>
                        <Badge variant={statusColors[lesson.status]} size="sm">
                          {lesson.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>{new Date(lesson.date).toLocaleDateString()}</span>
                        <span>{lesson.start_time} - {lesson.end_time}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/lessons/${lesson.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  
                  {/* Tasks */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Associated Tasks:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {lesson.lesson_tasks?.map((lessonTask: any) => (
                        <div key={lessonTask.id} className="p-3 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckSquare className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">{lessonTask.task?.title}</p>
                                {lessonTask.is_homework && (
                                  <Badge variant="outline" size="sm">Homework</Badge>
                                )}
                              </div>
                              {lessonTask.task?.description && (
                                <RichTextTruncate
                                  content={lessonTask.task.description}
                                  maxLength={80}
                                  maxLines={2}
                                  className="text-xs"
                                />
                              )}
                              {lessonTask.due_date && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Due: {new Date(lessonTask.due_date).toLocaleDateString()}
                                </p>
                              )}
                              {(lessonTask.task?.duration_minutes || lessonTask.duration_override) && (
                                <p className="text-xs text-gray-500 mt-1">
                                  ~{lessonTask.duration_override || lessonTask.task?.duration_minutes} min
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderLessonsList = () => {
    if (lessons.length === 0) {
      return (
        <Card>
          <Card.Content className="p-12 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No lessons found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedCourse || selectedSchedule 
                ? 'No lessons match your current filters.' 
                : 'Lessons are created from schedules. Create a schedule first to generate lessons.'
              }
            </p>
            {!selectedCourse && !selectedSchedule && (
              <Button onClick={() => router.push('/admin/schedules')}>
                Go to Schedules
              </Button>
            )}
          </Card.Content>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {lessons.map((lesson) => (
          <Card key={lesson.id} className="hover:shadow-md transition-shadow">
            <Card.Content className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{lesson.title}</h3>
                    <Badge variant={statusColors[lesson.status]} size="sm">
                      {lesson.status}
                    </Badge>
                    {lesson.lesson_number && (
                      <Badge variant="outline" size="sm">
                        #{lesson.lesson_number}
                      </Badge>
                    )}
                  </div>
                  
                  {lesson.description && (
                    <div className="mb-3">
                      <RichTextTruncate
                        content={lesson.description}
                        maxLength={150}
                        maxLines={2}
                        className="text-sm"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(lesson.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{lesson.start_time} - {lesson.end_time}</span>
                    </div>
                    {lesson.location && (
                      <div className="flex items-center gap-1">
                        <span>{lesson.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {lesson.schedule?.course && (
                      <span className="font-medium">{lesson.schedule.course.title}</span>
                    )}
                    {lesson.schedule && (
                      <span>{lesson.schedule.name}</span>
                    )}
                    {lesson.lesson_books && lesson.lesson_books.length > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {lesson.lesson_books.length} book{lesson.lesson_books.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {lesson.lesson_tasks && lesson.lesson_tasks.length > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        {lesson.lesson_tasks.length} task{lesson.lesson_tasks.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/lessons/${lesson.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {lesson.schedule && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/schedules/${lesson.schedule_id}`)}
                    >
                      Schedule
                    </Button>
                  )}
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  ];

  // Use the lessons state as filteredLessons
  const filteredLessons = lessons;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lessons</h1>
        {/* Lessons are created from schedules, not directly */}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SearchBox
          placeholder={searching ? "Searching..." : "Search lessons..."}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="md:col-span-1"
          disabled={searching}
        />
        
        <Select
          value={selectedCourse}
          onChange={(e) => handleCourseChange(e.target.value)}
          className="md:col-span-1"
          placeholder="All Courses"
          options={[
            { value: '', label: 'All Courses' },
            ...courses.map((course) => ({
              value: course.id,
              label: course.title
            }))
          ]}
        />
        
        <Select
          value={selectedSchedule}
          onChange={(e) => handleScheduleChange(e.target.value)}
          className="md:col-span-1"
          disabled={!selectedCourse && schedules.length === allSchedules.length}
          placeholder="All Schedules"
          options={[
            { value: '', label: 'All Schedules' },
            ...schedules.map((schedule) => ({
              value: schedule.id,
              label: schedule.name
            }))
          ]}
        />
        
        <Select
          value={selectedStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="md:col-span-1"
          placeholder="All Statuses"
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ]}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          {renderOverviewContent()}
        </TabsContent>

        <TabsContent value="books">
          {renderBooksContent()}
        </TabsContent>

        <TabsContent value="tasks">
          {renderTasksContent()}
        </TabsContent>
      </Tabs>

      {selectedLesson && (
        <LessonDetailModal
          lesson={selectedLesson as any}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedLesson(null);
          }}
          onEdit={() => router.push(`/admin/lessons/${selectedLesson.id}/edit`)}
        />
      )}
    </div>
  );
}