'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, Clock, Calendar, MapPin, ChevronRight,
  CheckCircle, Circle, FileText, BookMarked, Type,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  thumbnail_url?: string;
  duration_hours: number;
  difficulty: string;
  category?: { name: string };
}

interface Enrollment {
  id: string;
  course_id: string;
  schedule_id: string;
  status: string;
  enrolled_at: string;
  schedule?: Schedule;
}

interface Schedule {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  is_active: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  lesson_number: number;
  date?: string;
  start_time?: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  content?: string;
  tasks_count?: number;
  books_count?: number;
  vocabulary_count?: number;
  is_taken?: boolean;
}

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/courses/${courseId}/enrollment`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Error fetching course details:', data.error);
        if (response.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = '/login';
        }
        return;
      }

      console.log('Course details fetched:', {
        course: data.course?.title,
        hasEnrollment: !!data.enrollment,
        schedule: data.enrollment?.schedule?.name,
        lessonsCount: data.lessons?.length
      });

      setCourse(data.course);
      setEnrollment(data.enrollment);
      setLessons(data.lessons || []);
      
      // Calculate completed lessons count
      const completed = (data.lessons || []).filter((lesson: Lesson) => lesson.is_taken).length;
      setCompletedLessonsCount(completed);

    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Course not found</h2>
          <Link href="/account/courses">
            <Button className="mt-4">Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const schedule = enrollment?.schedule;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <Link href="/account/courses" className="p-2 hover:bg-gray-100 rounded-md transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">{course.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {course.category?.name} • {course.duration_hours} hours • {course.difficulty}
          </p>
        </div>
      </div>

      {/* Course Description */}
      {course.description && (
        <Card className="p-6">
          {/* Check if description contains HTML tags */}
          {course.description.includes('<') && course.description.includes('>') ? (
            <div 
              className="rich-text-content text-gray-700"
              dangerouslySetInnerHTML={{ __html: course.description }}
            />
          ) : (
            // If plain text, display in a styled paragraph
            <div className="rich-text-content">
              <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
            </div>
          )}
        </Card>
      )}

      {/* Schedule Info */}
      {schedule && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">
                  Schedule: {schedule.name}
                </h3>
                {schedule.description && (
                  <p className="text-sm text-gray-500 mb-2">{schedule.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(schedule.start_date)} - {formatDate(schedule.end_date)}
                  </span>
                  {schedule.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {schedule.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Enrolled {formatDate(enrollment.enrolled_at)}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Course Progress</span>
                <span className="font-medium text-gray-900">
                  {completedLessonsCount}/{lessons.length} sessions completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${lessons.length > 0 ? (completedLessonsCount / lessons.length) * 100 : 0}%` 
                  }}
                />
              </div>
              {completedLessonsCount === lessons.length && lessons.length > 0 && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Course completed!
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Sessions List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
          <p className="text-sm text-gray-500">
            {lessons.length} session{lessons.length !== 1 ? 's' : ''}
          </p>
        </div>

        {lessons.length > 0 ? (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <Link key={lesson.id} href={`/account/courses/${courseId}/lessons/${lesson.id}`}>
                <Card className="p-0 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Lesson Header */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                            {lesson.lesson_number}
                          </span>
                          <h3 className="font-medium text-gray-900 flex-1">{lesson.title}</h3>
                          {lesson.is_taken ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </div>

                        {/* Lesson Info */}
                        <div className="ml-11 space-y-2">
                          {lesson.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{lesson.description}</p>
                          )}
                          
                          {/* Lesson Stats */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {lesson.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(lesson.date)}
                              </span>
                            )}
                            {lesson.duration_minutes > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.duration_minutes} min
                              </span>
                            )}
                          </div>

                          {/* Lesson Resources */}
                          <div className="flex items-center gap-4 text-sm">
                            {lesson.tasks_count && lesson.tasks_count > 0 && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <FileText className="h-3.5 w-3.5" />
                                {lesson.tasks_count} task{lesson.tasks_count > 1 ? 's' : ''}
                              </span>
                            )}
                            {lesson.books_count && lesson.books_count > 0 && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <BookMarked className="h-3.5 w-3.5" />
                                {lesson.books_count} book{lesson.books_count > 1 ? 's' : ''}
                              </span>
                            )}
                            {lesson.vocabulary_count && lesson.vocabulary_count > 0 && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <Type className="h-3.5 w-3.5" />
                                {lesson.vocabulary_count} word{lesson.vocabulary_count > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="ml-4 flex items-center">
                        <div className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1">
                          {lesson.is_taken ? 'Review' : 'Start'}
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center">
              <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No sessions available</p>
              <p className="text-xs text-gray-500 mt-1">
                {schedule ? 'Sessions will be added to this schedule soon' : 'No schedule assigned to your enrollment'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}