'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, BookOpen, Clock, BarChart3 } from 'lucide-react';
import { Course, CourseStatus, DifficultyLevel } from '@/types/database';
import { courseService, CourseFilters } from '@/lib/supabase/courses';
import { Button, Card, Badge, SearchBox, FilterPanel, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

const statusColors: Record<CourseStatus, string> = {
  draft: 'default',
  published: 'success',
  archived: 'secondary',
};

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'info',
  intermediate: 'warning',
  advanced: 'danger',
  expert: 'primary',
};

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CourseFilters>({});
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    published: 0,
    archived: 0,
  });

  useEffect(() => {
    loadCourses();
    loadStats();
  }, [filters]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourses(filters);
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await courseService.getCourseStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search });
  };

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters({ ...filters, [filterId]: value });
  };

  const filterGroups = [
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
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
        { value: 'expert', label: 'Expert' },
      ],
    },
  ];

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
        <Button
          onClick={() => router.push('/courses/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Course
        </Button>
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
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBox
            placeholder="Search courses..."
            onSearch={handleSearch}
            fullWidth
          />
        </div>
        <div className="lg:w-80">
          <FilterPanel
            filters={filterGroups}
            values={filters}
            onChange={handleFilterChange}
            onReset={() => setFilters({})}
            collapsible={false}
            className="h-full"
          />
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
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
            onClick={() => router.push('/courses/new')}
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
              onClick={() => router.push(`/courses/${course.id}`)}
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
                      {course.difficulty}
                    </Badge>
                    {course.duration_hours && (
                      <span className="text-sm text-gray-500">
                        {course.duration_hours}h
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
    </div>
  );
}
