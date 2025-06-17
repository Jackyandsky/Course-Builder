'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, Input, Textarea, Select, Spinner, Badge, Modal, BelongingSelector } from '@/components/ui';
import { methodService } from '@/lib/supabase/methods';
import { categoryService } from '@/lib/supabase/categories';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import type { Category, Method } from '@/types/database';

export default function EditMethodPage() {
  const router = useRouter();
  const params = useParams();
  const methodId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
    Promise.all([loadMethod(), loadCategories()]);
  }, [methodId]);

  const loadMethod = async () => {
    try {
      const method = await methodService.getMethod(methodId);
      
      // Load belonging relationships
      const methodWithBelongings = await methodService.getMethodsWithBelongings({ search: '', tags: [] });
      const currentMethod = methodWithBelongings.find(m => m.id === methodId);
      
      setFormData({
        name: method.name,
        description: method.description || '',
        category_id: method.category_id || '',
        tags: method.tags || [],
        belongingCourses: (currentMethod as any)?.belongingCourses?.map((c: any) => c.id) || [],
        belongingLessons: (currentMethod as any)?.belongingLessons?.map((l: any) => l.id) || [],
      });
    } catch (error) {
      console.error('Failed to load method:', error);
      alert('Failed to load method');
      router.push('/methods');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories({ type: 'method' });
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
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
      // Update the method
      await methodService.updateMethod({ 
        id: methodId, 
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id || undefined,
        tags: formData.tags,
      });

      // Update belonging relationships
      // First, remove all existing relationships
      try {
        await methodService.removeMethodFromAllCourses(methodId);
        await methodService.removeMethodFromAllLessons(methodId);
      } catch (removeError) {
        console.error('Failed to remove existing relationships (non-fatal):', removeError);
      }

      // Add to selected courses
      try {
        for (const courseId of formData.belongingCourses) {
          await methodService.addMethodToCourse(courseId, methodId, { position: 0 });
        }
      } catch (courseError) {
        console.error('Failed to add to courses (non-fatal):', courseError);
      }

      // Add to selected lessons
      try {
        for (const lessonId of formData.belongingLessons) {
          await methodService.addMethodToLesson(lessonId, methodId, { position: 0 });
        }
      } catch (lessonError) {
        console.error('Failed to add to lessons (non-fatal):', lessonError);
      }

      router.push('/methods');
    } catch (error) {
      console.error('Failed to update method:', error);
      alert('Failed to update method. Please try again.');
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
                Edit Method
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update method details and settings
              </p>
            </div>
          </div>

          <Card>
            <Card.Header>
              <h2 className="text-lg font-medium">Method Details</h2>
            </Card.Header>
            <Card.Content>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter method name..."
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
                    placeholder="Describe the teaching method and how to implement it..."
                    rows={4}
                  />
                </div>

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
                    Tags
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleTagKeyPress}
                        placeholder="Add a tag..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTag}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add relevant tags to help categorize this method
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Belongs To
                  </label>
                  <BelongingSelector
                    selectedCourses={formData.belongingCourses}
                    selectedLessons={formData.belongingLessons}
                    onCoursesChange={(courses) => setFormData(prev => ({ ...prev, belongingCourses: courses }))}
                    onLessonsChange={(lessons) => setFormData(prev => ({ ...prev, belongingLessons: lessons }))}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select which courses and lessons this method will be used in
                  </p>
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

        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          title="Create New Method Category"
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Interactive, Discussion, Project-based, etc."
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