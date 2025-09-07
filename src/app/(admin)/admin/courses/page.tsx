'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Plus, Search, Filter, BookOpen, Book, Clock, BarChart3, ChevronLeft, ChevronRight, Calendar, Target, Settings, CheckCircle, Package } from 'lucide-react';
import { Course, CourseStatus, DifficultyLevel } from '@/types/database';
import { courseService, CourseFilters, PaginatedResponse } from '@/lib/supabase/courses';
import { Button, Card, Badge, SearchBox, FilterPanel, Spinner, Select } from '@/components/ui';
import { cn } from '@/lib/utils';

const statusColors: Record<CourseStatus, string> = {
  draft: 'default',
  published: 'success',
  archived: 'secondary',
};

const difficultyColors: Record<DifficultyLevel, string> = {
  basic: 'info',
  standard: 'warning',
  premium: 'primary',
};

const difficultyLabels = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
} as const;

export default function CoursesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Parse filters from URL
  const page = searchParams.get('page');
  const perPage = searchParams.get('perPage');
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const difficulty = searchParams.get('difficulty');
  
  // Create filters object from URL params
  const urlFilters: CourseFilters = {
    page: page ? parseInt(page) : 1,
    perPage: perPage ? parseInt(perPage) : 12,
    search: search || undefined,
    status: status as CourseStatus || undefined,
    difficulty: difficulty as DifficultyLevel || undefined,
  };
  
  const [pagination, setPagination] = useState({
    page: urlFilters.page || 1,
    perPage: urlFilters.perPage || 12,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    published: 0,
    archived: 0,
  });
  // State to control the visibility of the filter panel
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Update URL helper
  const updateURL = useCallback((newFilters: CourseFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
    if (newFilters.perPage && newFilters.perPage !== 12) params.set('perPage', newFilters.perPage.toString());
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.difficulty) params.set('difficulty', newFilters.difficulty);
    
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.replace(url, { scroll: false });
  }, [pathname, router]);

  const loadCourses = useCallback(async (filters: CourseFilters) => {
    try {
      console.log('[AdminCoursesPage] Loading courses with optimized API');
      if (filters.search !== undefined) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      // Use optimized admin courses list endpoint
      const result = await courseService.getAdminCoursesList(filters);
      setCourses(result.data);
      setPagination(result.pagination);
      // Update stats if available from the response
      if (result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, []);

  // Load courses with current URL filters on mount and when URL changes
  useEffect(() => {
    loadCourses(urlFilters);
  }, [page, perPage, search, status, difficulty]);

  // Note: Stats are now loaded together with courses for better performance

  const handleSearch = useCallback((searchTerm: string) => {
    const newFilters = {
      ...urlFilters,
      search: searchTerm || undefined,
      page: 1 // Reset to page 1 on new search
    };
    updateURL(newFilters);
  }, [urlFilters, updateURL]);

  const handleFilterChange = useCallback((filterId: string, value: any) => {
    const newFilters = {
      ...urlFilters,
      [filterId]: value,
      page: 1 // Reset to page 1 on filter change
    };
    updateURL(newFilters);
  }, [urlFilters, updateURL]);

  const handlePageChange = useCallback((newPage: number) => {
    const newFilters = {
      ...urlFilters,
      page: newPage
    };
    updateURL(newFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [urlFilters, updateURL]);

  const handlePerPageChange = useCallback((newPerPage: number) => {
    const newFilters = {
      ...urlFilters,
      perPage: newPerPage,
      page: 1
    };
    updateURL(newFilters);
  }, [urlFilters, updateURL]);

  const filterGroups = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'checkbox' as const,
      options: [
        { value: 'draft', label: 'Draft', count: stats.draft },
        { value: 'published', label: 'Published', count: stats.published },
        { value: 'archived', label: 'Archived', count: stats.archived },
      ],
    },
    {
      id: 'difficulty',
      label: 'Difficulty',
      type: 'radio' as const,
      options: [
        { value: 'basic', label: 'Basic' },
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' },
      ],
    },
  ], [stats]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Courses</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your courses and learning materials
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Course-related management buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/schedules')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Schedules
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/lessons')}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Sessions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/tasks')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Tasks
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/objectives')}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Objectives
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/methods')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Methods
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/packages')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Packages
            </Button>
          </div>
          
          {/* Main action */}
          <div className="border-l border-gray-200 pl-2">
            <Button
              onClick={() => router.push('/admin/courses/new')}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Course
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.total}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Draft</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.draft}
              </p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Published</p>
              <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                {stats.published}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Archived</p>
              <p className="mt-1 text-2xl font-semibold text-gray-500 dark:text-gray-400">
                {stats.archived}
              </p>
            </div>
            <Filter className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
                <SearchBox
                    placeholder="Search courses..."
                    onSearch={handleSearch}
                    initialValue={urlFilters.search}
                    fullWidth
                />
                {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Spinner size="sm" />
                    </div>
                )}
            </div>
            <Button
                variant="outline"
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                leftIcon={<Filter className="h-4 w-4" />}
            >
                Filters
            </Button>
        </div>
        {isFilterPanelOpen && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <FilterPanel
                    filters={filterGroups}
                    values={urlFilters}
                    onChange={handleFilterChange}
                    onReset={() => updateURL({ page: 1, perPage: 12 })}
                    collapsible={false}
                />
            </div>
        )}
      </div>


      {/* Course Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : searchLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="hover:shadow-lg transition-shadow cursor-pointer opacity-60 animate-pulse"
              onClick={() => router.push(`/admin/courses/${course.id}`)}
            >
              {course.thumbnail_url && (
                <div className="h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Card.Content className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {course.title}
                  </h3>
                  <Badge
                    variant={statusColors[course.status] as any}
                    size="sm"
                  >
                    {course.status}
                  </Badge>
                </div>
                
                {course.short_description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {course.short_description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={difficultyColors[course.difficulty] as any}
                      size="sm"
                    >
                      {difficultyLabels[course.difficulty]}
                    </Badge>
                    {course.duration_hours && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration_hours}h
                      </span>
                    )}
                    {course.course_books && course.course_books.length > 0 && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Book className="h-3 w-3" />
                        {course.course_books.length}
                      </span>
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
                
                {course.tags && course.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {course.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {course.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{course.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Card.Content>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No courses found</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Get started by creating your first course.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push('/admin/courses/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Course
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/courses/${course.id}`)}
            >
              {course.thumbnail_url && (
                <div className="h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Card.Content className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {course.title}
                  </h3>
                  <Badge
                    variant={statusColors[course.status] as any}
                    size="sm"
                  >
                    {course.status}
                  </Badge>
                </div>
                
                {course.short_description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {course.short_description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={difficultyColors[course.difficulty] as any}
                      size="sm"
                    >
                      {difficultyLabels[course.difficulty]}
                    </Badge>
                    {course.duration_hours && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration_hours}h
                      </span>
                    )}
                    {course.course_books && course.course_books.length > 0 && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Book className="h-3 w-3" />
                        {course.course_books.length}
                      </span>
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
                
                {course.tags && course.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {course.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {course.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{course.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination Controls */}
      {!loading && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.page - 1) * pagination.perPage) + 1} to {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} courses
            </span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Per page:</label>
              <Select
                value={pagination.perPage.toString()}
                onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                className="w-20"
              >
                <option value="6">6</option>
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(pagination.totalPages)].map((_, index) => {
                const page = index + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  );
                } else if (
                  page === pagination.page - 2 ||
                  page === pagination.page + 2
                ) {
                  return <span key={page} className="px-2 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
