'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BookForm } from '@/components/books/BookForm';
import { bookService } from '@/lib/supabase/books';
import { Spinner } from '@/components/ui';
import { Book } from '@/types/database';

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBook = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookService.getBook(bookId);
      setBook(data);
    } catch (error) {
      console.error('Failed to load book:', error);
      router.push('/admin/books');
    } finally {
      setLoading(false);
    }
  }, [bookId, router]);

  useEffect(() => {
    if (bookId) {
      loadBook();
    }
  }, [bookId, loadBook]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return <BookForm initialData={book} />;
}