'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, GripVertical } from 'lucide-react';
import { Course, CourseStatus, DifficultyLevel, Category } from '@/types/database';
import { courseService, CreateCourseData, UpdateCourseData } from '@/lib/supabase/courses';
import { categoryService } from '@/lib/supabase/categories';
import { 
  Button, Card, Input, Textarea, Select, Badge, Modal, Spinner 
} from '@/components/ui';
import { cn } from '@/lib/utils';

interface CourseFormProps {
  initialData?: Course;
}

export function CourseForm({ initialData }: CourseFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    short_description: initialData?.short_description || '',
    description: initialData?.description || '',
    category_id: initialData?.category_id || '',
    status: initialData?.status || 'draft' as CourseStatus,
    difficulty: initialData?.difficulty || 'basic' as DifficultyLevel,
    duration_hours: initialData?.duration_hours || undefined,
    prerequisites: initialData?.prerequisites || [],
    tags: initialData?.tags || [],
    is_public: initialData?.is_public || false,
    public_slug: initialData?.public_slug || '',
    thumbnail_url: initialData?.thumbnail_url || '',
    price: initialData?.price || 7000,
    currency: initialData?.currency || 'USD',
    discount_percentage: initialData?.discount_percentage || 0,
    sale_price: initialData?.sale_price || undefined,
    is_free: initialData?.is_free || false,
    stripe_product_id: initialData?.stripe_product_id || '',
    stripe_price_id: initialData?.stripe_price_id || '',
    show_on_menu: initialData?.show_on_menu || false,
    show_on_homepage: initialData?.show_on_homepage || false,
    menu_order: initialData?.menu_order || 0,
    homepage_order: initialData?.homepage_order || 0,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories({ type: 'course' });
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    if (formData.short_description && formData.short_description.length > 300) {
      newErrors.short_description = 'Short description must be less than 300 characters';
    }
    
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Clean the form data - convert empty strings to null/undefined
      const courseData = {
        title: formData.title,
        short_description: formData.short_description || null,
        description: formData.description || null,
        category_id: formData.category_id || null,
        status: formData.status,
        difficulty: formData.difficulty,
        duration_hours: formData.duration_hours || null,
        prerequisites: formData.prerequisites.length > 0 ? formData.prerequisites : null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        is_public: formData.is_public,
        public_slug: formData.public_slug || null,
        thumbnail_url: formData.thumbnail_url || null,
        price: formData.price,
        currency: formData.currency,
        discount_percentage: formData.discount_percentage,
        sale_price: formData.sale_price || null,
        is_free: formData.is_free,
        stripe_product_id: formData.stripe_product_id || null,
        stripe_price_id: formData.stripe_price_id || null,
        show_on_menu: formData.show_on_menu,
        show_on_homepage: formData.show_on_homepage,
        menu_order: formData.menu_order,
        homepage_order: formData.homepage_order,
      };
      
      if (isEditing) {
        await courseService.updateCourse({
          id: initialData.id,
          ...courseData,
        } as UpdateCourseData);
        // Small delay to ensure database update completes before redirect
        await new Promise(resolve => setTimeout(resolve, 500));
        // Redirect to detail page after update with cache-busting timestamp
        router.push(`/admin/courses/${initialData.id}?t=${Date.now()}`);
      } else {
        const newCourse = await courseService.createCourse(courseData as CreateCourseData);
        // Redirect to detail page of newly created course
        router.push(`/admin/courses/${newCourse.id}`);
      }
    } catch (error: any) {
      console.error('Failed to save course:', error);
      const errorMessage = error?.message || 'Failed to save course. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };


  const handleAddPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setFormData({
        ...formData,
        prerequisites: [...formData.prerequisites, newPrerequisite.trim()],
      });
      setNewPrerequisite('');
    }
  };

  const handleRemovePrerequisite = (index: number) => {
    setFormData({
      ...formData,
      prerequisites: formData.prerequisites.filter((_, i) => i !== index),
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
  
    try {
      const newCategory = await categoryService.createCategory({
        name: newCategoryName,
        type: 'course', // Hardcode the type for this context
        color: newCategoryColor,
      });
  
      // Close modal and reset form
      setIsCategoryModalOpen(false);
      setNewCategoryName('');
  
      // Refresh the category list and select the new one
      await loadCategories();
      setFormData({ ...formData, category_id: newCategory.id });
      
    } catch (error) {
      console.error("Failed to create category:", error);
      // You can add error handling for the user here
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  const difficultyOptions = [
    { value: 'basic', label: 'Basic' },
    { value: 'standard', label: 'Standard' },
    { value: 'premium', label: 'Premium' },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/courses')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          Back to Courses
        </Button>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEditing ? 'Edit Course' : 'Create New Course'}
        </h1>
      </div>

      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {errors.submit}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold">Basic Information</h2>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <Input
                label="Course Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={errors.title}
                placeholder="Enter course title"
                required
              />
              
              <Input
                label="Short Description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                error={errors.short_description}
                placeholder="Brief description (max 300 characters)"
                helperText={`${formData.short_description.length}/300 characters`}
              />
              
              <Textarea
                label="Full Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed course description"
                rows={6}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="flex items-center gap-2">
                    <Select
                      className="flex-grow min-w-0"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      options={[
                        { value: '', label: 'Select category' },
                        ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                      ]}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="flex-shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Select
                    label="Status"
                    fullWidth
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CourseStatus })}
                    options={statusOptions}
                  />
                </div>
                
                <div>
                  <Select
                    label="Difficulty"
                    fullWidth
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
                    options={difficultyOptions}
                  />
                </div>
              </div>
              
            </div>
          </Card.Content>
        </Card>


        {/* Prerequisites */}
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold">Prerequisites</h2>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newPrerequisite}
                  onChange={(e) => setNewPrerequisite(e.target.value)}
                  placeholder="Add a prerequisite"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPrerequisite())}
                />
                <Button
                  type="button"
                  onClick={handleAddPrerequisite}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add
                </Button>
              </div>
              
              {formData.prerequisites.length > 0 && (
                <div className="space-y-2">
                  {formData.prerequisites.map((prerequisite, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="flex-1 text-sm">{prerequisite}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePrerequisite(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Tags */}
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold">Tags</h2>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Visibility Settings */}
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold">Visibility Settings</h2>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_public" className="text-sm font-medium text-gray-700">
                    Public Course
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="show_on_menu"
                    checked={formData.show_on_menu}
                    onChange={(e) => setFormData({ ...formData, show_on_menu: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show_on_menu" className="text-sm font-medium text-gray-700">
                    Show in Menu
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="show_on_homepage"
                    checked={formData.show_on_homepage}
                    onChange={(e) => setFormData({ ...formData, show_on_homepage: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show_on_homepage" className="text-sm font-medium text-gray-700">
                    Show on Homepage
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Menu Order"
                  value={formData.menu_order}
                  onChange={(e) => setFormData({ ...formData, menu_order: parseInt(e.target.value) || 0 })}
                  helperText="Display order in menu"
                  disabled={!formData.show_on_menu}
                />
                
                <Input
                  type="number"
                  label="Homepage Order"
                  value={formData.homepage_order}
                  onChange={(e) => setFormData({ ...formData, homepage_order: parseInt(e.target.value) || 0 })}
                  helperText="Display order on homepage"
                  disabled={!formData.show_on_homepage}
                />
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold">Pricing Settings</h2>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_free"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_free" className="text-sm font-medium text-gray-700">
                  Free Course
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 7000"
                  disabled={formData.is_free}
                />
                
                <Select
                  label="Currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  disabled={formData.is_free}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Discount Percentage"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 10"
                  helperText="Percentage discount to apply"
                  disabled={formData.is_free}
                />
                
                <Input
                  type="number"
                  label="Sale Price"
                  value={formData.sale_price || ''}
                  onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || undefined })}
                  placeholder="e.g., 6300"
                  helperText="Override calculated sale price"
                  disabled={formData.is_free}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Stripe Product ID"
                  value={formData.stripe_product_id}
                  onChange={(e) => setFormData({ ...formData, stripe_product_id: e.target.value })}
                  placeholder="prod_..."
                  helperText="Stripe product identifier"
                  disabled={formData.is_free}
                />
                
                <Input
                  label="Stripe Price ID"
                  value={formData.stripe_price_id}
                  onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                  placeholder="price_..."
                  helperText="Stripe price identifier"
                  disabled={formData.is_free}
                />
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/courses')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {isEditing ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Create New Category"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g., Programming"
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
          <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateCategory}>
            Create Category
          </Button>
        </div>
      </Modal>
    </form>
  );
}
export default CourseForm;