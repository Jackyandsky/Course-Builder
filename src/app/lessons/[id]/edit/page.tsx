'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { LessonForm } from '@/components/schedules/LessonForm';
import { LessonBookManager } from '@/components/relationships/LessonBookManager';
import { LessonTaskManager } from '@/components/relationships/LessonTaskManager';
import { lessonService } from '@/lib/supabase/lessons';
import { ArrowLeft, Edit, BookOpen, CheckSquare } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

import type { Lesson } from '@/types/schedule';

export default function LessonEditPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const lessonData = await lessonService.getLesson(lessonId);
      console.log('Loaded lesson data:', lessonData); // Debug log
      setLesson(lessonData);
    } catch (error) {
      console.error('Failed to load lesson:', error);
      alert('Failed to load lesson');
      router.push('/lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    loadLesson(); // Reload lesson data after update
  };

  const handleBack = () => {
    // Use browser history to go back if possible
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback - go to lessons page
      router.push('/lessons');
    }
  };

  const handleRelationshipUpdate = () => {
    loadLesson(); // Reload lesson data when relationships change
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!lesson) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold">Lesson not found</h2>
            <Button 
              className="mt-4"
              onClick={() => router.push('/lessons')}
            >
              Back to Lessons
            </Button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: Edit },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  ];


  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="outline"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Edit Lesson {lesson.lesson_number}: {lesson.title}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Update lesson details, books, and tasks
            </p>
            {lesson.schedule?.course && (
              <p className="mt-1 text-sm text-blue-600">
                Course: {lesson.schedule.course.title} • Schedule: {lesson.schedule.name}
              </p>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="details">
              <Card>
                <Card.Content className="p-6">
                  <LessonForm 
                    lesson={lesson} 
                    onSuccess={handleSuccess}
                    scheduleId={lesson.schedule_id}
                  />
                </Card.Content>
              </Card>
            </TabsContent>

            <TabsContent value="books">
              <Card>
                <Card.Content className="p-6">
                  <LessonBookManager 
                    lessonId={lessonId}
                    courseId={lesson.course_id}
                    onUpdate={handleRelationshipUpdate}
                  />
                </Card.Content>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <Card.Content className="p-6">
                  <LessonTaskManager 
                    lessonId={lessonId}
                    courseId={lesson.course_id}
                    onUpdate={handleRelationshipUpdate}
                  />
                </Card.Content>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}