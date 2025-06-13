'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { objectiveService } from '@/lib/supabase/objectives';
import { categoryService } from '@/lib/supabase/categories';
import type { Objective, Category } from '@/types/database';
import { Save, Plus, X } from 'lucide-react';

interface ObjectiveFormProps {
  objective?: Objective;
  onSuccess?: () => void;
}

const BLOOM_LEVELS: { value: string; label: string }[] = [
  { value: 'remember', label: 'Remember' },
  { value: 'understand', label: 'Understand' },
  { value: 'apply', label: 'Apply' },
  { value: 'analyze', label: 'Analyze' },
  { value: 'evaluate', label: 'Evaluate' },
  { value: 'create', label: 'Create' },
];

export function ObjectiveForm({ objective, onSuccess }: ObjectiveFormProps) {
  const router = useRouter();
  const isEditing = !!objective;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const [formData, setFormData] = useState({
    title: objective?.title || '',
    description: objective?.description || '',
    category_id: objective?.category_id || '',
    bloom_level: objective?.bloom_level || 'understand',
    measurable: objective?.measurable ?? true,
    tags: objective?.tags || [],
    is_template: objective?.is_template || false,
    metadata: objective?.metadata || {},
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories({ type: 'objective' });
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const objectiveData = {
        ...formData,
        category_id: formData.category_id || undefined,
      };

      if (isEditing) {
        await objectiveService.updateObjective({ id: objective!.id, ...objectiveData });
      } else {
        await objectiveService.createObjective(objectiveData);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/objectives');
        router.refresh();
      }
    } catch (error: any) {
      console.error('Failed to save objective:', error);
      setErrors({ submit: error.message || 'Failed to save objective. Please try again.' });
    } finally {
      setLoading(false);
    }
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


  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEditing ? 'Edit Objective' : 'Create New Objective'}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {isEditing ? 'Update objective details' : 'Create a reusable teaching objective for course and lesson planning'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <Input
              label="Objective Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Students will be able to analyze literary themes"
              required
              error={errors.title}
            />
          </div>

          <div className="col-span-2">
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of what students should achieve..."
              rows={3}
              required
              error={errors.description}
            />
          </div>

          <div>
            <Select
              label="Category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              options={[
                { value: '', label: 'No category' },
                ...categories.map(c => ({ value: c.id, label: c.name }))
              ]}
              placeholder="Select a category..."
            />
          </div>

          <div>
            <Select
              label="Bloom's Taxonomy Level"
              value={formData.bloom_level}
              onChange={(e) => setFormData({ ...formData, bloom_level: e.target.value })}
              options={BLOOM_LEVELS}
              required
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.measurable}
                onChange={(e) => setFormData({ ...formData, measurable: e.target.checked })}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Measurable Objective</span>
            </label>
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_template}
                onChange={(e) => setFormData({ ...formData, is_template: e.target.checked })}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Template Objective</span>
            </label>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
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
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>


        <div className="flex justify-end space-x-4 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/objectives')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading} leftIcon={<Save className="h-4 w-4" />}>
            {isEditing ? 'Update Objective' : 'Create Objective'}
          </Button>
        </div>
      </form>
    </div>
  );
}