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
import { LessonObjectiveManager } from '@/components/relationships/LessonObjectiveManager';
import { LessonMethodManager } from '@/components/relationships/LessonMethodManager';
import { LessonVocabularyManager } from '@/components/relationships/LessonVocabularyManager';
import { lessonService } from '@/lib/supabase/lessons';
import { ArrowLeft, Edit, BookOpen, CheckSquare, Target, Lightbulb, Languages } from 'lucide-react';

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
      
      // Use API route instead of direct service call
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load lesson: ${response.status}`);
      }

      const lessonData = await response.json();
      console.log('Loaded lesson data:', lessonData); // Debug log
      setLesson(lessonData);
    } catch (error) {
      console.error('Failed to load lesson:', error);
      alert('Failed to load lesson. Please try again.');
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
        <Button 
          onClick={() => router.push('/admin/lessons')}
          className="mt-4"
        >
          Back to Lessons
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: Edit },
    { id: 'objectives', label: 'Objectives', icon: Target },
    { id: 'methods', label: 'Methods', icon: Lightbulb },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'vocabulary', label: 'Vocabulary', icon: Languages },
  ];


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold">Edit Session</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id}>
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="details">
          <Card className="p-6">
            <LessonForm 
              lesson={lesson} 
              onSuccess={handleSuccess}
            />
          </Card>
        </TabsContent>

        <TabsContent value="objectives">
          <Card className="p-6">
            <LessonObjectiveManager 
              lessonId={lessonId}
              onUpdate={handleRelationshipUpdate}
            />
          </Card>
        </TabsContent>

        <TabsContent value="methods">
          <Card className="p-6">
            <LessonMethodManager 
              lessonId={lessonId}
              onUpdate={handleRelationshipUpdate}
            />
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="p-6">
            <LessonTaskManager 
              lessonId={lessonId}
              onUpdate={handleRelationshipUpdate}
            />
          </Card>
        </TabsContent>

        <TabsContent value="books">
          <Card className="p-6">
            <LessonBookManager 
              lessonId={lessonId}
              onUpdate={handleRelationshipUpdate}
            />
          </Card>
        </TabsContent>

        <TabsContent value="vocabulary">
          <Card className="p-6">
            <LessonVocabularyManager 
              lessonId={lessonId}
              onUpdate={handleRelationshipUpdate}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}