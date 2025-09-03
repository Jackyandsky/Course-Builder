'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Calendar, Copy, ArrowLeft, Search, ChevronDown, X } from 'lucide-react';
import { Schedule } from '@/types/schedule';
import { Course } from '@/types/database';
import { scheduleService } from '@/lib/supabase/schedules';
import { courseService } from '@/lib/supabase/courses';
import { 
  Button, Card, Badge, Spinner, Pagination 
} from '@/components/ui';

export default function SchedulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [totalSchedules, setTotalSchedules] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set());
  const [attaching, setAttaching] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const courseId = searchParams.get('courseId');
  const action = searchParams.get('action');
  const isAttachMode = action === 'attach' && courseId;

  // Define loadSchedules before using it in useEffect
  const loadSchedules = useCallback(async (courseIds: string[] = []) => {
    try {
      setLoading(true);
      
      // Build filters - include course filter if provided
      const filters: any = {
        page: 1,
        perPage: 1000, // Load all schedules for proper filtering
        course_ids: courseIds.length > 0 ? courseIds : undefined
      };
      
      // Use optimized admin schedules list endpoint
      const result = await scheduleService.getAdminSchedulesList(filters);
      const data = result.data;
      
      console.log('[AdminSchedulesPage] Loading schedules with filters:', filters);
      console.log('[AdminSchedulesPage] Loaded', data.length, 'schedules, total:', result.pagination?.total);
      
      // If in attach mode, filter out schedules that already belong to this course
      if (isAttachMode && courseId) {
        const filteredSchedules = data.filter(schedule => schedule.course_id !== courseId);
        setSchedules(filteredSchedules as Schedule[]);
        setTotalSchedules(filteredSchedules.length);
      } else {
        setSchedules(data as Schedule[]);
        setTotalSchedules(result.pagination?.total || data.length);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [isAttachMode, courseId]);

  useEffect(() => {
    loadSchedules();
    loadCourses();
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Reload schedules from server when course filter changes
  useEffect(() => {
    // Skip initial load since we call loadSchedules in the first useEffect
    if (courses.length === 0) return;
    
    // Make a new server request with course filters
    loadSchedules(selectedCourseIds);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [selectedCourseIds, loadSchedules]);
  
  // Calculate paginated schedules
  const paginatedSchedules = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return schedules.slice(startIndex, endIndex);
  }, [schedules, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(schedules.length / itemsPerPage);
  
  // Filter courses for dropdown search
  const filteredCourses = useMemo(() => {
    if (!courseSearchQuery) return courses;
    const query = courseSearchQuery.toLowerCase().trim();
    return courses.filter(course => {
      // Check title - handle special characters and spacing
      const title = course.title.toLowerCase().replace(/\s+/g, ' ');
      const code = course.code?.toLowerCase() || '';
      const description = course.description?.toLowerCase() || '';
      
      // Check if query matches anywhere in title, code, or description
      return title.includes(query) || 
             code.includes(query) ||
             description.includes(query) ||
             // Also check without spaces/dashes for patterns like "8-9" or "8 9"
             title.replace(/[-\s]/g, '').includes(query.replace(/[-\s]/g, '')) ||
             code.replace(/[-\s]/g, '').includes(query.replace(/[-\s]/g, ''));
    });
  }, [courses, courseSearchQuery]);

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await courseService.getCourses({ perPage: 1000 }); // Get all courses
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };


  const toggleScheduleSelection = (scheduleId: string) => {
    const newSelection = new Set(selectedSchedules);
    if (newSelection.has(scheduleId)) {
      newSelection.delete(scheduleId);
    } else {
      newSelection.add(scheduleId);
    }
    setSelectedSchedules(newSelection);
  };

  const handleAttachSchedules = async () => {
    if (!courseId || selectedSchedules.size === 0) return;
    
    setAttaching(true);
    try {
      let successCount = 0;
      
      for (const scheduleId of Array.from(selectedSchedules)) {
        const originalSchedule = schedules.find(s => s.id === scheduleId);
        if (!originalSchedule) continue;
        
        // Clone the schedule for the new course
        const clonedScheduleData = {
          ...originalSchedule,
          course_id: courseId,
          name: `${originalSchedule.name} (Copy)`,
          // Remove fields that shouldn't be copied
          id: undefined,
          created_at: undefined,
          updated_at: undefined,
          course: undefined,
          lessons: undefined,
        };
        
        await scheduleService.createSchedule(clonedScheduleData);
        successCount++;
      }
      
      // Navigate back to the course with success message
      router.push(`/admin/courses/${courseId}?tab=schedule&attached=${successCount}`);
    } catch (error) {
      console.error('Failed to attach schedules:', error);
    } finally {
      setAttaching(false);
    }
  };

  const handleScheduleClick = (schedule: Schedule) => {
    if (isAttachMode) {
      toggleScheduleSelection(schedule.id);
    } else {
      router.push(`/admin/schedules/${schedule.id}`);
    }
  };
  
  const toggleCourseSelection = (courseId: string) => {
    const newSelection = selectedCourseIds.includes(courseId)
      ? selectedCourseIds.filter(id => id !== courseId)
      : [...selectedCourseIds, courseId];
    setSelectedCourseIds(newSelection);
  };
  
  const clearAllFilters = () => {
    setSelectedCourseIds([]);
    setCourseSearchQuery('');
    setIsDropdownOpen(false);
  };
  
  const selectedCourseTitles = courses
    .filter(course => selectedCourseIds.includes(course.id))
    .map(course => course.title);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {isAttachMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/courses/${courseId}?tab=schedule`)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              className="mb-2"
            >
              Back to Course
            </Button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isAttachMode ? 'Attach Existing Schedules' : 'Schedules'}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isAttachMode 
              ? `Select schedules to attach to your course. Selected schedules will be cloned.`
              : `Manage your course schedules and lesson plans. ${totalSchedules > 0 ? `(${totalSchedules} total schedules)` : ''}`
            }
          </p>
        </div>
        <div className="flex gap-2">
          {isAttachMode ? (
            <Button
              onClick={handleAttachSchedules}
              disabled={selectedSchedules.size === 0 || attaching}
              leftIcon={attaching ? <Spinner size="sm" /> : <Copy className="h-4 w-4" />}
            >
              {attaching ? 'Attaching...' : `Attach ${selectedSchedules.size} Schedule${selectedSchedules.size !== 1 ? 's' : ''}`}
            </Button>
          ) : (
            <Button
              onClick={() => router.push('/admin/schedules/new')}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Schedule
            </Button>
          )}
        </div>
      </div>

      {/* Course Filter Dropdown */}
      <div ref={dropdownRef} className="relative max-w-md">
        {!isDropdownOpen ? (
          // Closed state - show button
          <Button
            variant="outline"
            onClick={() => setIsDropdownOpen(true)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {selectedCourseIds.length > 0 
                ? `${selectedCourseIds.length} course${selectedCourseIds.length > 1 ? 's' : ''} selected`
                : 'Filter by courses...'}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        ) : (
          // Open state - show search input that transforms into dropdown
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                placeholder="Type to search courses..."
                className="w-full pl-10 pr-10 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setCourseSearchQuery('');
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            
            {/* Dropdown Menu */}
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
              {/* Course List */}
              <div className="max-h-96 overflow-y-auto">
                {loadingCourses ? (
                  <div className="p-4 text-center">
                    <Spinner size="sm" />
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No courses found
                  </div>
                ) : (
                  <>
                    {/* Summary Bar */}
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400">
                      Showing {filteredCourses.length} of {courses.length} courses
                      {selectedCourseIds.length > 0 && (
                        <span className="ml-2 font-medium text-blue-600">
                          • {selectedCourseIds.length} selected
                        </span>
                      )}
                    </div>
                    
                    {/* Course List */}
                    <div className="py-1">
                      {filteredCourses.map(course => (
                        <label
                          key={course.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCourseIds.includes(course.id)}
                            onChange={() => toggleCourseSelection(course.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {course.title}
                            </div>
                            {course.code && (
                              <div className="text-xs text-gray-500 truncate">
                                {course.code}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* Footer Actions */}
              {(selectedCourseIds.length > 0 || courseSearchQuery) && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  {selectedCourseIds.length > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Clear selection
                    </button>
                  )}
                  {courseSearchQuery && (
                    <button
                      onClick={() => setCourseSearchQuery('')}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {selectedCourseIds.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Active filters:</span>
          <Badge variant="secondary">
            {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? 's' : ''} selected
          </Badge>
          <span className="text-gray-500">
            • Showing {schedules.length} of {totalSchedules} schedules
          </span>
          <button
            onClick={() => {
              setSelectedCourseIds([]);
            }}
            className="ml-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Schedules Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : schedules.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No schedules found</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Get started by creating your first schedule.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push('/admin/schedules/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Schedule
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedSchedules.map((schedule) => {
            const isSelected = selectedSchedules.has(schedule.id);
            return (
              <Card
                key={schedule.id}
                className={`transition-all cursor-pointer ${
                  isAttachMode 
                    ? isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:ring-1 hover:ring-gray-300'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => handleScheduleClick(schedule)}
              >
                <Card.Content className="p-4">
                  {isAttachMode && (
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleScheduleSelection(schedule.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {isSelected ? 'Selected' : 'Select to attach'}
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{schedule.name}</h3>
                  {schedule.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{schedule.description}</p>}
                  <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                    {/* The course relation might not be populated, so we add a fallback */}
                    <span>{schedule.course?.title || 'No Course'}</span>
                    <Badge variant={schedule.is_active ? 'success' : 'secondary'}>
                      {schedule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              showFirstLast={true}
            />
          </div>
        )}
      </>
      )}
    </div>
  );
}