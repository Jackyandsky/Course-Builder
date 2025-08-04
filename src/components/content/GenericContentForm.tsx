'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, Search } from 'lucide-react';
import { Content, CreateContentData, UpdateContentData, ContentData } from '@/types/content';
import { contentService } from '@/lib/supabase/content';
import { bookService } from '@/lib/supabase/books';
import { Book } from '@/types/database';
import { 
  Button, Card, Input, Textarea, Select, Badge, Modal, Spinner, Checkbox
} from '@/components/ui';

interface GenericContentFormProps {
  initialData?: Content;
  categoryName: string;
  categoryId: string;
}

export function GenericContentForm({ initialData, categoryName, categoryId }: GenericContentFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');

  const [formData, setFormData] = useState<{
    name: string;
    content: string;
    tags: string[];
    book_id: string | null;
    book_ids: string[];
    is_public: boolean;
    featured: boolean;
    status: string;
    content_data: ContentData;
  }>({
    name: initialData?.name || '',
    content: initialData?.content || '',
    tags: initialData?.tags || [],
    book_id: initialData?.book_id || null,
    book_ids: initialData?.content_books?.map(cb => cb.book_id) || 
              (initialData?.book_id ? [initialData.book_id] : []),
    is_public: initialData?.is_public || false,
    featured: initialData?.featured || false,
    status: initialData?.status || 'active',
    content_data: initialData?.content_data || { type: categorySlug } as ContentData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  // Category-specific fields
  const [specificFields, setSpecificFields] = useState<Record<string, any>>({
    usage_instructions: initialData?.content_data?.usage_instructions || '',
    package_contents: initialData?.content_data?.package_contents || [],
    duration_hours: initialData?.content_data?.duration_hours || '',
    level: initialData?.content_data?.level || 'intermediate',
    assessment_type: initialData?.content_data?.assessment_type || '',
    passing_score: initialData?.content_data?.passing_score || '',
  });

  const loadBooks = useCallback(async () => {
    setLoadingBooks(true);
    try {
      const data = await bookService.getBooks({ limit: 1000 });
      setBooks(data);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Build content_data based on category type
      const contentData: ContentData = {
        type: categorySlug,
        ...specificFields,
      };

      const { book_id, ...formDataWithoutBookId } = formData;
      
      const data = {
        ...formDataWithoutBookId,
        content_data: contentData,
        category_id: categoryId,
        book_ids: formData.book_ids, // Use book_ids for multiple books
      };
      
      if (isEditing) {
        await contentService.updateContent({ id: initialData.id, ...data } as UpdateContentData);
      } else {
        await contentService.createContent(data as CreateContentData);
      }
      
      router.push(`/admin/${categorySlug}`);
      router.refresh();
    } catch (error: any) {
      console.error('Failed to save content:', error);
      setErrors({ submit: error.message || 'Failed to save content. Please try again.' });
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

  const selectedBooks = books.filter(book => formData.book_ids.includes(book.id));
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
    (book.author && book.author.toLowerCase().includes(bookSearchTerm.toLowerCase()))
  );

  const handleBookToggle = (bookId: string) => {
    setFormData(prev => ({
      ...prev,
      book_ids: prev.book_ids.includes(bookId)
        ? prev.book_ids.filter(id => id !== bookId)
        : [...prev.book_ids, bookId]
    }));
  };

  const handleRemoveBook = (bookId: string) => {
    setFormData(prev => ({
      ...prev,
      book_ids: prev.book_ids.filter(id => id !== bookId)
    }));
  };

  // Render category-specific fields
  const renderCategoryFields = () => {
    switch (categorySlug) {
      case 'decoders':
        return (
          <Card>
            <Card.Header><h2 className="text-lg font-semibold">Decoder Details</h2></Card.Header>
            <Card.Content>
              <Textarea
                label="Usage Instructions"
                value={specificFields.usage_instructions}
                onChange={(e) => setSpecificFields({ ...specificFields, usage_instructions: e.target.value })}
                placeholder="Provide detailed instructions on how to use this decoder"
                rows={6}
              />
            </Card.Content>
          </Card>
        );
      
      case 'complete-study-packages':
        return (
          <Card>
            <Card.Header><h2 className="text-lg font-semibold">Package Details</h2></Card.Header>
            <Card.Content className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Duration (hours)"
                  type="number"
                  value={specificFields.duration_hours}
                  onChange={(e) => setSpecificFields({ ...specificFields, duration_hours: e.target.value })}
                  placeholder="e.g., 40"
                />
                <Select
                  label="Level"
                  value={specificFields.level}
                  onChange={(e) => setSpecificFields({ ...specificFields, level: e.target.value })}
                  options={[
                    { value: 'beginner', label: 'Beginner' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'advanced', label: 'Advanced' },
                    { value: 'expert', label: 'Expert' },
                  ]}
                />
              </div>
              {/* Add package contents management here */}
            </Card.Content>
          </Card>
        );
      
      case 'standardizers':
        return (
          <Card>
            <Card.Header><h2 className="text-lg font-semibold">Standardizer Details</h2></Card.Header>
            <Card.Content className="space-y-4">
              <Input
                label="Assessment Type"
                value={specificFields.assessment_type}
                onChange={(e) => setSpecificFields({ ...specificFields, assessment_type: e.target.value })}
                placeholder="e.g., Quiz, Exam, Practice Test"
              />
              <Input
                label="Passing Score (%)"
                type="number"
                value={specificFields.passing_score}
                onChange={(e) => setSpecificFields({ ...specificFields, passing_score: e.target.value })}
                placeholder="e.g., 80"
                min="0"
                max="100"
              />
            </Card.Content>
          </Card>
        );
      
      default:
        return null;
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
          {isEditing ? `Edit ${categoryName.slice(0, -1)}` : `Create New ${categoryName.slice(0, -1)}`}
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
            <div className="space-y-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                placeholder={`Enter ${categoryName.slice(0, -1).toLowerCase()} name`}
                required
              />
              <Textarea
                label="Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={`Enter the main content for this ${categoryName.slice(0, -1).toLowerCase()}`}
                rows={3}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_public}
                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Make publicly accessible
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Featured content
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Associated Books (Optional)</h2></Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {selectedBooks.length > 0 && (
                  <div className="space-y-2">
                    {selectedBooks.map((book, index) => (
                      <div key={book.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {index === 0 && <span className="text-blue-600 text-sm mr-2">[Primary]</span>}
                            {book.title}
                          </h4>
                          {book.author && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">by {book.author}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBook(book.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBookModal(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="w-full"
                >
                  Add Books
                </Button>
                <p className="text-sm text-gray-500">
                  You can associate multiple books with this content. The first book will be marked as primary.
                </p>
              </div>
            </Card.Content>
          </Card>

        {renderCategoryFields()}

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
          <Button type="button" variant="outline" onClick={() => router.push(`/admin/${categorySlug}`)}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} leftIcon={<Save className="h-4 w-4" />}>
            {isEditing ? 'Update' : 'Create'} {categoryName.slice(0, -1)}
          </Button>
        </div>
      </div>

      {/* Book Selection Modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title="Select Books"
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search books..."
              value={bookSearchTerm}
              onChange={(e) => setBookSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="text-sm text-gray-600">
            Selected: {formData.book_ids.length} book{formData.book_ids.length !== 1 ? 's' : ''}
          </div>

          {loadingBooks ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {filteredBooks.map((book) => {
                  const isSelected = formData.book_ids.includes(book.id);
                  const isPrimary = formData.book_ids[0] === book.id;
                  
                  return (
                    <div
                      key={book.id}
                      className={`border rounded-lg p-3 transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleBookToggle(book.id)}
                          className="mt-1 mr-3"
                        />
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleBookToggle(book.id)}
                        >
                          <h4 className="font-medium">
                            {isPrimary && <span className="text-blue-600 text-sm mr-2">[Primary]</span>}
                            {book.title}
                          </h4>
                          {book.author && (
                            <p className="text-sm text-gray-600">by {book.author}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowBookModal(false);
                setBookSearchTerm('');
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}