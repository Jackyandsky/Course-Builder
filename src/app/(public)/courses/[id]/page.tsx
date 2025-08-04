'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Book, Target, Clock, Calendar, Globe, 
  CheckCircle, Users, Settings, ArrowLeft,
  Award, Share2, Heart, ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { Course } from '@/types/database';
import { courseService } from '@/lib/supabase/courses';
import { Badge, Card, Spinner, RichTextDisplay } from '@/components/ui';

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  expert: 'bg-red-100 text-red-800',
} as const;

const difficultyLabels = {
  beginner: 'Level 1',
  intermediate: 'Level 2',
  advanced: 'Level 3',
  expert: 'Level 4',
} as const;

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseService.getCourse(courseId);
      
      // Only show published courses
      if (data.status !== 'published') {
        setError('Course not available');
        return;
      }
      
      setCourse(data);
    } catch (error) {
      console.error('Failed to load course:', error);
      setError('Course not found or unavailable');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId, loadCourse]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: course?.title,
        text: course?.description,
        url: window.location.href,
      });
    }
  };

  const handleEnroll = () => {
    // This would typically handle enrollment logic
    router.push(`/courses/${courseId}/enroll`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The course you are looking for does not exist.'}</p>
          <Link href="/courses">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Browse All Courses
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const getWeeksFromSchedules = () => {
    if (!course.schedules || course.schedules.length === 0) return null;
    let maxWeeks = 0;
    course.schedules.forEach(schedule => {
      if (schedule.start_date && schedule.end_date) {
        const start = new Date(schedule.start_date);
        const end = new Date(schedule.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        maxWeeks = Math.max(maxWeeks, diffWeeks);
      }
    });
    return maxWeeks > 0 ? maxWeeks : null;
  };

  const getTotalDuration = () => {
    if (course.duration_hours) return `${course.duration_hours} hours`;
    const weeks = getWeeksFromSchedules();
    if (weeks) return `${weeks} weeks`;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <Link 
            href="/courses"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>

          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Book className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge 
                      className={`${difficultyColors[course.difficulty]} border-0`}
                    >
                      {difficultyLabels[course.difficulty]}
                    </Badge>
                    {course.category && (
                      <span className="text-sm text-gray-600">
                        {course.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Instructor and Meta Info */}
              <div className="flex items-center gap-6 mt-4 text-sm">
                {course.instructor_name && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">by {course.instructor_name}</span>
                  </div>
                )}
                {getTotalDuration() && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{getTotalDuration()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-gray-900">4.8</span>
                  <span className="text-gray-600">(234 students)</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleEnroll}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <span>Enroll Now</span>
                <ShoppingCart className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Course Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-600" />
            Course Overview
          </h2>
          <Card className="bg-white shadow-sm">
            <Card.Content className="p-6">
              {course.description ? (
                <RichTextDisplay 
                  content={course.description} 
                  size="md"
                  className="max-w-none"
                />
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}
            </Card.Content>
          </Card>
        </section>

        {/* Literary Explorations / Books */}
        {course.course_books && course.course_books.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Book className="h-6 w-6 text-green-600" />
              Literary Explorations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.course_books
                .sort((a, b) => a.position - b.position)
                .map((courseBook) => (
                  <Card key={courseBook.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                    <Card.Content className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <Book className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                            {courseBook.book?.title}
                          </h3>
                          {courseBook.book?.author && (
                            <p className="text-xs text-gray-600 mt-1">
                              by {courseBook.book.author}
                            </p>
                          )}
                          {courseBook.is_required && (
                            <Badge size="sm" variant="outline" className="mt-2">
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* Educational Objectives */}
        {course.course_objectives && course.course_objectives.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-6 w-6 text-purple-600" />
              Educational Objectives
            </h2>
            <Card className="bg-white shadow-sm">
              <Card.Content className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.course_objectives
                    .sort((a, b) => a.position - b.position)
                    .map((courseObjective, index) => (
                      <div key={courseObjective.id} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-purple-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {courseObjective.objective?.title}
                          </h3>
                          {courseObjective.objective?.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {courseObjective.objective.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {courseObjective.objective?.bloom_level && (
                              <Badge variant="outline" size="sm">
                                {courseObjective.objective.bloom_level}
                              </Badge>
                            )}
                            {courseObjective.objective?.measurable && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card.Content>
            </Card>
          </section>
        )}

        {/* Educational Methods */}
        {course.course_methods && course.course_methods.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-6 w-6 text-orange-600" />
              Educational Methods
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.course_methods
                .sort((a, b) => a.position - b.position)
                .map((courseMethod) => (
                  <Card key={courseMethod.id} className="bg-white shadow-sm">
                    <Card.Content className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Settings className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {courseMethod.method?.name}
                          </h3>
                          {courseMethod.method?.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-3">
                              {courseMethod.method.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* Curriculum Structure */}
        {course.schedules && course.schedules.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Curriculum Structure
            </h2>
            <Card className="bg-white shadow-sm">
              <Card.Content className="p-6">
                {/* Schedule Statistics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{course.schedules.length}</div>
                    <div className="text-sm text-blue-700">Total Schedules</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {course.schedules.filter(s => s.is_active).length}
                    </div>
                    <div className="text-sm text-green-700">Active</div>
                  </div>
                  
                  {getTotalDuration() && (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {getTotalDuration()?.split(' ')[0]}
                      </div>
                      <div className="text-sm text-purple-700">{getTotalDuration()?.split(' ')[1]}</div>
                    </div>
                  )}
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {(() => {
                        const avgDuration = course.schedules.reduce((sum, s) => sum + (s.default_duration_minutes || 0), 0) / course.schedules.length;
                        return Math.round(avgDuration) || 0;
                      })()}
                    </div>
                    <div className="text-sm text-orange-700">Avg Session (min)</div>
                  </div>
                </div>

                {/* Individual Schedule Cards */}
                <div className="space-y-4">
                  {course.schedules.map((schedule) => {
                    const scheduleWeeks = schedule.start_date && schedule.end_date 
                      ? Math.ceil(Math.abs(new Date(schedule.end_date).getTime() - new Date(schedule.start_date).getTime()) / (1000 * 60 * 60 * 24 * 7))
                      : null;
                    
                    const formatRecurrencePattern = () => {
                      if (!schedule.recurrence_days || schedule.recurrence_days.length === 0) {
                        return schedule.recurrence_type === 'none' ? 'One-time' : schedule.recurrence_type;
                      }
                      
                      const dayMap: Record<string, string> = {
                        monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', 
                        thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
                      };
                      
                      const days = schedule.recurrence_days.map(day => dayMap[day] || day).join(', ');
                      const type = schedule.recurrence_type.charAt(0).toUpperCase() + schedule.recurrence_type.slice(1);
                      return `[${days}] ${type}`;
                    };
                    
                    return (
                      <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-semibold text-gray-900">{schedule.name}</h5>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                schedule.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {schedule.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            
                            {schedule.description && (
                              <p className="text-sm text-gray-600 mb-3">{schedule.description}</p>
                            )}
                            
                            {/* Visual Recurrence Pattern */}
                            <div className="mb-3">
                              <div className="text-sm font-medium text-gray-700 mb-2">Schedule Pattern</div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full">
                                  <Calendar className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-700">
                                    {formatRecurrencePattern()}
                                  </span>
                                </div>
                                {schedule.default_duration_minutes && (
                                  <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 rounded-full">
                                    <Clock className="h-3 w-3 text-purple-600" />
                                    <span className="text-xs font-medium text-purple-700">
                                      {schedule.default_duration_minutes}min
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Schedule Timeline */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {schedule.start_date && (
                                <div>
                                  <span className="text-gray-500">Start:</span>
                                  <div className="font-medium text-gray-900">
                                    {new Date(schedule.start_date).toLocaleDateString('en-US', { 
                                      month: 'short', day: 'numeric', year: 'numeric' 
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {schedule.end_date && (
                                <div>
                                  <span className="text-gray-500">End:</span>
                                  <div className="font-medium text-gray-900">
                                    {new Date(schedule.end_date).toLocaleDateString('en-US', { 
                                      month: 'short', day: 'numeric', year: 'numeric' 
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {scheduleWeeks && (
                                <div>
                                  <span className="text-gray-500">Duration:</span>
                                  <div className="font-medium text-gray-900">{scheduleWeeks} weeks</div>
                                </div>
                              )}
                            </div>
                            
                            {schedule.location && (
                              <div className="mt-2 text-sm">
                                <span className="text-gray-500">Location:</span>
                                <span className="ml-1 text-gray-900">{schedule.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Prerequisites</h4>
                    <ul className="space-y-2">
                      {course.prerequisites.map((prerequisite, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{prerequisite}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card.Content>
            </Card>
          </section>
        )}

        {/* Call to Action */}
        <section className="bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Begin Your Learning Journey?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join hundreds of students who have already transformed their literary skills through our comprehensive courses.
          </p>
          <button
            onClick={handleEnroll}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Enroll Now
          </button>
          <p className="text-sm text-gray-500 mt-4">30-day money-back guarantee</p>
        </section>
      </div>
    </div>
  );
}