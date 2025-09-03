'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, Search, Calendar, Users, BookOpen, CheckSquare, Edit, BarChart3, Plus } from 'lucide-react';
import { Lesson, LessonStatus } from '@/types/database';
import { lessonService, LessonFilters } from '@/lib/supabase/lessons';
import { scheduleService } from '@/lib/supabase/schedules';
import { courseService } from '@/lib/supabase/courses';
import { Button, Card, Badge, SearchBox, Select, SearchableSelect, Spinner, Tabs, TabsList, TabsTrigger, TabsContent, RichTextTruncate } from '@/components/ui';
import type { SearchableSelectOption } from '@/components/ui';
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

function LessonsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [filtering, setFiltering] = useState(false);
  
  // Initialize filters from session storage or defaults
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSearchQuery, setInternalSearchQuery] = useState(''); // Internal state for immediate UI updates
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [totalStats, setTotalStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    draft: 0
  });

  // Save filters to session storage whenever they change
  useEffect(() => {
    // Skip saving on initial mount when everything is default
    const isInitialState = searchQuery === '' && 
                          selectedCourse === '' && 
                          selectedSchedule === '' && 
                          selectedStatus === '' && 
                          activeTab === 'overview';
    
    // Always save filters to preserve state, even if they're all empty
    const filters = {
      searchQuery,
      selectedCourse,
      selectedSchedule,
      selectedStatus,
      activeTab
    };
    sessionStorage.setItem('adminLessonsFilters', JSON.stringify(filters));
  }, [searchQuery, selectedCourse, selectedSchedule, selectedStatus, activeTab]);

  useEffect(() => {
    // Load filters from session storage on mount
    const savedFilters = sessionStorage.getItem('adminLessonsFilters');
    let initialSearch = '';
    let initialSchedule = '';
    
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        initialSearch = filters.searchQuery || '';
        initialSchedule = filters.selectedSchedule || '';
        
        setSearchQuery(filters.searchQuery || '');
        setInternalSearchQuery(filters.searchQuery || '');
        setSelectedCourse(filters.selectedCourse || '');
        setSelectedSchedule(filters.selectedSchedule || '');
        setSelectedStatus(filters.selectedStatus || '');
        setActiveTab(filters.activeTab || 'overview');
      } catch (e) {
        console.error('Failed to load saved filters:', e);
      }
    }
    
    loadInitialData();
    // Use the loaded filter values for initial load
    loadLessons(initialSearch, false, initialSchedule);
  }, []); // Empty dependency array for initial load only

  // Memoize the load function to prevent unnecessary recreations
  const loadLessons = useCallback(async (search?: string, isFilterChange = false, overrideSchedule?: string | null) => {
    try {
      const isInitialLoad = !search && !searchQuery && !isFilterChange;
      
      // Use override schedule if provided (for immediate updates), otherwise use state
      const scheduleToUse = overrideSchedule !== undefined ? overrideSchedule : selectedSchedule;
      
      if (isInitialLoad) {
        setLoading(true);
      } else if (search) {
        setSearching(true);
      } else if (isFilterChange) {
        setFiltering(true);
      }
      
      // Build filters
      const filters: LessonFilters & { page?: number; perPage?: number } = {
        page: 1,
        perPage: 500  // Increased to load all lessons (currently 255 total)
      };
      
      if (search) {
        filters.search = search;
      }
      // Only add schedule_id if it's not an empty string or null
      if (scheduleToUse && scheduleToUse !== '' && scheduleToUse !== null) {
        filters.schedule_id = scheduleToUse;
      }
      if (selectedStatus) {
        filters.status = selectedStatus as LessonStatus;
      }

      
      // Use optimized admin lessons list endpoint
      const result = await lessonService.getAdminLessonsList(filters);
      let filteredLessons = result.data;
      
      // Filter by course - apply when course is selected (with or without schedule)
      if (selectedCourse) {
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

  // Handle search with proper debouncing
  const handleSearch = useCallback((search: string) => {
    setInternalSearchQuery(search); // Update UI immediately
    
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    // Set new timer for actual search
    const timer = setTimeout(() => {
      setSearchQuery(search);
      loadLessons(search);
    }, 500); // 500ms delay
    
    setSearchDebounceTimer(timer);
  }, [loadLessons, searchDebounceTimer]);

  // Handle course selection
  const handleCourseChange = useCallback((courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedSchedule(''); // Reset schedule immediately
    // Trigger reload with new filters - explicitly pass empty schedule
    loadLessons(searchQuery, true, ''); // Pass empty string explicitly
  }, [searchQuery, loadLessons]);

  // Handle schedule selection
  const handleScheduleChange = useCallback((scheduleId: string) => {
    setSelectedSchedule(scheduleId);
    // Trigger reload with new filters - pass the value explicitly
    loadLessons(searchQuery, true, scheduleId);
  }, [searchQuery, loadLessons]);

  // Handle status selection
  const handleStatusChange = useCallback((status: string) => {
    setSelectedStatus(status);
    // Trigger reload with new filters
    loadLessons(searchQuery, true);
  }, [searchQuery, loadLessons]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  useEffect(() => {
    // Filter schedules based on selected course
    if (selectedCourse) {
      const filteredSchedules = allSchedules.filter(s => s.course_id === selectedCourse);
      setSchedules(filteredSchedules);
    } else {
      setSchedules(allSchedules);
    }
  }, [selectedCourse, allSchedules]);

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsDetailModalOpen(true);
  };

  const loadInitialData = async () => {
    try {
      setCoursesLoading(true);
      // Load courses and schedules using API routes, and lesson statistics
      const [coursesResponse, schedulesResponse] = await Promise.all([
        fetch('/api/courses?isAdmin=true&simple=true', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        }),
        fetch('/api/schedules', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        }),
        loadTotalStats()
      ]);
      
      if (!coursesResponse.ok) {
        throw new Error(`Failed to fetch courses: ${coursesResponse.status}`);
      }
      if (!schedulesResponse.ok) {
        throw new Error(`Failed to fetch schedules: ${schedulesResponse.status}`);
      }
      
      const coursesData = await coursesResponse.json();
      const schedulesData = await schedulesResponse.json();
      
      // Extract courses from paginated response
      const courses = Array.isArray(coursesData) ? coursesData : coursesData.courses || [];
      // Extract schedules from response 
      const schedules = Array.isArray(schedulesData) ? schedulesData : schedulesData.schedules || [];
      
      console.log('Loaded courses:', courses.length, 'courses (simple mode)');
      console.log('Loaded schedules:', schedules.length, 'schedules');
      
      setCourses(courses);
      setAllSchedules(schedules);
      setSchedules(schedules);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      // Set empty arrays on error to prevent infinite loading
      setCourses([]);
      setAllSchedules([]);
      setSchedules([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadTotalStats = async () => {
    try {
      // Use API endpoint to get statistics
      const response = await fetch('/api/lessons/stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch lesson statistics');
      }
      
      const stats = await response.json();
      setTotalStats(stats);
    } catch (error) {
      console.error('Failed to load lesson statistics:', error);
      // Set default values on error
      setTotalStats({
        total: 0,
        scheduled: 0,
        completed: 0,
        draft: 0
      });
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
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox
          placeholder={searching ? "Searching..." : "Search lessons..."}
          value={internalSearchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
          disabled={false}
        />
        
        <SearchableSelect
          value={selectedCourse}
          onChange={handleCourseChange}
          placeholder="All Courses"
          searchPlaceholder="Type to search courses..."
          className="w-full sm:w-auto sm:min-w-[250px] sm:max-w-[400px] lg:max-w-[500px]"
          options={[
            { value: '', label: 'All Courses' },
            ...courses.map((course) => ({
              value: course.id,
              label: course.title || 'Untitled Course'
            }))
          ]}
          maxDisplayItems={15}
          showClearButton={true}
          emptyMessage="No courses found"
          disabled={coursesLoading}
        />
        
        <Select
          key={`schedule-select-${selectedCourse}-${schedules.length}`}
          value={selectedSchedule || ''}
          onChange={(e) => {
            const val = e.target.value;
            handleScheduleChange(val);
          }}
          className="w-auto min-w-[150px] max-w-[250px]"
          placeholder="Select Schedule"
          disabled={!selectedCourse || schedules.length === 0}
          options={schedules.map((schedule) => ({
            value: schedule.id,
            label: schedule.name
          }))}
        />
        
        <Select
          value={selectedStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-auto min-w-[140px] max-w-[200px]"
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ]}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
      }}>
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

export default function LessonsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    }>
      <LessonsPageContent />
    </Suspense>
  );
}