'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, BookOpen, Search } from 'lucide-react';
import { Book, Category, ContentType, VocabularyGroup } from '@/types/database';
import { bookService, CreateBookData, UpdateBookData } from '@/lib/supabase/books';
import { categoryService } from '@/lib/supabase/categories';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Button, Card, Input, Textarea, Select, Badge, Modal, Spinner 
} from '@/components/ui';

interface BookFormProps {
  initialData?: Book;
}

export function BookForm({ initialData }: BookFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');

  // Vocabulary group relationships
  const [availableVocabGroups, setAvailableVocabGroups] = useState<VocabularyGroup[]>([]);
  const [selectedVocabGroups, setSelectedVocabGroups] = useState<string[]>([]);
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [vocabSearchTerm, setVocabSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    author: initialData?.author || '',
    description: initialData?.description || '',
    category_id: initialData?.category_id || '',
    content_type: initialData?.content_type || 'text' as ContentType,
    language: initialData?.language || 'en',
    tags: initialData?.tags || [],
    cover_image_url: initialData?.cover_image_url || '',
    publication_year: initialData?.publication_year || '',
    is_public: initialData?.is_public || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadCategories();
    loadAvailableVocabGroups();
    if (isEditing && initialData) {
      loadExistingVocabRelationships();
    }
  }, []);

  const loadAvailableVocabGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('vocabulary_groups')
        .select('id, name, description, difficulty, language, target_language')
        .order('name');

      if (error) throw error;
      setAvailableVocabGroups(data as VocabularyGroup[] || []);
    } catch (error) {
      console.error('Failed to load vocabulary groups:', error);
    }
  };

  const loadExistingVocabRelationships = async () => {
    if (!initialData) return;

    try {
      const { data, error } = await supabase
        .from('vocabulary_group_books')
        .select('vocabulary_group_id')
        .eq('book_id', initialData.id);

      if (error) throw error;
      setSelectedVocabGroups(data?.map(r => r.vocabulary_group_id) || []);
    } catch (error) {
      console.error('Failed to load existing vocabulary group relationships:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories({ type: 'book' });
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
    if (formData.publication_year && isNaN(Number(formData.publication_year))) {
      newErrors.publication_year = 'Publication year must be a number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const bookData = {
        ...formData,
        publication_year: formData.publication_year ? Number(formData.publication_year) : undefined,
      };
      
      let bookId: string;
      
      if (isEditing) {
        await bookService.updateBook({ id: initialData.id, ...bookData } as UpdateBookData);
        bookId = initialData.id;
      } else {
        const newBook = await bookService.createBook(bookData as CreateBookData);
        bookId = newBook.id;
      }

      // Save vocabulary group relationships
      await saveVocabGroupRelationships(bookId);
      
      router.push('/books');
      router.refresh(); // To reflect changes on the book list page
    } catch (error: any) {
      console.error('Failed to save book:', error);
      setErrors({ submit: error.message || 'Failed to save book. Please try again.' });
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

  const saveVocabGroupRelationships = async (bookId: string) => {
    try {
      // Remove existing relationships if editing
      if (isEditing) {
        await supabase
          .from('vocabulary_group_books')
          .delete()
          .eq('book_id', bookId);
      }

      // Add new relationships
      if (selectedVocabGroups.length > 0) {
        const groupItems = selectedVocabGroups.map((groupId, index) => ({
          vocabulary_group_id: groupId,
          book_id: bookId,
          position: index
        }));

        await supabase
          .from('vocabulary_group_books')
          .insert(groupItems);
      }
    } catch (error) {
      console.error('Failed to save vocabulary group relationships:', error);
      // Non-fatal error, continue
    }
  };

  const handleVocabGroupToggle = (groupId: string) => {
    setSelectedVocabGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const filteredVocabGroups = availableVocabGroups.filter(group =>
    group.name.toLowerCase().includes(vocabSearchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(vocabSearchTerm.toLowerCase())) ||
    group.language.toLowerCase().includes(vocabSearchTerm.toLowerCase()) ||
    (group.target_language && group.target_language.toLowerCase().includes(vocabSearchTerm.toLowerCase()))
  );

  // Add this new handler function
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await categoryService.createCategory({
        name: newCategoryName,
        type: 'book', // This ensures it's a 'book' category
        color: newCategoryColor,
      });

      // Close the modal and reset its form fields
      setIsCategoryModalOpen(false);
      setNewCategoryName('');

      // Reload the category list and automatically select the new one
      await loadCategories();
      setFormData({ ...formData, category_id: newCategory.id });
      
    } catch (error) {
      console.error("Failed to create book category:", error);
      // You could set an error state here to show in the modal if you wish
    }
  };
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
          {isEditing ? 'Edit Book' : 'Create New Book'}
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
              label="Book Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
              placeholder="Enter book title"
              required
            />
            <Input
              label="Author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Enter author's name"
            />
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed book description"
              rows={4}
            />
            <Input
              label="Cover Image URL"
              type="url"
              value={formData.cover_image_url}
              onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Details & Categorization</h2></Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
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
                  className="flex-shrink-0 !h-10" // Using !h-10 to match the input height
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
              <Input
                label="Publication Year"
                type="number"
                value={formData.publication_year}
                onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                error={errors.publication_year}
                placeholder="e.g., 2023"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Select
                label="Content Type"
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value as ContentType })}
                options={bookService.getContentTypes()}
              />
              <Input
                label="Language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                placeholder="e.g., en"
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
                Make this book publicly accessible
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

        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Related Vocabulary Groups</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Associate vocabulary groups that contain words from this book
            </p>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedVocabGroups.length} group{selectedVocabGroups.length !== 1 ? 's' : ''} selected
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVocabModal(true)}
              >
                Select Groups
              </Button>
            </div>

            {selectedVocabGroups.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedVocabGroups.map(groupId => {
                  const group = availableVocabGroups.find(g => g.id === groupId);
                  if (!group) return null;
                  
                  return (
                    <div key={groupId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{group.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {group.difficulty}
                          </Badge>
                          {group.language && group.target_language && (
                            <Badge variant="outline" className="text-xs">
                              {group.language} → {group.target_language}
                            </Badge>
                          )}
                        </div>
                        {group.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{group.description}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVocabGroupToggle(groupId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Content>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/books')}>Cancel</Button>
          <Button type="submit" loading={loading} leftIcon={<Save className="h-4 w-4" />}>
            {isEditing ? 'Update Book' : 'Create Book'}
          </Button>
        </div>
      </div>
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Create New Book Category"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g., Fiction, Science, etc."
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

      {/* Vocabulary Group Selection Modal */}
      <Modal
        isOpen={showVocabModal}
        onClose={() => setShowVocabModal(false)}
        title="Select Vocabulary Groups"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search vocabulary groups by name, description, or language..."
            value={vocabSearchTerm}
            onChange={(e) => setVocabSearchTerm(e.target.value)}
          />

          <div className="max-h-96 overflow-y-auto">
            {filteredVocabGroups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {vocabSearchTerm ? 'No vocabulary groups found matching your search.' : 'No vocabulary groups available.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredVocabGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedVocabGroups.includes(group.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleVocabGroupToggle(group.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedVocabGroups.includes(group.id)}
                          onChange={() => handleVocabGroupToggle(group.id)}
                          className="rounded"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{group.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {group.difficulty}
                            </Badge>
                            {group.language && group.target_language && (
                              <Badge variant="outline" className="text-xs">
                                {group.language} → {group.target_language}
                              </Badge>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-t pt-4">
            <p className="text-sm text-gray-600">
              {selectedVocabGroups.length} group{selectedVocabGroups.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowVocabModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowVocabModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </form>
  );
}