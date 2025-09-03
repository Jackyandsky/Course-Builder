'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductListing from '@/components/products/ProductListing';

interface TransformedProduct {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  currency: string;
  discount_percentage: number;
  sale_price: number | null;
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

// Cache key and duration constants
const CACHE_KEY = 'store_products_cache';
const STATE_KEY = 'store-page-state';
const SCROLL_KEY = 'store-scroll-position';
const CACHE_DURATION = 300000; // 5 minutes cache for store products

// Utility: Get cached products with TTL
const getCachedProducts = (): { products: TransformedProduct[], pagination: PaginationInfo } | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age > CACHE_DURATION) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

// Utility: Save to cache
const setCachedProducts = (products: TransformedProduct[], pagination: PaginationInfo) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data: { products, pagination },
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to cache products:', error);
  }
};

// Utility: Fetch with timeout
const fetchWithTimeout = async (url: string, timeout = 5000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Default pagination state
const DEFAULT_PAGINATION: PaginationInfo = {
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  pageSize: 24
};

export default function StorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from sessionStorage or URL params
  const getInitialState = useCallback(() => {
    // Check sessionStorage first (only on client side)
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem(STATE_KEY);
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
  }, [searchParams]);

  const initialState = useMemo(() => getInitialState(), [getInitialState]);
  
  // Initialize with cached data for instant UI
  const cachedData = useMemo(() => getCachedProducts(), []);
  
  const [products, setProducts] = useState<TransformedProduct[]>(
    cachedData?.products || []
  );
  const [loading, setLoading] = useState(false); // Start with false for instant UI
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(initialState.search);
  const [pagination, setPagination] = useState<PaginationInfo>(
    cachedData?.pagination || {
      ...DEFAULT_PAGINATION,
      currentPage: initialState.page,
      pageSize: initialState.pageSize
    }
  );
  const [initialCategory] = useState(initialState.category);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if we have cached data
  const hasCachedData = products.length > 0;

  // Request deduplication
  const requestInProgress = useMemo(() => new Map<string, Promise<any>>(), []);

  const loadProducts = useCallback(async (
    search: string = searchValue,
    page: number = pagination.currentPage,
    pageSize: number = pagination.pageSize,
    category?: string | null,
    forceRefresh: boolean = false
  ) => {
    const requestKey = `${search}-${page}-${pageSize}-${category}`;
    
    // Check if request is already in progress
    if (!forceRefresh && requestInProgress.has(requestKey)) {
      return requestInProgress.get(requestKey);
    }

    const loadPromise = async () => {
      try {
        setError(null);
        
        // Only show loading if no cached data
        if (!hasCachedData) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }
        
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        params.set('page', page.toString());
        params.set('pageSize', pageSize.toString());
        
        // If a specific category is selected, only load that category
        if (category && category !== 'all') {
          params.set('category', category);
        } else {
          // Otherwise load products from all store categories
          const categories = [
            'Standardizers',
            'Complete Study Packages',
            'Decoders',
            'LEX'
          ];
          categories.forEach(cat => params.append('categories', cat));
        }
        
        const response = await fetchWithTimeout(`/api/public/store-products?${params}`, 5000);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        
        const newPagination = {
          totalCount: data.totalCount,
          totalPages: data.totalPages,
          currentPage: data.currentPage,
          pageSize: data.pageSize
        };
        
        setProducts(data.products);
        setPagination(newPagination);
        
        // Cache the new data
        setCachedProducts(data.products, newPagination);

        // Save state to sessionStorage
        sessionStorage.setItem(STATE_KEY, JSON.stringify({
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
        
        const newURL = newParams.toString() ? `?${newParams.toString()}` : '/store';
        window.history.replaceState({}, '', newURL);
        
      } catch (error: any) {
        console.error('Error loading products:', error);
        
        // Only show error if no cached data
        if (!hasCachedData) {
          setError(error.message || 'Failed to load products');
          setProducts([]);
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
        requestInProgress.delete(requestKey);
      }
    };

    const promise = loadPromise();
    requestInProgress.set(requestKey, promise);
    return promise;
  }, [searchValue, pagination.currentPage, pagination.pageSize, hasCachedData, requestInProgress]);

  // Initial load - only if no cached data
  useEffect(() => {
    // If we have cached data, do background refresh
    if (hasCachedData) {
      // Background refresh after a short delay
      const timer = setTimeout(() => {
        loadProducts(initialState.search, initialState.page, initialState.pageSize, initialState.category);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // No cached data, load immediately
      loadProducts(initialState.search, initialState.page, initialState.pageSize, initialState.category);
    }
  }, []); // Empty deps for initial load only

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    loadProducts(value, 1, pagination.pageSize); // Reset to page 1 on search
  }, [pagination.pageSize, loadProducts]);

  const handlePageChange = useCallback((page: number) => {
    loadProducts(searchValue, page, pagination.pageSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchValue, pagination.pageSize, loadProducts]);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    loadProducts(searchValue, 1, pageSize); // Reset to page 1 on page size change
  }, [searchValue, loadProducts]);

  const handleCategoryChange = useCallback((category: string) => {
    loadProducts(searchValue, 1, pagination.pageSize, category);
  }, [searchValue, pagination.pageSize, loadProducts]);

  // Save scroll position before navigation
  const handleProductClick = useCallback((productId: string) => {
    sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    router.push(`/store/${productId}`);
  }, [router]);

  // Restore scroll position after navigation back
  useEffect(() => {
    const scrollPosition = sessionStorage.getItem(SCROLL_KEY);
    if (scrollPosition) {
      // Use requestAnimationFrame for smoother scroll restoration
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(scrollPosition));
        sessionStorage.removeItem(SCROLL_KEY);
      });
    }
  }, []);

  // Categories for the dropdown (only existing ones)
  const categories = useMemo(() => [
    'Standardizers',
    'Complete Study Packages',
    'Decoders',
    'LEX'
  ], []);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    if (!isRefreshing) {
      loadProducts(searchValue, pagination.currentPage, pagination.pageSize, initialCategory, true);
    }
  }, [searchValue, pagination.currentPage, pagination.pageSize, initialCategory, isRefreshing, loadProducts]);

  // Skeleton loader component
  const ProductSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200"></div>
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-20"></div>
          <div className="h-9 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );

  // Show skeleton loaders only if no cached data
  if (loading && !hasCachedData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64">
            <div className="h-10 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded mb-4 animate-pulse"></div>
          </div>
          
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error && !hasCachedData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load products</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Refresh indicator */}
      {isRefreshing && hasCachedData && (
        <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 z-50">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Refreshing...</span>
        </div>
      )}
      
      <ProductListing
        products={products}
        type="store"
        title="Store"
        subtitle={`Browse our collection of ${pagination.totalCount || 0} educational resources and study materials`}
        categories={categories}
        initialCategory={initialCategory || undefined}
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
        loading={loading && !hasCachedData}
        showRefresh={hasCachedData}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    </>
  );
}