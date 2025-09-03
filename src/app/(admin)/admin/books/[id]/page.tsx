'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Globe, Lock, BookOpen, Users, Download, DollarSign, Calendar, FileText, Hash } from 'lucide-react';
import { Book, VocabularyGroup } from '@/types/database';
import { bookService } from '@/lib/supabase/books';
import { Button, Card, Badge, Modal, Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getSingletonSupabaseClient } from '@/lib/supabase-singleton';
import GoogleBooksSync from '@/components/books/GoogleBooksSync';

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = getSingletonSupabaseClient();
  const bookId = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vocabGroups, setVocabGroups] = useState<VocabularyGroup[]>([]);
  const [vocabGroupsLoading, setVocabGroupsLoading] = useState(false);

  useEffect(() => {
    if (bookId) {
      loadBook();
      loadVocabGroups();
    }
  }, [bookId]);

  const loadBook = async () => {
    setLoading(true);
    try {
      const data = await bookService.getBook(bookId);
      setBook(data);
    } catch (error) {
      console.error('Failed to load book:', error);
      router.push('/admin/books');
    } finally {
      setLoading(false);
    }
  };

  const loadVocabGroups = async () => {
    setVocabGroupsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vocabulary_group_books')
        .select(`
          vocabulary_group:vocabulary_groups(
            id,
            name,
            description,
            difficulty,
            language,
            target_language
          )
        `)
        .eq('book_id', bookId);

      if (error) throw error;
      
      const groups = data
        ?.map((item: any) => item.vocabulary_group)
        .filter(Boolean) as VocabularyGroup[] || [];
      
      setVocabGroups(groups);
    } catch (error) {
      console.error('Failed to load vocabulary groups:', error);
    } finally {
      setVocabGroupsLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await bookService.deleteBook(bookId);
      // Clear any saved state since the book is deleted
      sessionStorage.removeItem('books-list-state');
      router.push('/admin/books');
      router.refresh();
    } catch (error) {
      console.error('Failed to delete book:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
  const handleBackToBooks = () => {
    // Try to restore previous state from sessionStorage
    const savedState = sessionStorage.getItem('books-list-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        const params = new URLSearchParams();
        if (state.filters.page > 1) params.set('page', state.filters.page.toString());
        if (state.filters.search) params.set('search', state.filters.search);
        if (state.filters.author) params.set('author', state.filters.author);
        if (state.filters.categoryId) params.set('categoryId', state.filters.categoryId);
        if (state.filters.contentType) params.set('contentType', state.filters.contentType);
        if (state.filters.language) params.set('language', state.filters.language);
        
        const url = params.toString() ? `/admin/books?${params.toString()}` : '/admin/books';
        router.push(url);
        return;
      } catch (e) {
        console.error('Failed to restore state:', e);
      }
    }
    router.push('/admin/books');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToBooks}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Books
          </Button>
          <div className="flex items-center gap-2">
            <GoogleBooksSync
              bookId={bookId}
              bookTitle={book.title}
              bookAuthor={book.author}
              hasDescription={!!book.description}
              onSyncComplete={loadBook}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/books/${bookId}/edit`)}
              leftIcon={<Edit className="h-4 w-4" />}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete
            </Button>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={book.title} className="w-24 h-36 rounded-lg object-cover shadow-md" />
          ) : (
            <div className="w-24 h-36 rounded-lg bg-gray-200 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{book.title}</h1>
            {book.author && <p className="text-gray-600">by {book.author}</p>}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={book.is_public ? 'success' : 'secondary'} size="sm">
                {book.is_public ? 'Public' : 'Private'}
              </Badge>
              {book.category && (
                <Badge size="sm" style={{ backgroundColor: `${book.category.color}20`, color: book.category.color }}>
                  {book.category.name}
                </Badge>
              )}
              {book.is_free ? (
                <Badge variant="success">FREE</Badge>
              ) : book.discount_percentage && book.discount_percentage > 0 ? (
                <Badge variant="warning">
                  {book.discount_percentage}% OFF - {book.currency === 'CAD' ? 'CA$' : '$'}{book.sale_price?.toFixed(2)}
                </Badge>
              ) : (
                <Badge variant="outline" size="sm">
                  {book.currency === 'CAD' ? 'CA$' : '$'}{book.price?.toFixed(2)}
                </Badge>
              )}
            </div>
            
            {/* Simplified Book Details */}
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {(book as any).isbn && (
                <div>ISBN: {(book as any).isbn}</div>
              )}
              {(book as any).publisher && book.publication_year && (
                <div>{(book as any).publisher} • {book.publication_year}</div>
              )}
              {(book.language || book.content_type) && (
                <div>
                  {book.language && book.language.toUpperCase()}
                  {book.language && book.content_type && ' • '}
                  {book.content_type}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {book.description && (
            <Card>
              <Card.Header><h3 className="text-base font-semibold">Description</h3></Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600 dark:text-gray-400">{book.description}</p>
              </Card.Content>
            </Card>
          )}
          
          {/* Book Resources Section - PDF viewer, content preview, etc. */}
          {(book as any).file_url && (
            <Card className="overflow-hidden">
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Book Resources</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open((book as any).file_url, '_blank')}
                      leftIcon={<Download className="h-4 w-4" />}
                      size="sm"
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Content className="p-0">
                <div className="relative bg-gray-50 dark:bg-gray-900">
                  {(book as any).file_url.toLowerCase().includes('.pdf') ? (
                    // Embedded PDF viewer for PDF files
                    <div className="w-full" style={{ height: '600px' }}>
                      <iframe
                        src={`${(book as any).file_url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                        className="w-full h-full border-0"
                        title={`PDF Viewer - ${book.title}`}
                        loading="lazy"
                      >
                        <div className="flex flex-col items-center justify-center h-full p-8">
                          <FileText className="h-16 w-16 text-gray-400 mb-4" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Your browser cannot display this PDF.
                          </p>
                          <Button
                            variant="primary"
                            onClick={() => window.open((book as any).file_url, '_blank')}
                            leftIcon={<Download className="h-4 w-4" />}
                          >
                            Download PDF
                          </Button>
                        </div>
                      </iframe>
                    </div>
                  ) : (
                    // Fallback for non-PDF files
                    <div className="flex flex-col items-center justify-center py-16">
                      <FileText className="h-16 w-16 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Book resource available
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        {(book as any).file_url.split('.').pop()?.toUpperCase() || 'Book'} File
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => window.open((book as any).file_url, '_blank')}
                        leftIcon={<Download className="h-4 w-4" />}
                      >
                        Download Book
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>
          )}
          

        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Vocabulary Groups */}
          <Card>
            <Card.Header>
              <h3 className="text-base font-semibold">Vocabulary Groups</h3>
            </Card.Header>
            <Card.Content>
              {vocabGroupsLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : vocabGroups.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-gray-500 text-sm">No groups associated</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/books/${bookId}/edit`)}
                    className="mt-2"
                  >
                    Add Groups
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {vocabGroups.map((group) => (
                    <div
                      key={group.id}
                      className="border rounded p-2 hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => router.push(`/admin/vocabulary/groups/${group.id}`)}
                    >
                      <h4 className="font-medium text-sm line-clamp-1" title={group.name}>
                        {group.name}
                      </h4>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary">
                          {group.difficulty}
                        </Badge>
                        {group.language && group.target_language && (
                          <Badge variant="outline">
                            {group.language}→{group.target_language}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
          
          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <Card>
              <Card.Header><h3 className="text-base font-semibold">Tags</h3></Card.Header>
              <Card.Content>
                <div className="flex flex-wrap gap-1">
                  {book.tags.map((tag) => <Badge key={tag} size="sm">{tag}</Badge>)}
                </div>
              </Card.Content>
            </Card>
          )}
        </div>
      </div>
      
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Book"
        className="max-w-md"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete &quot;{book.title}&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete Book</Button>
        </div>
      </Modal>
    </div>
  );
}