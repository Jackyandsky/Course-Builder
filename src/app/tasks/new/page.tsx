'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, Input, Textarea, Select, Spinner, Modal } from '@/components/ui';
import { BelongingSelector } from '@/components/ui/BelongingSelector';
import { taskService } from '@/lib/supabase/tasks';
import { categoryService } from '@/lib/supabase/categories';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import type { Category } from '@/types/database';

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');
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
    loadCategories();
  }, []);

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
      const newTask = await taskService.createTask(formData);
      
      // Add belonging relationships
      await Promise.all([
        // Add to courses
        ...belongingCourses.map((courseId, index) =>
          taskService.addTaskToCourse(courseId, newTask.id, { position: index })
        ),
        // Add to lessons
        ...belongingLessons.map((lessonId, index) =>
          taskService.addTaskToLesson(lessonId, newTask.id, { position: index })
        )
      ]);
      
      router.push('/tasks');
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await categoryService.createCategory({
        name: newCategoryName,
        type: 'task',
        color: newCategoryColor,
      });

      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategoryColor('#6b7280');

      await loadCategories();
      setFormData(prev => ({ ...prev, category_id: newCategory.id }));
      
    } catch (error) {
      console.error("Failed to create task category:", error);
      alert('Failed to create category. Please try again.');
    }
  };

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
                Create New Task
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add a new learning task for courses and lessons
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
                    <div className="flex items-center gap-2">
                      <Select
                        className="flex-grow"
                        value={formData.category_id}
                        onChange={(e) => handleChange('category_id', e.target.value)}
                        options={[
                          { value: '', label: 'Select category...' },
                          ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                        ]}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex-shrink-0 !h-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
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
                    {loading ? 'Creating...' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </Card.Content>
          </Card>
        </div>

        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          title="Create New Task Category"
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Assignment, Reading Practice, etc."
              required
            />
            <Input
              label="Category Color"
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>
              Create Category
            </Button>
          </div>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}