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
    difficulty: initialData?.difficulty || 'beginner' as DifficultyLevel,
    prerequisites: initialData?.prerequisites || [],
    tags: initialData?.tags || [],
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
      
      const courseData = {
        ...formData,
      };
      
      if (isEditing) {
        await courseService.updateCourse({
          id: initialData.id,
          ...courseData,
        } as UpdateCourseData);
      } else {
        await courseService.createCourse(courseData as CreateCourseData);
      }
      
      router.push('/courses');
    } catch (error) {
      console.error('Failed to save course:', error);
      setErrors({ submit: 'Failed to save course. Please try again.' });
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
    { value: 'beginner', label: 'Level 1' },
    { value: 'intermediate', label: 'Level 2' },
    { value: 'advanced', label: 'Level 3' },
    { value: 'expert', label: 'Level 4' },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push('/courses')}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
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
                
                <div className="min-w-0">
                  <Select
                    label="Status"
                    fullWidth
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CourseStatus })}
                    options={statusOptions}
                  />
                </div>
                
                <div className="min-w-0">
                  <Select
                    label="Level"
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
                        variant="ghost"
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

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/courses')}
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
          <Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>
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