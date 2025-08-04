'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, Input, Textarea, Select, Spinner } from '@/components/ui';
import { BelongingSelector } from '@/components/ui/BelongingSelector';
import { taskService } from '@/lib/supabase/tasks';
import { categoryService } from '@/lib/supabase/categories';
import { ArrowLeft, Save } from 'lucide-react';
import type { Category, Task } from '@/types/database';

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [belongingCourses, setBelongingCourses] = useState<string[]>([]);
  const [belongingLessons, setBelongingLessons] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    points: 0,
  });

  useEffect(() => {
    Promise.all([loadTask(), loadCategories()]);
  }, [taskId]);

  const loadTask = async () => {
    try {
      const taskWithBelongings = await taskService.getTaskWithBelongings(taskId);
      setFormData({
        title: taskWithBelongings.title,
        description: taskWithBelongings.description || '',
        category_id: taskWithBelongings.category_id || '',
        priority: taskWithBelongings.priority || 'medium',
        points: taskWithBelongings.points || 0,
      });
      
      // Set belonging relationships
      setBelongingCourses(taskWithBelongings.belongingCourses?.map((c: any) => c.id || c) || []);
      setBelongingLessons(taskWithBelongings.belongingLessons?.map((l: any) => l.id || l) || []);
    } catch (error) {
      console.error('Failed to load task:', error);
      alert('Failed to load task');
      router.push('/admin/tasks');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories({ type: 'task' });
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      await taskService.updateTask({ id: taskId, ...formData });
      
      // Update belonging relationships
      // First remove all existing relationships
      await Promise.all([
        taskService.removeTaskFromAllCourses(taskId),
        taskService.removeTaskFromAllLessons(taskId)
      ]);
      
      // Then add new relationships
      await Promise.all([
        // Add to courses
        ...belongingCourses.map((courseId, index) =>
          taskService.addTaskToCourse(courseId, taskId, { position: index })
        ),
        // Add to lessons
        ...belongingLessons.map((lessonId, index) =>
          taskService.addTaskToLesson(lessonId, taskId, { position: index })
        )
      ]);
      
      router.push('/admin/tasks');
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Task edit content */}
    </div>
  );
}