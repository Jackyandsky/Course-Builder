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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
}

export function BelongingSelector({
  selectedCourses,
  selectedLessons,
  onCoursesChange,
  onLessonsChange,
  disabled = false
}: BelongingSelectorProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [tempSelectedCourses, setTempSelectedCourses] = useState<string[]>([]);
  const [tempSelectedLessons, setTempSelectedLessons] = useState<string[]>([]);

  useEffect(() => {
    // Load data immediately when component mounts to display selected items
    loadData();
  }, []);

  useEffect(() => {
    if (showModal) {
      setTempSelectedCourses(selectedCourses);
      setTempSelectedLessons(selectedLessons);
    }
  }, [showModal, selectedCourses, selectedLessons]);

  const loadData = async () => {
    if (!user) {
      console.log('User not authenticated, skipping data load');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading courses and lessons for user:', user.id);
      
      const supabase = createClientComponentClient();
      
      const [coursesResult, lessonsResult, schedulesResult] = await Promise.all([
        courseService.getCourses({}),
        // Get up to 60 lessons for selection
        supabase
          .from('lessons')
          .select('*')
          .limit(60)
          .order('created_at', { ascending: false }),
        // Also check schedules table structure
        supabase
          .from('schedules')
          .select('*')
          .limit(3)
      ]);
      
      console.log('Courses loaded:', coursesResult.length);
      console.log('Lessons query result:', lessonsResult);
      
      // Debug: Check courses structure too
      if (coursesResult && coursesResult.length > 0) {
        console.log('Sample course structure:', coursesResult[0]);
      }
      
      if (lessonsResult.error) {
        console.error('Lessons query error:', lessonsResult.error);
        throw lessonsResult.error;
      }
      
      if (schedulesResult.error) {
        console.error('Schedules query error:', schedulesResult.error);
      } else if (schedulesResult.data && schedulesResult.data.length > 0) {
        console.log('Sample schedule structure:', schedulesResult.data[0]);
        console.log('Schedule fields:', Object.keys(schedulesResult.data[0]));
      }
      
      setCourses(coursesResult || []);
      setLessons(lessonsResult.data || []);
      
      // Debug: Log the actual structure of lessons to see available fields
      if (lessonsResult.data && lessonsResult.data.length > 0) {
        console.log('Actual lesson structure:', lessonsResult.data[0]);
        console.log('All lesson fields:', Object.keys(lessonsResult.data[0]));
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

  const filteredLessons = lessons.filter(lesson => {
    const title = lesson.topic || lesson.title || `Lesson ${lesson.lesson_number}`;
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If no courses are selected, show all lessons
    if (tempSelectedCourses.length === 0) {
      return matchesSearch;
    }
    
    // Get course ID from lesson directly or from schedule relationship
    const lessonCourseId = lesson.course_id || lesson.schedule?.course_id || lesson.schedule?.course?.id;
    
    // If courses are selected, only show lessons that belong to those courses
    const shouldInclude = matchesSearch && lessonCourseId && tempSelectedCourses.includes(lessonCourseId);
    
    // Debug logging
    if (tempSelectedCourses.length > 0) {
      console.log('Filtering lesson:', {
        lessonTitle: title,
        lessonCourseId,
        directCourseId: lesson.course_id,
        scheduleCourseId: lesson.schedule?.course_id || lesson.schedule?.course?.id,
        tempSelectedCourses,
        matchesSearch,
        shouldInclude
      });
    }
    
    return shouldInclude;
  });

  const selectedCoursesData = courses.filter(c => selectedCourses.includes(c.id));
  const selectedLessonsData = lessons.filter(l => selectedLessons.includes(l.id));
  const totalSelected = selectedCourses.length + selectedLessons.length;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalSelected} item{totalSelected !== 1 ? 's' : ''} selected 
            ({selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''}, {selectedLessons.length} lesson{selectedLessons.length !== 1 ? 's' : ''})
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowModal(true)}
            disabled={disabled}
          >
            Select Courses & Lessons
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
                  Lessons ({selectedLessonsData.length})
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
        title="Select Courses and Lessons"
        size="lg"
      >
        <div className="space-y-4">
          {/* Search */}
          <SearchBox
            placeholder="Search courses and lessons..."
            onSearch={setSearchTerm}
            defaultValue={searchTerm}
          />

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-6">
              {/* Courses Section */}
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

              {/* Lessons Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Lessons ({filteredLessons.length})
                  {tempSelectedCourses.length > 0 && (
                    <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      Filtered by selected courses
                    </span>
                  )}
                </h3>
                {filteredLessons.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">
                    {searchTerm ? 'No lessons found matching your search.' : 'No lessons available.'}
                  </p>
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
                              onChange={() => handleLessonToggle(lesson.id)}
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
                                    {lesson.schedule.name}
                                  </Badge>
                                )}
                                {lesson.course_id && (
                                  <Badge variant="outline" className="text-xs">
                                    Course: {courses.find(c => c.id === lesson.course_id)?.title || 'Unknown'}
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
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center border-t pt-4">
            <p className="text-sm text-gray-600">
              {tempSelectedCourses.length + tempSelectedLessons.length} item{tempSelectedCourses.length + tempSelectedLessons.length !== 1 ? 's' : ''} selected
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