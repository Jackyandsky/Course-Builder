'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Textarea, Select, Spinner, Badge, Modal, BelongingSelector } from '@/components/ui';
import { objectiveService } from '@/lib/supabase/objectives';
import { categoryService } from '@/lib/supabase/categories';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import type { Category } from '@/types/database';

export default function NewObjectivePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');
  const [formData, setFormData] = useState({
    title: '',
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
      const categoriesData = await categoryService.getCategories({ type: 'objective' });
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter an objective title');
      return;
    }

    setLoading(true);
    try {
      const objective = await objectiveService.createObjective({
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id,
        tags: formData.tags,
      });

      // Add to selected courses
      for (const courseId of formData.belongingCourses) {
        await objectiveService.addObjectiveToCourse(courseId, objective.id, { position: 0 });
      }

      // Add to selected lessons
      for (const lessonId of formData.belongingLessons) {
        await objectiveService.addObjectiveToLesson(lessonId, objective.id, { position: 0 });
      }

      router.push('/admin/objectives');
    } catch (error) {
      console.error('Failed to create objective:', error);
      alert('Failed to create objective. Please try again.');
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
        type: 'objective',
        color: newCategoryColor,
      });

      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategoryColor('#6b7280');

      // Reload categories specifically to ensure fresh data
      const freshCategories = await categoryService.getCategories({ type: 'objective' });
      setCategories(freshCategories);
      setFormData(prev => ({ ...prev, category_id: newCategory.id }));
      
    } catch (error) {
      console.error("Failed to create objective category:", error);
      alert('Failed to create category. Please try again.');
    }
  };


  if (categoriesLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
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
                Create New Objective
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add a new teaching objective for courses and lessons
              </p>
            </div>
          </div>

          <Card>
            <Card.Header>
              <h2 className="text-lg font-medium">Objective Details</h2>
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
                    placeholder="Enter objective title..."
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
                    placeholder="Describe what students should achieve or learn..."
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
                    Add relevant tags to help categorize this objective
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
                    Select which courses and lessons this objective will be used in
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
                    {loading ? 'Creating...' : 'Create Objective'}
                  </Button>
                </div>
              </form>
            </Card.Content>
          </Card>

          <Modal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            title="Create New Objective Category"
            size="sm"
          >
            <div className="space-y-4">
              <Input
                label="Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Knowledge, Skills, Comprehension, etc."
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
    </div>
  );
}