'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, Upload, FileText, Book, Search } from 'lucide-react';
import { VocabularyGroup, Category, DifficultyLevel, Book as BookType } from '@/types/database';
import { vocabularyService, CreateVocabularyGroupData, UpdateVocabularyGroupData } from '@/lib/supabase/vocabulary';
import { categoryService } from '@/lib/supabase/categories';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Button, Card, Input, Textarea, Select, Badge, Modal, Spinner 
} from '@/components/ui';

interface VocabularyGroupFormProps {
  initialData?: VocabularyGroup;
  onSave?: (formData: Omit<VocabularyGroup, "id" | "created_at" | "updated_at">) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function VocabularyGroupForm({ initialData, onSave, isLoading, onCancel }: VocabularyGroupFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createSupabaseClient();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');

  // Batch vocabulary creation
  const [batchVocabulary, setBatchVocabulary] = useState('');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchPreview, setBatchPreview] = useState<any[]>([]);
  const [showBatchPreview, setShowBatchPreview] = useState(false);

  // Book relationships
  const [availableBooks, setAvailableBooks] = useState<BookType[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category_id: initialData?.category_id || '',
    language: initialData?.language || 'en',
    target_language: initialData?.target_language || '',
    difficulty: initialData?.difficulty || 'basic' as DifficultyLevel,
    tags: initialData?.tags || [],
    is_public: initialData?.is_public || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadCategories();
    loadAvailableBooks();
    if (isEditing && initialData) {
      loadExistingBookRelationships();
    }
  }, []);

  const loadAvailableBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, cover_image_url')
        .order('title');

      if (error) throw error;
      setAvailableBooks(data as BookType[] || []);
    } catch (error) {
      console.error('Failed to load available books:', error);
    }
  };

  const loadExistingBookRelationships = async () => {
    if (!initialData) return;

    try {
      const { data, error } = await supabase
        .from('vocabulary_group_books')
        .select('book_id')
        .eq('vocabulary_group_id', initialData.id);

      if (error) throw error;
      setSelectedBooks(data?.map(r => r.book_id) || []);
    } catch (error) {
      console.error('Failed to load existing book relationships:', error);
    }
  };

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
    if (!validateForm() || !user) return;
    
    if (onSave) {
      // Use external onSave handler
      await onSave({ ...formData, user_id: user.id });
    } else {
      // Use internal logic for standalone form
      setLoading(true);
      try {
        let groupId: string;
        
        if (isEditing) {
          await vocabularyService.updateVocabularyGroup({ id: initialData.id, ...formData } as UpdateVocabularyGroupData);
          groupId = initialData.id;
        } else {
          const newGroup = await vocabularyService.createVocabularyGroup(formData as CreateVocabularyGroupData);
          groupId = newGroup.id;
        }
        
        // Process batch vocabulary if present
        if (batchVocabulary.trim() && batchPreview.length > 0) {
          await processBatchVocabulary(groupId);
        }

        // Save book relationships
        await saveBookRelationships(groupId);
        
        router.push('/vocabulary/groups');
        router.refresh();
      } catch (error: any) {
        console.error('Failed to save vocabulary group:', error);
        setErrors({ submit: error.message || 'Failed to save vocabulary group. Please try again.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const parseBatchVocabulary = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsed = [];
    
    for (const line of lines) {
      // Pattern: word,pos,definition
      // Example: area,n.,a region or part of a town, a country, or the world
      const parts = line.split(',');
      if (parts.length >= 3) {
        const word = parts[0].trim();
        const partOfSpeech = parts[1].trim();
        const definition = parts.slice(2).join(',').trim();
        
        if (word && definition) {
          parsed.push({
            word,
            part_of_speech: partOfSpeech,
            definition,
            difficulty: formData.difficulty,
            tags: formData.tags.length > 0 ? formData.tags : undefined
          });
        }
      }
    }
    
    return parsed;
  };

  const handleBatchPreview = () => {
    if (!batchVocabulary.trim()) return;
    
    const parsed = parseBatchVocabulary(batchVocabulary);
    setBatchPreview(parsed);
    setShowBatchPreview(true);
  };

  const processBatchVocabulary = async (groupId: string) => {
    if (batchPreview.length === 0) return;
    
    setBatchProcessing(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');
      
      for (const vocabData of batchPreview) {
        try {
          // Check if vocabulary already exists
          const { data: existing } = await supabase
            .from('vocabulary')
            .select('id')
            .eq('word', vocabData.word)
            .eq('user_id', user.user.id)
            .single();
          
          let vocabularyId;
          
          if (existing) {
            // Use existing vocabulary
            vocabularyId = existing.id;
          } else {
            // Create new vocabulary
            const { data: newVocab, error } = await supabase
              .from('vocabulary')
              .insert({
                ...vocabData,
                user_id: user.user.id
              })
              .select('id')
              .single();
              
            if (error) throw error;
            vocabularyId = newVocab.id;
          }
          
          // Add to group (check if relationship already exists)
          const { data: existingRelation } = await supabase
            .from('vocabulary_group_items')
            .select('id')
            .eq('vocabulary_group_id', groupId)
            .eq('vocabulary_id', vocabularyId)
            .single();
          
          if (!existingRelation) {
            await supabase
              .from('vocabulary_group_items')
              .insert({
                vocabulary_group_id: groupId,
                vocabulary_id: vocabularyId,
                position: 0
              });
          }
        } catch (error) {
          console.error(`Failed to process vocabulary word "${vocabData.word}":`, error);
          // Continue with next word
        }
      }
    } catch (error) {
      console.error('Failed to process batch vocabulary:', error);
      throw error;
    } finally {
      setBatchProcessing(false);
    }
  };

  const saveBookRelationships = async (groupId: string) => {
    try {
      // Remove existing relationships if editing
      if (isEditing) {
        await supabase
          .from('vocabulary_group_books')
          .delete()
          .eq('vocabulary_group_id', groupId);
      }

      // Add new relationships
      if (selectedBooks.length > 0) {
        const bookItems = selectedBooks.map((bookId, index) => ({
          vocabulary_group_id: groupId,
          book_id: bookId,
          position: index
        }));

        await supabase
          .from('vocabulary_group_books')
          .insert(bookItems);
      }
    } catch (error) {
      console.error('Failed to save book relationships:', error);
      // Non-fatal error, continue
    }
  };

  const handleBookToggle = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const filteredBooks = availableBooks.filter(book =>
    book.title.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
    (book.author && book.author.toLowerCase().includes(bookSearchTerm.toLowerCase()))
  );

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
          variant="outline"
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

        {!isEditing && (
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Batch Vocabulary Import</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add multiple vocabulary words at once. Each line should follow the pattern: word,part_of_speech,definition
              </p>
            </Card.Header>
            <Card.Content className="space-y-4">
              <Textarea
                label="Vocabulary Data"
                value={batchVocabulary}
                onChange={(e) => setBatchVocabulary(e.target.value)}
                placeholder={`area,n.,a region or part of a town, a country, or the world
beautiful,adj.,pleasing the senses or mind aesthetically
create,v.,bring something into existence`}
                rows={8}
                className="font-mono text-sm"
              />
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBatchPreview}
                  disabled={!batchVocabulary.trim()}
                  leftIcon={<Upload className="h-4 w-4" />}
                >
                  Preview Import ({parseBatchVocabulary(batchVocabulary).length} words)
                </Button>
                {batchPreview.length > 0 && (
                  <Badge variant="success">
                    {batchPreview.length} words ready for import
                  </Badge>
                )}
              </div>

              {errors.batch && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {errors.batch}
                </div>
              )}

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Format Instructions:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Each line represents one vocabulary word</li>
                  <li>• Format: word,part_of_speech,definition</li>
                  <li>• Commas in definitions are allowed</li>
                  <li>• If a word already exists, it will only be added to this group</li>
                  <li>• All words will inherit the difficulty level and tags from this group</li>
                </ul>
              </div>
            </Card.Content>
          </Card>
        )}
        
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
              <Book className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Related Books</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Associate this vocabulary group with books where these words appear
            </p>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBookModal(true)}
              >
                Select Books
              </Button>
            </div>

            {selectedBooks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedBooks.map(bookId => {
                  const book = availableBooks.find(b => b.id === bookId);
                  if (!book) return null;
                  
                  return (
                    <div key={bookId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {book.cover_image_url && (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            className="w-10 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <h4 className="font-medium text-sm">{book.title}</h4>
                          {book.author && (
                            <p className="text-xs text-gray-600">{book.author}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleBookToggle(bookId)}
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
          <Button type="button" variant="outline" onClick={onCancel || (() => router.push('/vocabulary/groups'))}>Cancel</Button>
          <Button type="submit" loading={isLoading !== undefined ? isLoading : loading} leftIcon={<Save className="h-4 w-4" />}>
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
          <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateCategory}>
            Create Category
          </Button>
        </div>
      </Modal>

      {/* Batch Preview Modal */}
      <Modal
        isOpen={showBatchPreview}
        onClose={() => setShowBatchPreview(false)}
        title="Batch Import Preview"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Preview of {batchPreview.length} vocabulary words to be imported
            </p>
            <Badge variant="info">
              {batchPreview.filter(w => w.word).length} new + {batchPreview.length - batchPreview.filter(w => w.word).length} existing
            </Badge>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="text-left p-2 border-r">Word</th>
                  <th className="text-left p-2 border-r">Part of Speech</th>
                  <th className="text-left p-2">Definition</th>
                </tr>
              </thead>
              <tbody>
                {batchPreview.map((word, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2 border-r font-medium">{word.word}</td>
                    <td className="p-2 border-r">
                      <Badge variant="secondary" className="text-xs">
                        {word.part_of_speech}
                      </Badge>
                    </td>
                    <td className="p-2 text-gray-600 dark:text-gray-400">
                      {word.definition.length > 100 
                        ? `${word.definition.substring(0, 100)}...` 
                        : word.definition}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium">Import Notes:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Words will be created with difficulty: <Badge variant="secondary" className="text-xs">{formData.difficulty}</Badge></li>
              {formData.tags.length > 0 && (
                <li>• Words will be tagged with: {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs mr-1">{tag}</Badge>
                ))}</li>
              )}
              <li>• Existing words will only be added to this group (not modified)</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowBatchPreview(false)}>
              Back to Edit
            </Button>
            <Button 
              onClick={() => setShowBatchPreview(false)}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Confirm Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* Book Selection Modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title="Select Related Books"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search books by title or author..."
            value={bookSearchTerm}
            onChange={(e) => setBookSearchTerm(e.target.value)}
          />

          <div className="max-h-96 overflow-y-auto">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {bookSearchTerm ? 'No books found matching your search.' : 'No books available.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedBooks.includes(book.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleBookToggle(book.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedBooks.includes(book.id)}
                          onChange={() => handleBookToggle(book.id)}
                          className="rounded"
                        />
                        {book.cover_image_url && (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{book.title}</h4>
                          {book.author && (
                            <p className="text-sm text-gray-600">{book.author}</p>
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
              {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowBookModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowBookModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </form>
  );
}
