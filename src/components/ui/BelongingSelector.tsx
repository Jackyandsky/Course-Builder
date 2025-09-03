'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, GraduationCap } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { Input } from './Input';
import { SearchBox } from './SearchBox';
import { Badge } from './Badge';
import { Spinner } from './Spinner';
import { courseService } from '@/lib/supabase/courses';
import { lessonService } from '@/lib/supabase/lessons';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';

export interface BelongingItem {
  id: string;
  title: string;
  type: 'course' | 'lesson';
  metadata?: any;
}

interface BelongingSelectorProps {
  selectedCourses: string[];
  selectedLessons: string[];
  onCoursesChange: (courseIds: string[]) => void;
  onLessonsChange: (lessonIds: string[]) => void;
  disabled?: boolean;
  buttonLabel?: string;
  mode?: 'courses-only' | 'both' | 'sessions-only';
  filterCourses?: string[]; // Courses to filter sessions by (for sessions-only mode)
  showAllSessionsIfNoMatch?: boolean; // Show all sessions if no courses match (for sessions-only mode)
}

export function BelongingSelector({
  selectedCourses,
  selectedLessons,
  onCoursesChange,
  onLessonsChange,
  disabled = false,
  buttonLabel = 'Select Courses & Sessions',
  mode = 'both',
  filterCourses = [],
  showAllSessionsIfNoMatch = true
}: BelongingSelectorProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [tempSelectedCourses, setTempSelectedCourses] = useState<string[]>([]);
  const [tempSelectedLessons, setTempSelectedLessons] = useState<string[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  useEffect(() => {
    // Load data immediately when component mounts to display selected items
    loadData();
  }, []);
  
  // Also load data when selected items change to ensure we can display them
  useEffect(() => {
    console.log('BelongingSelector: Selected items changed', {
      selectedLessons,
      selectedCourses,
      hasLoadedData,
      mode
    });
    if ((selectedLessons.length > 0 || selectedCourses.length > 0) && !hasLoadedData) {
      console.log('BelongingSelector: Loading data due to selected items');
      loadData();
    }
  }, [selectedLessons, selectedCourses, hasLoadedData]);

  useEffect(() => {
    if (showModal) {
      setTempSelectedCourses(selectedCourses);
      setTempSelectedLessons(selectedLessons);
      // Load data when modal opens if not already loaded
      if (!hasLoadedData) {
        loadData();
      }
    }
  }, [showModal, selectedCourses, selectedLessons, hasLoadedData]);

  const loadData = async () => {
    if (!user) {
      console.log('User not authenticated, skipping data load');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading courses and lessons for user:', user.id);
      
      const supabase = createSupabaseClient();
      
      const [coursesResult, lessonsResult, schedulesResult] = await Promise.all([
        courseService.getCourses({}),
        // Get ALL lessons for selection with schedule relationship (remove limit for now)
        supabase
          .from('lessons')
          .select(`
            *,
            schedule:schedule_id (
              id,
              name,
              course_id
            )
          `)
          .order('created_at', { ascending: false }),
        // Fetch all schedules to understand course-schedule relationships
        supabase
          .from('schedules')
          .select('*')
          .order('created_at', { ascending: false })
      ]);
      
      console.log('Data loading results:', {
        courses: coursesResult?.length || 0,
        lessons: lessonsResult.data?.length || 0,
        schedules: schedulesResult.data?.length || 0,
        lessonsError: lessonsResult.error,
        schedulesError: schedulesResult.error
      });
      
      if (lessonsResult.error) {
        console.error('Lessons query error:', lessonsResult.error);
        throw lessonsResult.error;
      }
      
      if (schedulesResult.error) {
        console.error('Schedules query error:', schedulesResult.error);
      }
      
      setCourses(coursesResult || []);
      setLessons(lessonsResult.data || []);
      setSchedules(schedulesResult.data || []);
      setHasLoadedData(true);
      
      // Debug: Log sample data to understand relationships
      if (lessonsResult.data && lessonsResult.data.length > 0) {
        const sampleLesson = lessonsResult.data[0];
        console.log('Sample lesson:', {
          id: sampleLesson.id,
          schedule_id: sampleLesson.schedule_id,
          schedule: sampleLesson.schedule,
          course_id: sampleLesson.course_id
        });
      }
      
      if (schedulesResult.data && schedulesResult.data.length > 0) {
        const sampleSchedule = schedulesResult.data[0];
        console.log('Sample schedule:', {
          id: sampleSchedule.id,
          course_id: sampleSchedule.course_id,
          name: sampleSchedule.name
        });
      }
      
    } catch (error) {
      console.error('Failed to load courses and lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseToggle = (courseId: string) => {
    const newSelection = tempSelectedCourses.includes(courseId)
      ? tempSelectedCourses.filter(id => id !== courseId)
      : [...tempSelectedCourses, courseId];
    
    console.log('Course selection changed:', {
      courseId,
      newSelection,
      availableLessons: lessons.length,
      lessonsWithDirectCourseId: lessons.filter(l => l.course_id).length,
      lessonsWithScheduleCourseId: lessons.filter(l => l.schedule?.course_id || l.schedule?.course?.id).length
    });
    
    setTempSelectedCourses(newSelection);
  };

  const handleLessonToggle = (lessonId: string) => {
    setTempSelectedLessons(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const handleSave = () => {
    console.log('Saving selections:', {
      courses: tempSelectedCourses,
      lessons: tempSelectedLessons,
      mode
    });
    onCoursesChange(tempSelectedCourses);
    onLessonsChange(tempSelectedLessons);
    setShowModal(false);
  };

  const handleCancel = () => {
    setTempSelectedCourses(selectedCourses);
    setTempSelectedLessons(selectedLessons);
    setShowModal(false);
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // First, get all lessons that match the search
  const searchFilteredLessons = lessons.filter(lesson => {
    const title = lesson.topic || lesson.title || `Lesson ${lesson.lesson_number}`;
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Then apply course filtering
  const filteredLessons = (() => {
    // For sessions-only mode, use filterCourses prop
    const coursesToFilter = mode === 'sessions-only' ? filterCourses : tempSelectedCourses;
    
    // If no courses are selected/filtered, show all lessons that match search
    if (coursesToFilter.length === 0) {
      return searchFilteredLessons;
    }
    
    // First, find all schedules that belong to the selected courses
    const relevantScheduleIds = schedules
      .filter(schedule => coursesToFilter.includes(schedule.course_id))
      .map(schedule => schedule.id);
    
    console.log('Filtering sessions:', {
      selectedCourses: coursesToFilter,
      relevantSchedules: relevantScheduleIds,
      totalSchedules: schedules.length
    });
    
    // Filter by course relationship (either direct or through schedule)
    const courseFilteredLessons = searchFilteredLessons.filter(lesson => {
      // Check direct course relationship
      if (lesson.course_id && coursesToFilter.includes(lesson.course_id)) {
        return true;
      }
      
      // Check schedule relationship (most common)
      if (lesson.schedule_id && relevantScheduleIds.includes(lesson.schedule_id)) {
        return true;
      }
      
      // Check schedule object relationship (if populated)
      if (lesson.schedule?.course_id && coursesToFilter.includes(lesson.schedule.course_id)) {
        return true;
      }
      
      return false;
    });
    
    // If in sessions-only mode and no matches found but showAllSessionsIfNoMatch is true, 
    // show all sessions anyway
    if (mode === 'sessions-only' && courseFilteredLessons.length === 0 && showAllSessionsIfNoMatch) {
      console.log('No sessions match selected courses, showing all sessions');
      return searchFilteredLessons;
    }
    
    return courseFilteredLessons;
  })();

  const selectedCoursesData = courses.filter(c => selectedCourses.includes(c.id));
  const selectedLessonsData = lessons.filter(l => selectedLessons.includes(l.id));
  
  // Debug logging for sessions display issue
  if (mode === 'sessions-only' && selectedLessons.length > 0) {
    console.log('BelongingSelector Display Debug:', {
      mode,
      selectedLessons,
      loadedLessons: lessons.length,
      selectedLessonsData: selectedLessonsData.length,
      hasLoadedData,
      firstFewLessonIds: lessons.slice(0, 3).map(l => l.id),
      lookingFor: selectedLessons
    });
  }
  
  const totalSelected = selectedCourses.length + selectedLessons.length;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalSelected} item{totalSelected !== 1 ? 's' : ''} selected
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowModal(true)}
            disabled={disabled}
          >
            {buttonLabel}
          </Button>
        </div>

        {totalSelected > 0 && (
          <div className="space-y-3">
            {/* Selected Courses */}
            {selectedCoursesData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Courses ({selectedCoursesData.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedCoursesData.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <GraduationCap className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm line-clamp-1" title={course.title}>
                          {course.title}
                        </h5>
                        {course.short_description && (
                          <p className="text-xs text-gray-600 line-clamp-1" title={course.short_description}>
                            {course.short_description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Lessons */}
            {selectedLessonsData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sessions ({selectedLessonsData.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedLessonsData.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <BookOpen className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm line-clamp-1">
                          {lesson.topic || lesson.title || `Lesson ${lesson.lesson_number}`}
                        </h5>
                        {lesson.schedule && (
                          <p className="text-xs text-gray-600 line-clamp-1">
                            Schedule: {lesson.schedule.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCancel}
        title={mode === 'courses-only' ? 'Select Courses' : mode === 'sessions-only' ? 'Select Sessions' : 'Select Courses and Sessions'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Search */}
          <SearchBox
            placeholder={mode === 'courses-only' ? 'Search courses...' : mode === 'sessions-only' ? 'Search sessions...' : 'Search courses and sessions...'}
            onSearch={setSearchTerm}
            defaultValue={searchTerm}
          />

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-6">
              {/* Courses Section - Hide for 'sessions-only' mode */}
              {mode !== 'sessions-only' && (
                <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Courses ({filteredCourses.length})
                </h3>
                {filteredCourses.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">
                    {searchTerm ? 'No courses found matching your search.' : 'No courses available.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredCourses.map((course) => (
                      <div
                        key={course.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          tempSelectedCourses.includes(course.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleCourseToggle(course.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={tempSelectedCourses.includes(course.id)}
                              onChange={() => handleCourseToggle(course.id)}
                              className="mt-1 rounded"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{course.title}</h4>
                              {course.short_description && (
                                <p className="text-sm text-gray-600 mt-1">{course.short_description}</p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {course.difficulty || 'beginner'}
                                </Badge>
                                {course.status && (
                                  <Badge variant={course.status === 'published' ? 'success' : 'warning'} className="text-xs">
                                    {course.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              )}

              {/* Sessions Section - Show for 'both' and 'sessions-only' modes */}
              {(mode === 'both' || mode === 'sessions-only') && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Sessions ({filteredLessons.length})
                    {(() => {
                      const coursesToFilter = mode === 'sessions-only' ? filterCourses : tempSelectedCourses;
                      if (coursesToFilter.length > 0) {
                        // Check if we're showing all sessions because no matches were found
                        const hasMatchingCourses = searchFilteredLessons.some(lesson => {
                          const lessonCourseId = lesson.course_id || lesson.schedule?.course_id || lesson.schedule?.course?.id;
                          return lessonCourseId && coursesToFilter.includes(lessonCourseId);
                        });
                        
                        if (!hasMatchingCourses && mode === 'sessions-only' && showAllSessionsIfNoMatch) {
                          return (
                            <span className="ml-2 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                              Showing all sessions (no matches for selected courses)
                            </span>
                          );
                        }
                        
                        return (
                          <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            Filtered by selected courses
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </h3>
                {filteredLessons.length === 0 ? (
                  <div className="text-sm text-gray-500 py-4">
                    {searchTerm ? (
                      <p>No sessions found matching your search.</p>
                    ) : (mode === 'sessions-only' ? filterCourses : tempSelectedCourses).length > 0 ? (
                      <div className="space-y-2">
                        <p className="font-medium">No sessions found for the selected course{(mode === 'sessions-only' ? filterCourses : tempSelectedCourses).length > 1 ? 's' : ''}.</p>
                        <p className="text-xs">Possible reasons:</p>
                        <ul className="text-xs ml-4 list-disc space-y-1">
                          <li>The selected course{(mode === 'sessions-only' ? filterCourses : tempSelectedCourses).length > 1 ? 's don\'t' : ' doesn\'t'} have any sessions assigned yet</li>
                          <li>Sessions may be linked through schedules instead of directly to courses</li>
                          <li>The course-session relationships need to be established</li>
                        </ul>
                        {mode === 'sessions-only' && (
                          <p className="text-xs mt-2 font-medium">
                            Try selecting different courses or check if sessions exist for these courses.
                          </p>
                        )}
                      </div>
                    ) : mode === 'sessions-only' ? (
                      <p>No courses selected. Please select courses first to see their associated sessions.</p>
                    ) : (
                      <p>No sessions available. Sessions will appear here once courses are selected.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          tempSelectedLessons.includes(lesson.id)
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleLessonToggle(lesson.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={tempSelectedLessons.includes(lesson.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleLessonToggle(lesson.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 rounded"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">
                                {lesson.topic || lesson.title || `Lesson ${lesson.lesson_number}`}
                              </h4>
                              {lesson.description && (
                                <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                {lesson.date && (
                                  <Badge variant="secondary" className="text-xs">
                                    {new Date(lesson.date).toLocaleDateString()}
                                  </Badge>
                                )}
                                {lesson.schedule && (
                                  <Badge variant="info" className="text-xs">
                                    Schedule: {lesson.schedule.name}
                                  </Badge>
                                )}
                                {(() => {
                                  // Show which course this lesson belongs to
                                  const courseId = lesson.course_id || lesson.schedule?.course_id;
                                  const course = courseId ? courses.find(c => c.id === courseId) : null;
                                  if (course) {
                                    return (
                                      <Badge variant="outline" className="text-xs">
                                        Course: {course.title}
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center border-t pt-4">
            <p className="text-sm text-gray-600">
              {mode === 'courses-only' 
                ? `${tempSelectedCourses.length} course${tempSelectedCourses.length !== 1 ? 's' : ''} selected`
                : mode === 'sessions-only'
                ? `${tempSelectedLessons.length} session${tempSelectedLessons.length !== 1 ? 's' : ''} selected`
                : `${tempSelectedCourses.length + tempSelectedLessons.length} item${tempSelectedCourses.length + tempSelectedLessons.length !== 1 ? 's' : ''} selected`
              }
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Selection
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}