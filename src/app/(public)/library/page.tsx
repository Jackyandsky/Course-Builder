'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductListing from '@/components/products/ProductListing';

interface TransformedBook {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  currency: string;
  discount_percentage?: number;
  sale_price?: number;
  is_free: boolean;
  imageUrl: string | undefined;
  category: string;
  type: string;
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export default function LibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from sessionStorage or URL params
  const getInitialState = () => {
    // Check sessionStorage first (only on client side)
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('library-page-state');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          return {
            search: parsed.search || '',
            page: parsed.page || 1,
            pageSize: parsed.pageSize || 24,
            category: parsed.category
          };
        } catch (e) {
          console.error('Failed to parse saved state:', e);
        }
      }
    }
    
    // Fall back to URL params
    return {
      search: searchParams.get('search') || '',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '24'),
      category: searchParams.get('category')
    };
  };

  const initialState = getInitialState();
  
  const [books, setBooks] = useState<TransformedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState(initialState.search);
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: initialState.page,
    pageSize: initialState.pageSize
  });
  const [initialCategory] = useState(initialState.category);

  const loadBooks = useCallback(async (
    search: string = searchValue,
    page: number = pagination.currentPage,
    pageSize: number = pagination.pageSize,
    category?: string | null
  ) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      if (category) params.set('category', category);
      
      const response = await fetch(`/api/public/library-books?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      
      const data = await response.json();
      setBooks(data.books);
      setPagination({
        totalCount: data.totalCount,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        pageSize: data.pageSize
      });

      // Save state to sessionStorage
      sessionStorage.setItem('library-page-state', JSON.stringify({
        search,
        page,
        pageSize,
        category
      }));

      // Update URL without navigation
      const newParams = new URLSearchParams();
      if (search) newParams.set('search', search);
      if (page > 1) newParams.set('page', page.toString());
      if (pageSize !== 24) newParams.set('pageSize', pageSize.toString());
      if (category) newParams.set('category', category);
      
      const newURL = newParams.toString() ? `?${newParams.toString()}` : '/library';
      window.history.replaceState({}, '', newURL);
      
    } catch (error) {
      console.error('Error loading books:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [searchValue, pagination.currentPage, pagination.pageSize]);

  // Initial load - use saved state values
  useEffect(() => {
    loadBooks(initialState.search, initialState.page, initialState.pageSize, initialState.category);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    loadBooks(value, 1, pagination.pageSize); // Reset to page 1 on search
  }, [pagination.pageSize, loadBooks]);

  const handlePageChange = useCallback((page: number) => {
    loadBooks(searchValue, page, pagination.pageSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchValue, pagination.pageSize, loadBooks]);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    loadBooks(searchValue, 1, pageSize); // Reset to page 1 on page size change
  }, [searchValue, loadBooks]);

  const handleCategoryChange = useCallback((category: string) => {
    loadBooks(searchValue, 1, pagination.pageSize, category);
  }, [searchValue, pagination.pageSize, loadBooks]);

  // Save scroll position before navigation
  const handleProductClick = useCallback((productId: string) => {
    sessionStorage.setItem('library-scroll-position', window.scrollY.toString());
    router.push(`/library/${productId}`);
  }, [router]);

  // Restore scroll position after navigation back
  useEffect(() => {
    const scrollPosition = sessionStorage.getItem('library-scroll-position');
    if (scrollPosition) {
      window.scrollTo(0, parseInt(scrollPosition));
      sessionStorage.removeItem('library-scroll-position');
    }
  }, []);

  // Show both categories in the dropdown
  const categories = ['Virtual Library', 'Physical Library'];

  if (loading && books.length === 0) {
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
      subtitle={`Explore our comprehensive collection of ${pagination.totalCount} educational books and resources`}
      categories={categories}
      initialCategory={searchParams.get('category') || undefined}
      searchValue={searchValue}
      onSearch={handleSearch}
      onCategoryChange={handleCategoryChange}
      onProductClick={handleProductClick}
      pagination={{
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalCount,
        pageSize: pagination.pageSize,
        onPageChange: handlePageChange,
        onPageSizeChange: handlePageSizeChange
      }}
      loading={loading}
    />
  );
}