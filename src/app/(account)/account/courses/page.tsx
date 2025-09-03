'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, Clock, ChevronRight, Search, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';

interface EnrolledCourse {
  id: string;
  course_id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  duration_hours: number;
  difficulty: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  enrolled_at: string;
  last_accessed?: string;
  completion_date?: string;
  category?: string;
  total_lessons: number;
  completed_lessons: number;
}

// Cache key and duration constants
const CACHE_KEY = 'account_enrolled_courses';
const CACHE_DURATION = 60000; // 1 minute cache

// Utility: Get cached data with TTL
const getCachedCourses = (): EnrolledCourse[] | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age > CACHE_DURATION) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

// Utility: Save to cache
const setCachedCourses = (courses: EnrolledCourse[]) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data: courses,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to cache courses:', error);
  }
};

// Utility: Fetch with timeout
const fetchWithTimeout = async (url: string, timeout = 5000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Skeleton loader component
const CourseCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
    <div className="flex items-center">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="mt-3">
          <div className="h-1.5 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      <div className="ml-4 h-9 w-24 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default function CoursesPage() {
  // Initialize with cached data for instant UI
  const [courses, setCourses] = useState<EnrolledCourse[]>(() => {
    return getCachedCourses() || [];
  });
  const [filteredCourses, setFilteredCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(false); // Start with false for instant UI
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if we have cached data
  const hasCachedData = courses.length > 0;

  useEffect(() => {
    // If no cached data, show loading
    if (!hasCachedData) {
      setLoading(true);
    }
    
    // Always fetch fresh data (background refresh if cached)
    fetchEnrolledCourses();
  }, []);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, filter]);

  const fetchEnrolledCourses = async () => {
    try {
      setError(null);
      
      // Only show refreshing indicator if we have cached data
      if (hasCachedData) {
        setIsRefreshing(true);
      }
      
      const response = await fetchWithTimeout('/api/enrollments/current', 5000);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Don't redirect immediately - let user see cached data
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          return;
        }
        throw new Error(data.error || 'Failed to fetch enrollments');
      }

      const enrolled = data.enrollments?.map((enrollment: any) => {
        const course = enrollment.course;
        const progress = enrollment.progress?.completion_percentage || 0;
        
        let status: 'not_started' | 'in_progress' | 'completed';
        if (enrollment.status === 'completed') {
          status = 'completed';
        } else if (enrollment.status === 'active' || progress > 0) {
          status = 'in_progress';
        } else {
          status = 'not_started';
        }

        return {
          id: enrollment.id,
          course_id: enrollment.course_id,
          title: course?.title || 'Unknown Course',
          description: course?.short_description || course?.description || '',
          thumbnail_url: course?.thumbnail_url,
          duration_hours: course?.duration_hours || 0,
          difficulty: course?.difficulty || 'standard',
          progress: progress,
          status: status,
          enrolled_at: enrollment.enrolled_at,
          last_accessed: enrollment.started_at || enrollment.enrolled_at,
          completion_date: enrollment.completed_at,
          category: course?.category?.name || 'General',
          total_lessons: enrollment.progress?.total_lessons || 0,
          completed_lessons: enrollment.progress?.completed_lessons || 0
        };
      }) || [];

      setCourses(enrolled);
      setCachedCourses(enrolled); // Cache the new data
    } catch (error: any) {
      console.error('Error fetching enrolled courses:', error);
      
      // Only show error if no cached data
      if (!hasCachedData) {
        setError(error.message || 'Failed to load courses');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterAndSortCourses = useCallback(() => {
    let filtered = [...courses];

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter === 'active') {
      filtered = filtered.filter(course => course.status === 'in_progress' || course.status === 'not_started');
    } else if (filter === 'completed') {
      filtered = filtered.filter(course => course.status === 'completed');
    }

    filtered.sort((a, b) => 
      new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
    );

    setFilteredCourses(filtered);
  }, [courses, searchTerm, filter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Manual refresh function
  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchEnrolledCourses();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Courses</h1>
            <p className="mt-1 text-sm text-gray-500">
              {loading && !hasCachedData ? (
                <span className="animate-pulse">Loading courses...</span>
              ) : (
                <>{courses.length} course{courses.length !== 1 ? 's' : ''} enrolled</>
              )}
            </p>
          </div>
          {hasCachedData && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300"
            disabled={loading && !hasCachedData}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            disabled={loading && !hasCachedData}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            disabled={loading && !hasCachedData}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'active' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            disabled={loading && !hasCachedData}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'completed' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && !hasCachedData && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchEnrolledCourses}
            className="text-sm font-medium underline mt-1"
          >
            Try again
          </button>
        </div>
      )}

      {/* Course List */}
      {loading && !hasCachedData ? (
        <div className="space-y-3">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filter !== 'all' ? 'No courses found' : 'No courses enrolled'}
          </h3>
          <p className="text-gray-500 text-sm">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Browse available courses to get started'}
          </p>
          {!searchTerm && filter === 'all' && (
            <Link href="/courses">
              <Button className="mt-4" variant="primary">
                Browse Courses
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="p-0 hover:shadow-md transition-shadow">
              <div className="flex items-center p-4">
                {/* Left section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {course.title}
                    </h3>
                    {course.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {course.duration_hours > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{course.duration_hours}h</span>
                      </div>
                    )}
                    {course.category && (
                      <span>{course.category}</span>
                    )}
                    <span>Enrolled {formatDate(course.enrolled_at)}</span>
                  </div>

                  {/* Progress bar for courses with any progress or completed courses */}
                  {(course.progress > 0 || course.status === 'completed') && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>
                          {course.status === 'completed' 
                            ? 'Completed' 
                            : `${course.completed_lessons}/${course.total_lessons} lessons`
                          }
                        </span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${
                            course.status === 'completed' 
                              ? 'bg-green-600' 
                              : 'bg-gray-900'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right section - Action */}
                <Link 
                  href={`/account/courses/${course.course_id}`}
                  className="ml-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {course.status === 'completed' ? 'Review' : course.status === 'in_progress' ? 'Continue' : 'Start'}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {courses.length > 0 && (
        <div className="pt-6 border-t border-gray-200">
          <div className="flex gap-6 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-900">{courses.filter(c => c.status === 'in_progress').length}</span> in progress
            </div>
            <div>
              <span className="font-medium text-gray-900">{courses.filter(c => c.status === 'completed').length}</span> completed
            </div>
            <div>
              <span className="font-medium text-gray-900">{courses.filter(c => c.status === 'not_started').length}</span> not started
            </div>
          </div>
        </div>
      )}
    </div>
  );
}