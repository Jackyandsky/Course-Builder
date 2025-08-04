'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Textarea, Select, Spinner, Badge, Modal, BelongingSelector } from '@/components/ui';
import { methodService } from '@/lib/supabase/methods';
import { categoryService } from '@/lib/supabase/categories';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import type { Category } from '@/types/database';

export default function NewMethodPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    tags: [] as string[],
    belongingCourses: [] as string[],
    belongingLessons: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await categoryService.getCategories({ type: 'method' });
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a method name');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating method with data:', {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        tags: formData.tags,
      });
      
      const method = await methodService.createMethod({
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id || undefined, // Convert empty string to undefined
        tags: formData.tags,
      });

      console.log('Method created successfully:', method);

      // Try to add to selected courses
      try {
        for (const courseId of formData.belongingCourses) {
          await methodService.addMethodToCourse(courseId, method.id, { position: 0 });
        }
        console.log('Added to courses successfully');
      } catch (courseError) {
        console.error('Failed to add to courses (non-fatal):', courseError);
      }

      // Try to add to selected lessons
      try {
        for (const lessonId of formData.belongingLessons) {
          await methodService.addMethodToLesson(lessonId, method.id, { position: 0 });
        }
        console.log('Added to lessons successfully');
      } catch (lessonError) {
        console.error('Failed to add to lessons (non-fatal):', lessonError);
      }

      router.push('/admin/methods');
    } catch (error) {
      console.error('Failed to create method:', error);
      alert('Failed to create method. Please try again.');
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

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await categoryService.createCategory({
        name: newCategoryName,
        type: 'method',
        color: newCategoryColor,
      });

      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategoryColor('#6b7280');

      // Reload categories specifically to ensure fresh data
      const freshCategories = await categoryService.getCategories({ type: 'method' });
      setCategories(freshCategories);
      setFormData(prev => ({ ...prev, category_id: newCategory.id }));
      
    } catch (error) {
      console.error("Failed to create method category:", error);
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
        <h1 className="text-3xl font-bold">Create New Method</h1>
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/methods')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Methods
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Method Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter method name"
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
              placeholder="Enter method description"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Add a tag"
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Belongs to Courses
            </label>
            <BelongingSelector
              selectedCourses={formData.belongingCourses}
              selectedLessons={[]}
              onCoursesChange={(selectedCourses: string[]) => handleChange('belongingCourses', selectedCourses)}
              onLessonsChange={() => {}}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Belongs to Lessons
            </label>
            <BelongingSelector
              selectedCourses={[]}
              selectedLessons={formData.belongingLessons}
              onCoursesChange={() => {}}
              onLessonsChange={(selectedLessons: string[]) => handleChange('belongingLessons', selectedLessons)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/methods')}
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
                  Create Method
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