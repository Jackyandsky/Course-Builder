'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { LessonForm } from '@/components/schedules/LessonForm';
import { lessonService } from '@/lib/supabase/lessons';
import { ArrowLeft } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

import type { Lesson } from '@/types/schedule';

export default function LessonEditPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const lessonData = await lessonService.getLesson(lessonId);
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
    handleBack();
  };

  const handleBack = () => {
    // Use browser history to go back if possible
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback - go to lesson detail page
      router.push(`/lessons/${lessonId}`);
    }
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

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              Update lesson details and content
            </p>
          </div>

          <Card>
            <Card.Content className="p-6">
              <LessonForm 
                lesson={lesson} 
                onSuccess={handleSuccess}
                scheduleId={lesson.schedule_id}
              />
            </Card.Content>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}