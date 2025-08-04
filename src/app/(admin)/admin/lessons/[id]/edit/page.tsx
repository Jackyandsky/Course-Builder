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
      router.push('/admin/lessons');
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
      router.push('/admin/lessons');
    }
  };

  const handleRelationshipUpdate = () => {
    loadLesson(); // Reload lesson data when relationships change
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Lesson not found</p>
      </div>
    );
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: Edit },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  ];


  return (
    <div>
      {/* Lesson edit content */}
    </div>
  );
}