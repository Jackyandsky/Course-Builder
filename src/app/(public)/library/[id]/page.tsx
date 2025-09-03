'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSingletonSupabaseClient } from '@/lib/supabase-singleton';
import ProductDetail from '@/components/products/ProductDetail';

export default function LibraryBookDetailPage() {
  const params = useParams();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSingletonSupabaseClient();

  useEffect(() => {
    if (params.id) {
      loadBook(params.id as string);
    }
  }, [params.id]);

  const loadBook = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          category:categories!category_id(
            id,
            name,
            type
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setBook(data);
    } catch (error) {
      console.error('Error loading book:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Book not found</h2>
          <p className="text-gray-600">The book you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Parse features if stored as JSON or string
  let features = [];
  if (book.features) {
    try {
      features = typeof book.features === 'string' ? JSON.parse(book.features) : book.features;
    } catch {
      features = [book.features];
    }
  }

  return (
    <ProductDetail
      id={book.id}
      title={book.title}
      author={book.author}
      description={book.description}
      longDescription={book.long_description || book.description}
      price={book.metadata?.price || book.price || 29.99}
      imageUrl={book.cover_image_url}
      category={book.category?.name === 'Virtual' ? 'Virtual Library' : book.category?.name || 'Virtual Library'}
      type="library"
      isbn={book.isbn}
      publisher={book.publisher}
      publishDate={book.publication_year ? book.publication_year.toString() : undefined}
      pages={book.total_pages}
      language={book.language || 'English'}
      features={features}
      rating={book.rating}
      reviewCount={book.review_count}
    />
  );
}