'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';
import { VocabularyGroup, Category, DifficultyLevel } from '@/types/database';
import { vocabularyService, CreateVocabularyGroupData, UpdateVocabularyGroupData } from '@/lib/supabase/vocabulary';
import { categoryService } from '@/lib/supabase/categories';
import { 
  Button, Card, Input, Textarea, Select, Badge, Modal, Spinner 
} from '@/components/ui';

interface VocabularyGroupFormProps {
  initialData?: VocabularyGroup;
}

export function VocabularyGroupForm({ initialData }: VocabularyGroupFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category_id: initialData?.category_id || '',
    language: initialData?.language || 'en',
    target_language: initialData?.target_language || '',
    difficulty: initialData?.difficulty || 'beginner' as DifficultyLevel,
    tags: initialData?.tags || [],
    is_public: initialData?.is_public || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories({ type: 'vocabulary' });
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (isEditing) {
        await vocabularyService.updateVocabularyGroup({ id: initialData.id, ...formData } as UpdateVocabularyGroupData);
      } else {
        await vocabularyService.createVocabularyGroup(formData as CreateVocabularyGroupData);
      }
      
      router.push('/vocabulary/groups');
      router.refresh();
    } catch (error: any) {
      console.error('Failed to save vocabulary group:', error);
      setErrors({ submit: error.message || 'Failed to save vocabulary group. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await categoryService.createCategory({
        name: newCategoryName,
        type: 'vocabulary',
        color: newCategoryColor,
      });

      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      await loadCategories();
      setFormData({ ...formData, category_id: newCategory.id });
      
    } catch (error) {
      console.error("Failed to create vocabulary category:", error);
    }
  };

  const difficultyLevels = vocabularyService.getDifficultyLevels();

  const commonLanguages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ar', label: 'Arabic' },
    { value: 'hi', label: 'Hindi' },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEditing ? 'Edit Vocabulary Group' : 'Create New Vocabulary Group'}
        </h1>
      </div>

      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {errors.submit}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Basic Information</h2></Card.Header>
          <Card.Content className="space-y-4">
            <Input
              label="Group Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              placeholder="Enter group name"
              required
            />
            
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this vocabulary group"
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <div className="flex items-center gap-2">
                  <Select
                    className="flex-grow"
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
                    className="flex-shrink-0 !h-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Select
                label="Difficulty Level"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
                options={difficultyLevels.map(level => ({
                  value: level.value,
                  label: level.label
                }))}
              />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Language Settings</h2></Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Source Language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                options={commonLanguages}
              />
              
              <Select
                label="Target Language"
                value={formData.target_language}
                onChange={(e) => setFormData({ ...formData, target_language: e.target.value })}
                options={[
                  { value: '', label: 'Select target language' },
                  ...commonLanguages
                ]}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_public" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Make this group publicly accessible
              </label>
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Tags</h2></Card.Header>
          <Card.Content className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }}}
              />
              <Button type="button" onClick={handleAddTag} leftIcon={<Plus className="h-4 w-4" />}>Add</Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/vocabulary/groups')}>Cancel</Button>
          <Button type="submit" loading={loading} leftIcon={<Save className="h-4 w-4" />}>
            {isEditing ? 'Update Group' : 'Create Group'}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Create New Vocabulary Category"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g., Business, Academic, etc."
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
