'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, Key, Search } from 'lucide-react';
import { Decoder, decoderService, CreateDecoderData, UpdateDecoderData } from '@/lib/supabase/decoders';
import { bookService } from '@/lib/supabase/books';
import { categoryService } from '@/lib/supabase/categories';
import { Book, Category } from '@/types/database';
import { 
  Button, Card, Input, Textarea, Select, Badge, Modal, Spinner 
} from '@/components/ui';

interface DecoderFormProps {
  initialData?: Decoder;
}

export function DecoderForm({ initialData }: DecoderFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || null,
    tags: initialData?.tags || [],
    book_id: initialData?.book_id || '',
    is_public: initialData?.is_public || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  const loadBooks = useCallback(async () => {
    setLoadingBooks(true);
    try {
      const data = await bookService.getBooks({ limit: 1000 }); // Load all books
      setBooks(data);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategories({ type: 'decoder' });
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadBooks();
    loadCategories();
  }, [loadBooks, loadCategories]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.book_id) {
      newErrors.book_id = 'Associated book is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await categoryService.createCategory({
        name: newCategoryName,
        type: 'decoder',
        color: newCategoryColor,
      });

      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategoryColor('#6b7280');

      await loadCategories();
      setFormData({ ...formData, category: newCategory.id });
      
    } catch (error) {
      console.error("Failed to create decoder category:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const decoderData = {
        ...formData,
        // Remove category if it's null or empty to avoid UUID validation error
        ...(formData.category ? { category: formData.category } : {}),
      };
      
      // Remove the category field if it's null to avoid sending it
      if (!formData.category) {
        delete (decoderData as any).category;
      }
      
      if (isEditing) {
        await decoderService.updateDecoder({ id: initialData.id, ...decoderData } as UpdateDecoderData);
      } else {
        await decoderService.createDecoder(decoderData as CreateDecoderData);
      }
      
      router.push('/admin/decoders');
      router.refresh();
    } catch (error: any) {
      console.error('Failed to save decoder:', error);
      setErrors({ submit: error.message || 'Failed to save decoder. Please try again.' });
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

  const selectedBook = books.find(book => book.id === formData.book_id);
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
    (book.author && book.author.toLowerCase().includes(bookSearchTerm.toLowerCase())) ||
    (book.description && book.description.toLowerCase().includes(bookSearchTerm.toLowerCase()))
  );

  const handleBookSelect = (bookId: string) => {
    setFormData({ ...formData, book_id: bookId });
    setShowBookModal(false);
    setBookSearchTerm('');
  };

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
          {isEditing ? 'Edit Decoder' : 'Create New Decoder'}
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
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Decoder Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                placeholder="Enter decoder name"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <div className="flex items-center gap-2">
                  <Select
                    className="flex-grow"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
                    options={[
                      { value: '', label: 'No category' },
                      ...categories.map(c => ({ value: c.id, label: c.name }))
                    ]}
                    placeholder="Select a category..."
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
            </div>
            <div className="mt-4">
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of what this decoder analyzes"
                rows={3}
              />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Associated Book</h2></Card.Header>
          <Card.Content className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Book *
              </label>
              {selectedBook ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex-1">
                    <h4 className="font-medium">{selectedBook.title}</h4>
                    {selectedBook.author && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">by {selectedBook.author}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {selectedBook.content_type && (
                        <Badge variant="outline" className="text-xs">
                          {selectedBook.content_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBookModal(true)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBookModal(true)}
                    leftIcon={<Search className="h-4 w-4" />}
                    className="w-full"
                  >
                    Select a Book
                  </Button>
                  {errors.book_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.book_id}</p>
                  )}
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Visibility</h2></Card.Header>
          <Card.Content>
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Make this decoder publicly accessible
                </span>
              </label>
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Tags</h2></Card.Header>
          <Card.Content>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
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
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card.Content>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/decoders')}>Cancel</Button>
          <Button type="submit" loading={loading} leftIcon={<Save className="h-4 w-4" />}>
            {isEditing ? 'Update Decoder' : 'Create Decoder'}
          </Button>
        </div>
      </div>

      {/* Book Selection Modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title="Select Book"
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search books by title, author, or description..."
              value={bookSearchTerm}
              onChange={(e) => setBookSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loadingBooks ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
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
                      className="border rounded-lg p-3 cursor-pointer transition-colors hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleBookSelect(book.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{book.title}</h4>
                            {book.content_type && (
                              <Badge variant="outline" className="text-xs">
                                {book.content_type}
                              </Badge>
                            )}
                          </div>
                          {book.author && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">by {book.author}</p>
                          )}
                          {book.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{book.description}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookSelect(book.id);
                          }}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end border-t pt-4">
            <Button variant="outline" onClick={() => setShowBookModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Creation Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Create New Decoder Category"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g., Educational, Technical, etc."
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