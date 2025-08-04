'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Globe, Lock, BookOpen, Users } from 'lucide-react';
import { Book, VocabularyGroup } from '@/types/database';
import { bookService } from '@/lib/supabase/books';
import { Button, Card, Badge, Modal, Spinner } from '@/components/ui';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();
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
      router.push('/admin/books');
      router.refresh();
    } catch (error) {
      console.error('Failed to delete book:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/books')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          Back to Books
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-6">
            {book.cover_image_url ? (
              <img src={book.cover_image_url} alt={book.title} className="w-40 h-56 rounded-lg object-cover shadow-lg" />
            ) : (
              <div className="w-40 h-56 rounded-lg bg-gray-200 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{book.title}</h1>
              {book.author && <p className="text-lg text-gray-600 mt-1">by {book.author}</p>}
              <div className="flex items-center gap-3 mt-4">
                <Badge variant={book.is_public ? 'success' : 'secondary'}>
                  {book.is_public ? <Globe className="h-4 w-4 mr-1.5" /> : <Lock className="h-4 w-4 mr-1.5" />}
                  {book.is_public ? 'Public' : 'Private'}
                </Badge>
                {book.category && (
                  <Badge style={{ backgroundColor: `${book.category.color}20`, color: book.category.color }}>
                    {book.category.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/books/${bookId}/edit`)}
              leftIcon={<Edit className="h-4 w-4" />}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
              leftIcon={<Trash2 className="h-4 w-4" />}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <Card.Header><h2 className="text-lg font-semibold">Description</h2></Card.Header>
          <Card.Content>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {book.description || <p className="text-gray-500 italic">No description provided.</p>}
            </div>
          </Card.Content>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <Card.Header><h2 className="text-lg font-semibold">Details</h2></Card.Header>
              <Card.Content>
                <dl className="space-y-3 text-sm">
                    {book.publisher && <div><dt className="font-medium text-gray-500">Publisher</dt><dd>{book.publisher}</dd></div>}
                    {book.publication_year && <div><dt className="font-medium text-gray-500">Year</dt><dd>{book.publication_year}</dd></div>}
                    {book.language && <div><dt className="font-medium text-gray-500">Language</dt><dd className="uppercase">{book.language}</dd></div>}
                    {book.content_type && <div><dt className="font-medium text-gray-500">Content Type</dt><dd className="capitalize">{book.content_type}</dd></div>}
                </dl>
              </Card.Content>
            </Card>
            {book.tags && book.tags.length > 0 && (
                 <Card>
                   <Card.Header><h2 className="text-lg font-semibold">Tags</h2></Card.Header>
                   <Card.Content>
                     <div className="flex flex-wrap gap-2">
                       {book.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
                     </div>
                   </Card.Content>
                 </Card>
            )}
        </div>

        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Related Vocabulary Groups</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Vocabulary groups that contain words from this book
            </p>
          </Card.Header>
          <Card.Content>
            {vocabGroupsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : vocabGroups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No vocabulary groups are associated with this book.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/books/${bookId}/edit`)}
                  className="mt-3"
                >
                  Add Vocabulary Groups
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {vocabGroups.map((group) => (
                  <div
                    key={group.id}
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/admin/vocabulary/groups/${group.id}`)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-2 flex-1" title={group.name}>
                          {group.name}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
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
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2" title={group.description}>
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
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