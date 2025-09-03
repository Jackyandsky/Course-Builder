'use client';

import { useState, useEffect } from 'react';
import { 
  AcademicCapIcon, 
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  TrophyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { courseService } from '@/lib/supabase/courses';
import { useAuth } from '@/contexts/AuthContext';
import { getSingletonSupabaseClient } from '@/lib/supabase-singleton';

interface Course {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  duration_hours?: number;
  difficulty?: string;
  thumbnail_url?: string;
  category_id?: string;
  status?: string;
  is_public?: boolean;
  tags?: string[];
  // Note: schedules are fetched separately when a course is selected
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  course?: Course;
  schedule_id?: string;
  schedule?: {
    id: string;
    name: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
  };
  enrolled_at: string;
  is_active: boolean;
  notes?: string;
}

interface AcademicProgressProps {
  userId: string;
  canEdit: boolean;
  onEnrollmentUpdate?: () => void;
}

export default function AcademicProgress({ userId, canEdit, onEnrollmentUpdate }: AcademicProgressProps) {
  const supabase = getSingletonSupabaseClient();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    totalHours: 0
  });
  
  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [selectedCourseSchedules, setSelectedCourseSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Form states for simple update
  const [updateForm, setUpdateForm] = useState({
    notes: ''
  });

  useEffect(() => {
    fetchEnrollments();
  }, [userId]);

  // Fetch available courses after enrollments are loaded to properly filter
  useEffect(() => {
    if (!loading) {
      fetchAvailableCourses();
    }
  }, [enrollments, loading]);

  // Fetch schedules when a course is selected
  useEffect(() => {
    if (selectedCourseId && supabase) {
      fetchCourseSchedules(selectedCourseId);
    } else {
      setSelectedCourseSchedules([]);
    }
  }, [selectedCourseId, supabase]);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch(`/api/enrollments/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setEnrollments(data.enrollments || []);
        setStats(data.stats || {
          total: 0,
          totalHours: 0
        });
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      // Use courseService to fetch courses directly
      // First try to get published courses, then try all courses if none found
      let courses = await courseService.getCourses({ status: 'published' });
      
      if (courses.length === 0) {
        console.log('No published courses found, trying to fetch all courses...');
        courses = await courseService.getCourses({});
      }
      
      console.log('[AcademicProgress] Fetched courses (without schedules):', courses);
      console.log('[AcademicProgress] Current enrollments:', enrollments);
      
      // Filter out courses that the user is already enrolled in
      const availableCoursesFiltered = courses.filter((c: any) => 
        !enrollments.some(e => e.course_id === c.id)
      );
      
      console.log('Available courses after filtering:', availableCoursesFiltered);
      
      // Map to the Course interface we're using
      const mappedCourses = availableCoursesFiltered.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        short_description: c.short_description,
        duration_hours: c.duration_hours,
        difficulty: c.difficulty || 'basic',
        thumbnail_url: c.thumbnail_url,
        category_id: c.category_id,
        status: c.status,
        is_public: c.is_public,
        tags: c.tags || []
        // Note: schedules are fetched separately when a course is selected
      }));
      
      setAvailableCourses(mappedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Try fallback to API endpoint
      try {
        const response = await fetch('/api/courses?includePrivate=true');
        const data = await response.json();
        if (response.ok && data.courses) {
          const availableCoursesFiltered = data.courses.filter((c: Course) => 
            !enrollments.some(e => e.course_id === c.id)
          );
          setAvailableCourses(availableCoursesFiltered);
        }
      } catch (apiError) {
        console.error('Error fetching courses from API:', apiError);
      }
    }
  };

  const fetchCourseSchedules = async (courseId: string) => {
    if (!supabase) {
      console.error('No supabase client available');
      return;
    }
    
    setLoadingSchedules(true);
    try {
      console.log('[AcademicProgress] Fetching schedules for course:', courseId);
      
      const { data: schedulesData, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AcademicProgress] Error fetching schedules:', error);
        setSelectedCourseSchedules([]);
      } else {
        console.log('[AcademicProgress] Successfully fetched schedules:', {
          courseId,
          scheduleCount: schedulesData?.length || 0,
          schedules: schedulesData
        });
        setSelectedCourseSchedules(schedulesData || []);
      }
    } catch (error) {
      console.error('[AcademicProgress] Error fetching course schedules:', error);
      setSelectedCourseSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleAssignCourse = async () => {
    if (!selectedCourseId || !selectedScheduleId) {
      alert('Please select both a course and a schedule');
      return;
    }

    try {
      const response = await fetch(`/api/enrollments/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: selectedCourseId,
          schedule_id: selectedScheduleId
        })
      });

      if (response.ok) {
        setShowAssignModal(false);
        setSelectedCourseId('');
        setSelectedScheduleId('');
        setSelectedCourseSchedules([]);
        await fetchEnrollments();
        onEnrollmentUpdate?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to assign course');
      }
    } catch (error) {
      console.error('Error assigning course:', error);
      alert('Failed to assign course');
    }
  };

  const handleUpdateEnrollment = async () => {
    if (!selectedEnrollment) return;

    try {
      const response = await fetch(`/api/enrollments/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: selectedEnrollment.id,
          notes: updateForm.notes
        })
      });

      if (response.ok) {
        setShowProgressModal(false);
        setSelectedEnrollment(null);
        await fetchEnrollments();
        onEnrollmentUpdate?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update enrollment');
      }
    } catch (error) {
      console.error('Error updating enrollment:', error);
      alert('Failed to update enrollment');
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to unenroll this student from the course?')) return;

    try {
      const response = await fetch(`/api/enrollments/${userId}?enrollment_id=${enrollmentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchEnrollments();
        onEnrollmentUpdate?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to unenroll');
      }
    } catch (error) {
      console.error('Error unenrolling:', error);
      alert('Failed to unenroll');
    }
  };

  // Removed complex status and grading functions - keeping it simple

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      {canEdit && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Academic Progress</h3>
          <Button onClick={() => setShowAssignModal(true)}>
            <AcademicCapIcon className="h-4 w-4 mr-2" />
            Assign Course
          </Button>
        </div>
      )}

      {/* Simple Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Enrollments</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <BookOpenIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-3xl font-bold">{stats.totalHours}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Enrolled Courses */}
      <div>
        <h4 className="font-semibold mb-4">Enrolled Courses</h4>
        {enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="overflow-hidden">
                <div className="p-6">
                  {/* Course Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h5 className="font-semibold text-lg">
                        {enrollment.course?.title || 'Unknown Course'}
                      </h5>
                      <p className="text-sm text-gray-500 mt-1">
                        {enrollment.course?.short_description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">
                          {enrollment.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {enrollment.course?.difficulty && (
                          <Badge variant="outline">
                            {enrollment.course.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setUpdateForm({
                              notes: enrollment.notes || ''
                            });
                            setShowProgressModal(true);
                          }}
                        >
                          Update
                        </Button>
                        <button
                          onClick={() => handleUnenroll(enrollment.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Simple Course Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Enrolled:</span>
                      <p className="font-medium">
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                    {enrollment.course?.duration_hours && (
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <p className="font-medium">{enrollment.course.duration_hours} hours</p>
                      </div>
                    )}
                    {enrollment.schedule && (
                      <div>
                        <span className="text-gray-500">Schedule:</span>
                        <p className="font-medium">{enrollment.schedule.name}</p>
                      </div>
                    )}
                    {enrollment.notes && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Notes:</span>
                        <p className="font-medium">{enrollment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="p-12 text-center">
              <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No courses enrolled yet</p>
              {canEdit && (
                <p className="text-sm text-gray-500 mt-2">
                  Click "Assign Course" to enroll this student
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Assign Course Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Assign Course to Student</h3>
            
            <div className="space-y-4">
              {/* Step 1: Select Course */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step 1: Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedScheduleId(''); // Reset schedule when course changes
                    setSelectedCourseSchedules([]); // Clear schedules from previous course
                  }}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a course...</option>
                  {availableCourses.length > 0 ? (
                    availableCourses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title} {course.difficulty ? `(${course.difficulty})` : ''}
                      </option>
                    ))
                  ) : (
                    <option disabled>No courses available or all courses already assigned</option>
                  )}
                </select>
              </div>

              {/* Step 2: Select Schedule Group */}
              {selectedCourseId && (() => {
                const selectedCourse = availableCourses.find(c => c.id === selectedCourseId);
                return selectedCourse ? (
                  <>
                    {/* Course Info */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <BookOpenIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-blue-900">{selectedCourse.title}</p>
                          <div className="mt-1 text-xs text-blue-700 space-y-0.5">
                            <p>Description: {selectedCourse.short_description || 'Not specified'}</p>
                            <p>Duration: {selectedCourse.duration_hours ? `${selectedCourse.duration_hours} hours` : 'Not specified'}</p>
                            <p>Difficulty: {selectedCourse.difficulty || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Group Selection */}
                    {loadingSchedules ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading schedules...</p>
                      </div>
                    ) : selectedCourseSchedules && selectedCourseSchedules.length > 0 ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Step 2: Select Schedule Group
                        </label>
                        <div className="space-y-2">
                          {selectedCourseSchedules.map((schedule: any) => {
                            // Simulate enrolled users count (in real app, fetch from DB)
                            const enrolledCount = Math.floor(Math.random() * 15) + 5;
                            const maxStudents = schedule.max_students || 30;
                            const isFull = enrolledCount >= maxStudents;
                            const isSelected = selectedScheduleId === schedule.id;
                            
                            return (
                              <div
                                key={schedule.id}
                                onClick={() => !isFull && schedule.is_active && setSelectedScheduleId(schedule.id)}
                                className={`
                                  p-4 rounded-lg border-2 cursor-pointer transition-all
                                  ${isSelected 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : isFull || !schedule.is_active
                                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                                  }
                                `}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="h-4 w-4 text-gray-600" />
                                      <p className="font-medium text-sm">{schedule.name}</p>
                                      {schedule.is_active ? (
                                        <Badge variant="success" className="text-xs">Active</Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                      )}
                                      {isFull && (
                                        <Badge variant="danger" className="text-xs">Full</Badge>
                                      )}
                                    </div>
                                    
                                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-gray-600">
                                      <div>
                                        {schedule.start_date && (
                                          <p>Start: {new Date(schedule.start_date).toLocaleDateString()}</p>
                                        )}
                                        {schedule.end_date && (
                                          <p>End: {new Date(schedule.end_date).toLocaleDateString()}</p>
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1">
                                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                          </svg>
                                          <span className={enrolledCount >= maxStudents ? 'text-red-600 font-medium' : ''}>
                                            {enrolledCount}/{maxStudents} students
                                          </span>
                                        </div>
                                        {enrolledCount > 0 && (
                                          <p className="mt-1 text-gray-500">
                                            {enrolledCount < 10 ? 'Small group' : enrolledCount < 20 ? 'Medium group' : 'Large group'}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Show some example enrolled students (in real app, fetch actual data) */}
                                    {isSelected && enrolledCount > 0 && (
                                      <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 mb-2">Currently enrolled students:</p>
                                        <div className="flex -space-x-2">
                                          {[...Array(Math.min(enrolledCount, 5))].map((_, i) => (
                                            <div
                                              key={i}
                                              className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                                              title={`Student ${i + 1}`}
                                            >
                                              <span className="text-[10px] text-gray-700">{String.fromCharCode(65 + i)}</span>
                                            </div>
                                          ))}
                                          {enrolledCount > 5 && (
                                            <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
                                              <span className="text-[10px] text-white">+{enrolledCount - 5}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Selection indicator */}
                                  <div className={`
                                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                                    ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}
                                  `}>
                                    {isSelected && (
                                      <CheckCircleIcon className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                          <p className="text-sm text-yellow-800">
                            No schedules available for this course. Please create a schedule first.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : null;
              })()}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedCourseId('');
                  setSelectedScheduleId('');
                  setSelectedCourseSchedules([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignCourse}
                disabled={!selectedCourseId || !selectedScheduleId}
              >
                Assign to Schedule
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Enrollment Modal */}
      {showProgressModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Update Enrollment: {selectedEnrollment.course?.title}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({...updateForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                  placeholder="Add any notes about this enrollment..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProgressModal(false);
                  setSelectedEnrollment(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateEnrollment}>
                Update Enrollment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}