'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
      router.push('/tasks');
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
      
      router.push('/tasks');
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
        <div className="p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Edit Task
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update task details and settings
              </p>
            </div>
          </div>

          <Card>
            <Card.Header>
              <h2 className="text-lg font-medium">Task Details</h2>
            </Card.Header>
            <Card.Content>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Enter task title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe the task and its requirements..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <Select
                      value={formData.category_id}
                      onChange={(e) => handleChange('category_id', e.target.value)}
                      options={[
                        { value: '', label: 'Select category...' },
                        ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <Select
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                        { value: 'urgent', label: 'Urgent' }
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Points
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.points}
                    onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Points awarded for completing this task
                  </p>
                </div>

                {/* Belongs To Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Belongs To
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Select which courses and lessons this task belongs to. You can select multiple courses and lessons.
                  </p>
                  <BelongingSelector
                    selectedCourses={belongingCourses}
                    selectedLessons={belongingLessons}
                    onCoursesChange={setBelongingCourses}
                    onLessonsChange={setBelongingLessons}
                    disabled={loading}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    leftIcon={loading ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Card.Content>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}