'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Plus, Trash2, Search, BookOpen } from 'lucide-react';
import { VocabularyGroup, Vocabulary, Book } from '@/types/database';
import { 
  Button, Card, Badge, Table, Spinner, Modal, Input 
} from '@/components/ui';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function VocabularyGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [group, setGroup] = useState<VocabularyGroup | null>(null);
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const groupId = params.id as string;

  useEffect(() => {
    if (groupId) {
      loadGroup();
      loadVocabulary();
      loadRelatedBooks();
    }
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const { data, error } = await supabase
        .from('vocabulary_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      console.error('Failed to load vocabulary group:', error);
    }
  };

  const loadVocabulary = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vocabulary_group_items')
        .select(`
          *,
          vocabulary:vocabulary(*)
        `)
        .eq('vocabulary_group_id', groupId)
        .order('position');

      if (error) throw error;
      setVocabulary(data?.map(item => item.vocabulary).filter(Boolean) || []);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('vocabulary_group_books')
        .select(`
          book:books(
            id,
            title,
            author,
            cover_image_url,
            publication_year
          )
        `)
        .eq('vocabulary_group_id', groupId)
        .order('position');

      if (error) throw error;
      
      const books = data
        ?.map((item: any) => item.book)
        .filter(Boolean) as Book[] || [];
      
      setRelatedBooks(books);
    } catch (error) {
      console.error('Failed to load related books:', error);
    }
  };

  const handleDelete = async () => {
    if (!group || !confirm('Are you sure you want to delete this vocabulary group?')) return;

    try {
      const { error } = await supabase
        .from('vocabulary_groups')
        .delete()
        .eq('id', group.id);

      if (error) throw error;
      router.push('/admin/vocabulary/groups');
    } catch (error) {
      console.error('Failed to delete vocabulary group:', error);
    }
  };

  const handleRemoveWord = async (vocabularyId: string) => {
    if (!confirm('Are you sure you want to remove this word from the group?')) return;

    try {
      const { error } = await supabase
        .from('vocabulary_group_items')
        .delete()
        .eq('vocabulary_group_id', groupId)
        .eq('vocabulary_id', vocabularyId);

      if (error) throw error;
      loadVocabulary(); // Reload the vocabulary list
    } catch (error) {
      console.error('Failed to remove word from group:', error);
    }
  };

  if (!group && !loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Vocabulary Group Not Found</h1>
          <p className="mt-2 text-gray-600">The vocabulary group you're looking for doesn't exist.</p>
          <Button
            className="mt-4"
            onClick={() => router.push('/admin/vocabulary/groups')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/vocabulary/groups')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group?.name || 'Loading...'}</h1>
            {group?.description && (
              <p className="mt-1 text-sm text-gray-600">{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/vocabulary/groups/${groupId}/edit`)}
            leftIcon={<Edit className="h-4 w-4" />}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Group Details */}
      {group && (
        <Card>
          <Card.Header>
            <Card.Title>Group Information</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Language</label>
                <p className="mt-1">{group.language}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Target Language</label>
                <p className="mt-1">{group.target_language || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Difficulty</label>
                <p className="mt-1">
                  <Badge variant={group.difficulty === 'beginner' ? 'success' : 
                              group.difficulty === 'intermediate' ? 'warning' : 'danger'}>
                    {group.difficulty}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Vocabulary Count</label>
                <p className="mt-1">{vocabulary.length} words</p>
              </div>
            </div>
            {group.tags && group.tags.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            {relatedBooks.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Related Books ({relatedBooks.length})</label>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {relatedBooks.map((book) => (
                    <div
                      key={book.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/admin/books/${book.id}`)}
                    >
                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-10 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1" title={book.title}>
                          {book.title}
                        </h4>
                        {book.author && (
                          <p className="text-xs text-gray-600 line-clamp-1" title={book.author}>
                            by {book.author}
                          </p>
                        )}
                        {book.publication_year && (
                          <p className="text-xs text-gray-500">{book.publication_year}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Vocabulary List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Vocabulary Words ({vocabulary.length})</Card.Title>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Existing Word
              </Button>
              <Button
                size="sm"
                onClick={() => router.push(`/admin/vocabulary/new?group_id=${groupId}`)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Create New Word
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : vocabulary.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No vocabulary words yet.</p>
              <div className="mt-4 flex justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Existing Word
                </Button>
                <Button
                  onClick={() => router.push(`/admin/vocabulary/new?group_id=${groupId}`)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create New Word
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {vocabulary.map((word) => (
                <div key={word.id} className="border rounded-lg p-2 hover:shadow-md transition-shadow group relative">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-xs line-clamp-2 flex-1" title={word.word}>
                        {word.word}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWord(word.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 p-0 text-red-600 hover:text-red-700 ml-1"
                        title="Remove from group"
                      >
                        ×
                      </Button>
                    </div>
                    
                    {word.translation && (
                      <p className="text-xs text-gray-600 line-clamp-1" title={word.translation}>
                        {word.translation}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {word.part_of_speech && (
                        <Badge variant="secondary" className="text-xs px-1 py-0.5">
                          {word.part_of_speech.length > 3 ? word.part_of_speech.substring(0, 3) : word.part_of_speech}
                        </Badge>
                      )}
                      <Badge 
                        variant={word.difficulty === 'beginner' ? 'success' : 
                                word.difficulty === 'intermediate' ? 'warning' : 'danger'}
                        className="text-xs px-1 py-0.5"
                      >
                        {word.difficulty.charAt(0).toUpperCase()}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/vocabulary/${word.id}`)}
                      className="w-full h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Add Vocabulary Modal */}
      {showAddModal && (
        <AddVocabularyModal
          groupId={groupId}
          onClose={() => setShowAddModal(false)}
          onWordAdded={loadVocabulary}
        />
      )}
    </div>
  );
}

// Add Vocabulary Modal Component
function AddVocabularyModal({ 
  groupId, 
  onClose, 
  onWordAdded 
}: { 
  groupId: string;
  onClose: () => void;
  onWordAdded: () => void;
}) {
  const supabase = createClientComponentClient();
  const [availableWords, setAvailableWords] = useState<Vocabulary[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadAvailableWords();
  }, [searchTerm]);

  const loadAvailableWords = async () => {
    try {
      setLoading(true);
      
      // Get words that are not already in the group
      const { data: existingItems } = await supabase
        .from('vocabulary_group_items')
        .select('vocabulary_id')
        .eq('vocabulary_group_id', groupId);

      const existingWordIds = existingItems?.map(item => item.vocabulary_id) || [];

      let query = supabase
        .from('vocabulary')
        .select('*')
        .order('word');

      if (searchTerm) {
        query = query.ilike('word', `%${searchTerm}%`);
      }

      if (existingWordIds.length > 0) {
        query = query.not('id', 'in', `(${existingWordIds.join(',')})`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setAvailableWords(data || []);
    } catch (error) {
      console.error('Failed to load available words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWordToggle = (wordId: string) => {
    setSelectedWords(prev => 
      prev.includes(wordId) 
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };

  const handleAddWords = async () => {
    if (selectedWords.length === 0) return;

    try {
      setAdding(true);
      
      const items = selectedWords.map((vocabularyId, index) => ({
        vocabulary_group_id: groupId,
        vocabulary_id: vocabularyId,
        position: index
      }));

      const { error } = await supabase
        .from('vocabulary_group_items')
        .insert(items);

      if (error) throw error;
      
      onWordAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add words to group:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add Vocabulary Words">
      <div className="space-y-4">
        {/* Search */}
        <Input
          placeholder="Search vocabulary words..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Available Words */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : availableWords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'No words found matching your search.' : 'No available words to add.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableWords.map((word) => (
                <div
                  key={word.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedWords.includes(word.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleWordToggle(word.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{word.word}</h4>
                      {word.translation && (
                        <p className="text-sm text-gray-600">{word.translation}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        {word.part_of_speech && (
                          <Badge variant="secondary" className="text-xs">
                            {word.part_of_speech}
                          </Badge>
                        )}
                        <Badge 
                          variant={word.difficulty === 'beginner' ? 'success' : 
                                  word.difficulty === 'intermediate' ? 'warning' : 'danger'}
                          className="text-xs"
                        >
                          {word.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedWords.includes(word.id)}
                      onChange={() => handleWordToggle(word.id)}
                      className="rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <p className="text-sm text-gray-600">
            {selectedWords.length} word{selectedWords.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddWords}
              disabled={selectedWords.length === 0 || adding}
              loading={adding}
            >
              Add Selected Words
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}