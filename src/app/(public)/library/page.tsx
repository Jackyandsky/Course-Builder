'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ProductListing from '@/components/products/ProductListing';

interface TransformedBook {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  imageUrl: string | undefined;
  category: string;
  type: string;
}

export default function LibraryPage() {
  const [books, setBooks] = useState<TransformedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    loadBooks();
  }, [categoryParam]);

  // Reset books when loading
  useEffect(() => {
    setLoading(true);
  }, [categoryParam]);

  const loadBooks = async () => {
    try {
      // Join with categories table to get category information
      let query = supabase
        .from('books')
        .select(`
          *,
          category:categories!category_id(
            id,
            name,
            type
          )
        `)
        .eq('is_public', true);

      // For now, all books are considered virtual books
      // Physical books will be defined later

      const { data, error } = await query.order('title');

      if (error) throw error;

      // Transform books data to match ProductListing format
      const transformedBooks = data?.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author || 'Unknown Author',
        description: book.description?.substring(0, 200) + '...' || '',
        price: book.metadata?.price || 29.99, // Default price if not set
        imageUrl: book.cover_image_url || undefined,
        category: 'Virtual Library',
        type: 'library'
      })) || [];

      setBooks(transformedBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show both categories in the dropdown
  const categories = ['Virtual Library', 'Physical Library'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProductListing
      products={books}
      type="library"
      title="Library"
      subtitle="Explore our comprehensive collection of educational books and resources"
      categories={categories}
      initialCategory={categoryParam || undefined}
    />
  );
}