'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { scheduleService } from '@/lib/supabase/schedules';
import { lessonService } from '@/lib/supabase/lessons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  ChevronRight,
  Plus,
  ExternalLink
} from 'lucide-react';

interface CourseLessonsWithSchedulesProps {
  courseId: string;
}

export function CourseLessonsWithSchedules({ courseId }: CourseLessonsWithSchedulesProps) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, [courseId]);

  useEffect(() => {
    if (selectedSchedule) {
      loadLessonsForSchedule(selectedSchedule);
    } else {
      setLessons([]);
    }
  }, [selectedSchedule]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const courseSchedules = await scheduleService.getSchedules({ course_id: courseId });
      setSchedules(courseSchedules);
      
      // Auto-select first schedule if available
      if (courseSchedules.length > 0) {
        setSelectedSchedule(courseSchedules[0].id);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLessonsForSchedule = async (scheduleId: string) => {
    setLessonsLoading(true);
    try {
      const scheduleLessons = await lessonService.getScheduleLessons(scheduleId);
      // Sort lessons by date and time
      scheduleLessons.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });
      setLessons(scheduleLessons);
    } catch (error) {
      console.error('Failed to load lessons:', error);
    } finally {
      setLessonsLoading(false);
    }
  };

  const formatTime = (time: string) => {
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return time;
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          No schedules yet
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Create a teaching schedule for this course to see lessons
        </p>
        <Button 
          className="mt-4" 
          size="sm"
          onClick={() => router.push(`/schedules/new?courseId=${courseId}`)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule Selector */}
      <div>
        <h3 className="text-lg font-medium mb-3">Select Schedule</h3>
        <div className="grid gap-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedSchedule === schedule.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedSchedule(schedule.id)}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={selectedSchedule === schedule.id}
                  onChange={() => setSelectedSchedule(schedule.id)}
                  className="text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h5 className="font-medium">{schedule.name}</h5>
                    <Badge variant={schedule.is_active ? 'success' : 'secondary'} size="sm">
                      {schedule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(schedule.start_date).toLocaleDateString()} - 
                        {schedule.end_date ? new Date(schedule.end_date).toLocaleDateString() : 'Ongoing'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(schedule.default_start_time)}</span>
                    </div>
                    
                    {schedule.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{schedule.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lessons Display */}
      {selectedSchedule && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Lessons from {schedules.find(s => s.id === selectedSchedule)?.name}
            </h3>
            {lessons.length > 0 && (
              <span className="text-sm text-gray-500">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {lessonsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No lessons found for this schedule</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/lessons/${lesson.id}`)}
                >
                  <Card.Content className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">
                            Lesson {lesson.lesson_number}: {lesson.topic}
                          </h4>
                          <Badge variant={getStatusColor(lesson.status)} size="sm">
                            {lesson.status}
                          </Badge>
                        </div>
                        
                        {lesson.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {lesson.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(lesson.date)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}</span>
                          </div>
                          
                          {lesson.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{lesson.location}</span>
                            </div>
                          )}
                          
                          {lesson.max_students && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>Max {lesson.max_students}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}