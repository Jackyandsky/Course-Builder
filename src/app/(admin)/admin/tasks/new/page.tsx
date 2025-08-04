'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Textarea, Select, Spinner, Modal } from '@/components/ui';
import { BelongingSelector } from '@/components/ui/BelongingSelector';
import { taskService } from '@/lib/supabase/tasks';
import { categoryService } from '@/lib/supabase/categories';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import type { Category } from '@/types/database';

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
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
      setCategoriesLoading(true);
      const data = await categoryService.getCategories({ type: 'task' });
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setCategoriesLoading(false);
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
      
      router.push('/admin/tasks');
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

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create New Task</h1>
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/tasks')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter task description"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex gap-2">
              <Select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="flex-1"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCategoryModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <Select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Belongs to Courses
            </label>
            <BelongingSelector
              selectedCourses={belongingCourses}
              selectedLessons={[]}
              onCoursesChange={setBelongingCourses}
              onLessonsChange={() => {}}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Belongs to Lessons
            </label>
            <BelongingSelector
              selectedCourses={[]}
              selectedLessons={belongingLessons}
              onCoursesChange={() => {}}
              onLessonsChange={setBelongingLessons}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/tasks')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Create New Category"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name
            </label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="h-10 w-full"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>
              Create Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}