'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { BelongingSelector } from '@/components/ui/BelongingSelector';
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
      router.push('/admin/methods');
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

      router.push('/admin/methods');
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
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/methods')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Methods
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Method</h1>
              <p className="text-gray-600 mt-1">Update method details and relationships</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Basic Information</h2>
            </Card.Header>
            <Card.Content className="space-y-4">
              <Input
                label="Method Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter method name"
                required
              />
              
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter method description"
                rows={4}
              />
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select
                    label="Category"
                    value={formData.category_id}
                    onChange={(e) => handleChange('category_id', e.target.value)}
                    options={[
                      { value: '', label: 'Select Category' },
                      ...categories.map((category) => ({
                        value: category.id,
                        label: category.name
                      }))
                    ]}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="mt-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Tags</h2>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:bg-gray-200 rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Relationships</h2>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Belongs to Courses
                </label>
                <BelongingSelector
                  selectedCourses={formData.belongingCourses}
                  selectedLessons={[]}
                  onCoursesChange={(ids) => handleChange('belongingCourses', ids)}
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
                  onLessonsChange={(ids) => handleChange('belongingLessons', ids)}
                />
              </div>
            </Card.Content>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/methods')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Update Method
            </Button>
          </div>
        </form>
        
        {/* Category Creation Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Create New Category</h3>
              
              <div className="space-y-4">
                <Input
                  label="Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-full h-10 rounded border border-gray-300"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}