'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, Volume2 } from 'lucide-react';
import { Vocabulary, DifficultyLevel, VocabularyGroup, Book } from '@/types/database';
import { vocabularyService, CreateVocabularyData, UpdateVocabularyData } from '@/lib/supabase/vocabulary';
import { 
  Button, Card, Input, Textarea, Select, Badge, Spinner 
} from '@/components/ui';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface VocabularyFormProps {
  initialData?: Vocabulary;
}

export function VocabularyForm({ initialData }: VocabularyFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    word: initialData?.word || '',
    translation: initialData?.translation || '',
    pronunciation: initialData?.pronunciation || '',
    part_of_speech: initialData?.part_of_speech || '',
    definition: initialData?.definition || '',
    example_sentence: initialData?.example_sentence || '',
    example_translation: initialData?.example_translation || '',
    notes: initialData?.notes || '',
    difficulty: initialData?.difficulty || 'beginner' as DifficultyLevel,
    audio_url: initialData?.audio_url || '',
    image_url: initialData?.image_url || '',
    tags: initialData?.tags || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  
  // Relationships
  const [availableGroups, setAvailableGroups] = useState<VocabularyGroup[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableOptions();
    if (isEditing && initialData) {
      loadExistingRelationships();
    }
  }, []);

  const loadAvailableOptions = async () => {
    try {
      // Load available groups
      const { data: groups } = await supabase
        .from('vocabulary_groups')
        .select('id, name')
        .order('name');
      
      // Load available books
      const { data: books } = await supabase
        .from('books')
        .select('id, title')
        .order('title');

      setAvailableGroups(groups || []);
      setAvailableBooks(books || []);
    } catch (error) {
      console.error('Failed to load available options:', error);
    }
  };

  const loadExistingRelationships = async () => {
    if (!initialData) return;

    try {
      // Load existing group relationships
      const { data: groupRelations } = await supabase
        .from('vocabulary_group_items')
        .select('vocabulary_group_id')
        .eq('vocabulary_id', initialData.id);

      // Load existing book relationships (we need to create this table)
      const { data: bookRelations } = await supabase
        .from('vocabulary_books')
        .select('book_id')
        .eq('vocabulary_id', initialData.id);

      setSelectedGroups(groupRelations?.map(r => r.vocabulary_group_id) || []);
      setSelectedBooks(bookRelations?.map(r => r.book_id) || []);
    } catch (error) {
      console.error('Failed to load existing relationships:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.word.trim()) {
      newErrors.word = 'Word is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      let vocabularyId: string;
      
      if (isEditing) {
        await vocabularyService.updateVocabulary({ id: initialData.id, ...formData } as UpdateVocabularyData);
        vocabularyId = initialData.id;
      } else {
        const newVocabulary = await vocabularyService.createVocabulary(formData as CreateVocabularyData);
        vocabularyId = newVocabulary.id;
      }
      
      // Save relationships
      await saveRelationships(vocabularyId);
      
      router.push('/vocabulary');
      router.refresh();
    } catch (error: any) {
      console.error('Failed to save vocabulary:', error);
      setErrors({ submit: error.message || 'Failed to save vocabulary. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const saveRelationships = async (vocabularyId: string) => {
    try {
      // Save group relationships
      if (isEditing) {
        // Remove existing group relationships
        await supabase
          .from('vocabulary_group_items')
          .delete()
          .eq('vocabulary_id', vocabularyId);
      }

      // Add new group relationships
      if (selectedGroups.length > 0) {
        const groupItems = selectedGroups.map((groupId, index) => ({
          vocabulary_group_id: groupId,
          vocabulary_id: vocabularyId,
          position: index
        }));

        await supabase
          .from('vocabulary_group_items')
          .insert(groupItems);
      }

      // Save book relationships (when we create the table)
      if (isEditing) {
        // Remove existing book relationships
        await supabase
          .from('vocabulary_books')
          .delete()
          .eq('vocabulary_id', vocabularyId);
      }

      // Add new book relationships
      if (selectedBooks.length > 0) {
        const bookItems = selectedBooks.map(bookId => ({
          vocabulary_id: vocabularyId,
          book_id: bookId
        }));

        await supabase
          .from('vocabulary_books')
          .insert(bookItems);
      }
    } catch (error) {
      console.error('Failed to save relationships:', error);
      // Note: We could make this non-fatal and just show a warning
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

  const difficultyLevels = vocabularyService.getDifficultyLevels();
  const partsOfSpeech = vocabularyService.getPartsOfSpeechOptions();

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
          {isEditing ? 'Edit Vocabulary' : 'Add New Vocabulary'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Word"
                value={formData.word}
                onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                error={errors.word}
                placeholder="Enter the word"
                required
              />
              <Input
                label="Translation"
                value={formData.translation}
                onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                placeholder="Enter translation"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Pronunciation"
                value={formData.pronunciation}
                onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                placeholder="e.g., /həˈloʊ/"
              />
              <Select
                label="Part of Speech"
                value={formData.part_of_speech}
                onChange={(e) => setFormData({ ...formData, part_of_speech: e.target.value })}
                options={[
                  { value: '', label: 'Select part of speech' },
                  ...partsOfSpeech
                ]}
              />
            </div>

            <Textarea
              label="Definition"
              value={formData.definition}
              onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
              placeholder="Enter the definition of the word"
              rows={3}
            />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Examples & Usage</h2></Card.Header>
          <Card.Content className="space-y-4">
            <Textarea
              label="Example Sentence"
              value={formData.example_sentence}
              onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
              placeholder="Enter an example sentence using this word"
              rows={2}
            />
            
            <Textarea
              label="Example Translation"
              value={formData.example_translation}
              onChange={(e) => setFormData({ ...formData, example_translation: e.target.value })}
              placeholder="Enter the translation of the example sentence"
              rows={2}
            />

            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes, usage tips, or context"
              rows={3}
            />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Media & Classification</h2></Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Audio URL"
                  type="url"
                  value={formData.audio_url}
                  onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                  placeholder="https://example.com/audio.mp3"
                />
                {formData.audio_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Volume2 className="h-4 w-4" />}
                      onClick={() => {
                        const audio = new Audio(formData.audio_url);
                        audio.play().catch(console.error);
                      }}
                    >
                      Test Audio
                    </Button>
                  </div>
                )}
              </div>
              
              <Input
                label="Image URL"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
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

            {formData.image_url && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Preview
                </label>
                <div className="w-32 h-32 border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={formData.image_url}
                    alt={formData.word}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Relationships</h2></Card.Header>
          <Card.Content className="space-y-6">
            {/* Vocabulary Groups */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vocabulary Groups
              </label>
              <div className="space-y-2">
                {availableGroups.map((group) => (
                  <label key={group.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGroups([...selectedGroups, group.id]);
                        } else {
                          setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{group.name}</span>
                  </label>
                ))}
              </div>
              {selectedGroups.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Selected {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Books */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Related Books
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableBooks.map((book) => (
                  <label key={book.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedBooks.includes(book.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBooks([...selectedBooks, book.id]);
                        } else {
                          setSelectedBooks(selectedBooks.filter(id => id !== book.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{book.title}</span>
                  </label>
                ))}
              </div>
              {selectedBooks.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Selected {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
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
          <Button type="button" variant="outline" onClick={() => router.push('/vocabulary')}>Cancel</Button>
          <Button type="submit" loading={loading} leftIcon={<Save className="h-4 w-4" />}>
            {isEditing ? 'Update Vocabulary' : 'Create Vocabulary'}
          </Button>
        </div>
      </div>
    </form>
  );
}
