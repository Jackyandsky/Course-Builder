'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Search, Calendar, Users } from 'lucide-react';
import { Lesson, LessonStatus } from '@/types/database';
import { lessonService, LessonFilters } from '@/lib/supabase/lessons';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, Badge, Input, Select, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

const statusColors: Record<LessonStatus, string> = {
  draft: 'default',
  scheduled: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export default function LessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    loadLessons();
  }, [searchQuery, selectedStatus]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const filters: LessonFilters = {};
      if (selectedStatus) filters.status = selectedStatus as LessonStatus;

      const data = await lessonService.getLessons(filters);
      
      // Filter by search query locally since the service might not support it
      const filteredLessons = searchQuery
        ? data.filter(lesson => 
            lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lesson.description && lesson.description.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : data;
      
      setLessons(filteredLessons);
    } catch (error) {
      console.error('Failed to load lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <DashboardLayout>
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Lessons
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                View and manage all lessons across courses and schedules
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <Card.Content className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search lessons..."
                    className="pl-10"
                  />
                </div>
                
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'scheduled', label: 'Scheduled' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' }
                  ]}
                  placeholder="Status"
                />
              </div>
            </Card.Content>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <Card.Content className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{lessons.length}</p>
                    <p className="text-sm text-gray-600">Total Lessons</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
            
            <Card>
              <Card.Content className="p-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">
                      {lessons.filter(lesson => lesson.status === 'scheduled').length}
                    </p>
                    <p className="text-sm text-gray-600">Scheduled</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
            
            <Card>
              <Card.Content className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">
                      {lessons.filter(lesson => lesson.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
            
            <Card>
              <Card.Content className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">
                      {lessons.filter(lesson => lesson.status === 'draft').length}
                    </p>
                    <p className="text-sm text-gray-600">Drafts</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Lessons List */}
          {lessons.length === 0 ? (
            <Card>
              <Card.Content className="p-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No lessons found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Lessons are created from schedules. Create a schedule first to generate lessons.
                </p>
                <Button
                  onClick={() => router.push('/schedules')}
                >
                  Go to Schedules
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                  <Card.Content className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {lesson.title}
                          </h3>
                          <Badge variant={statusColors[lesson.status]} size="sm">
                            {lesson.status}
                          </Badge>
                        </div>
                        
                        {lesson.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {lesson.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(lesson.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{lesson.start_time} - {lesson.end_time}</span>
                          </div>
                          {lesson.location && (
                            <div className="flex items-center gap-1">
                              <span>{lesson.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/lessons/${lesson.id}`)}
                        >
                          View
                        </Button>
                        {lesson.schedule && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/schedules/${lesson.schedule_id}`)}
                          >
                            Schedule
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}