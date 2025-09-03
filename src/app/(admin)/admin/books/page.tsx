'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, Search, Filter, BookOpen, FileText, Video, 
  Headphones, Image as ImageIcon, Gamepad2, Grid, List, Upload, DollarSign, RefreshCw 
} from 'lucide-react';
import { Book, ContentType } from '@/types/database';
import { bookService, BookFilters } from '@/lib/supabase/books';
import { categoryService } from '@/lib/supabase/categories';
import { 
  Button, Card, Badge, SearchBox, Spinner, Select, Pagination,
  BookCardSkeleton, BookListItemSkeleton, StatsCardSkeleton
} from '@/components/ui';
import { BookImportModal } from '@/components/books/BookImportModal';
import { BatchSyncModal } from '@/components/books/BatchSyncModal';
import { cn } from '@/lib/utils';

const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  audio: <Headphones className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  interactive: <Gamepad2 className="h-4 w-4" />,
};

const contentTypeColors: Record<ContentType, string> = {
  text: 'default',
  pdf: 'danger',
  video: 'primary',
  audio: 'warning',
  image: 'success',
  interactive: 'info',
};

export default function BooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  
  // Initialize filters from URL params or localStorage
  const initializeFilters = useCallback((): BookFilters => {
    // First try URL params
    const urlFilters: BookFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '21'),
      search: searchParams.get('search') || undefined,
      author: searchParams.get('author') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      contentType: searchParams.get('contentType') as ContentType || undefined,
      language: searchParams.get('language') || undefined,
      publicationYear: searchParams.get('publicationYear') ? parseInt(searchParams.get('publicationYear')!) : undefined,
      isPublic: searchParams.get('isPublic') ? searchParams.get('isPublic') === 'true' : undefined,
    };

    // If no URL params, try localStorage
    if (!searchParams.toString()) {
      try {
        const saved = localStorage.getItem('books-page-state');
        if (saved) {
          const savedFilters = JSON.parse(saved);
          return { ...savedFilters, page: 1 }; // Reset to page 1 for fresh visits
        }
      } catch (error) {
        console.warn('Failed to parse saved filters:', error);
      }
    }

    return urlFilters.search || urlFilters.author || urlFilters.categoryId || (urlFilters.page && urlFilters.page > 1) 
      ? urlFilters 
      : { page: 1, pageSize: 21 };
  }, [searchParams]);

  const [filters, setFilters] = useState<BookFilters>(initializeFilters);
  const [searchValue, setSearchValue] = useState<string>(initializeFilters().search || '');
  const [paginationInfo, setPaginationInfo] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 21
  });
  const [stats, setStats] = useState({
    total: 0,
    text: 0,
    video: 0,
    audio: 0,
    pdf: 0,
    image: 0,
    interactive: 0,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [authors, setAuthors] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // State to control the visibility of the filter panel
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBatchSyncModal, setShowBatchSyncModal] = useState(false);

  // Navigate to book detail - simplified without returnUrl
  const navigateToBook = useCallback((bookId: string) => {
    router.push(`/admin/books/${bookId}`);
  }, [router]);

  // Save current state to sessionStorage before navigation
  const saveCurrentState = useCallback(() => {
    try {
      sessionStorage.setItem('books-list-state', JSON.stringify({
        filters,
        searchValue,
        scrollPosition: window.scrollY
      }));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }, [filters, searchValue]);

  // Update URL and localStorage when filters change - fully async
  const updateURLAndStorage = useCallback((newFilters: BookFilters) => {
    // Defer URL and storage updates to avoid blocking
    queueMicrotask(() => {
      const params = new URLSearchParams();
      
      if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
      if (newFilters.pageSize && newFilters.pageSize !== 21) params.set('pageSize', newFilters.pageSize.toString());
      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.author) params.set('author', newFilters.author);
      if (newFilters.categoryId) params.set('categoryId', newFilters.categoryId);
      if (newFilters.contentType) params.set('contentType', newFilters.contentType);
      if (newFilters.language) params.set('language', newFilters.language);
      if (newFilters.publicationYear) params.set('publicationYear', newFilters.publicationYear.toString());
      if (newFilters.isPublic !== undefined) params.set('isPublic', newFilters.isPublic.toString());

      const newURL = params.toString() ? `?${params.toString()}` : '/admin/books';
      
      // Update URL in next animation frame
      requestAnimationFrame(() => {
        window.history.replaceState({}, '', newURL);
      });

      // Defer localStorage update to idle time
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          try {
            const storageData = JSON.stringify(newFilters);
            if (storageData.length < 5000000) {
              localStorage.setItem('books-page-state', storageData);
            }
          } catch (error) {
            console.warn('Failed to save filters to localStorage:', error);
          }
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          try {
            const storageData = JSON.stringify(newFilters);
            if (storageData.length < 5000000) {
              localStorage.setItem('books-page-state', storageData);
            }
          } catch (error) {
            console.warn('Failed to save filters to localStorage:', error);
          }
        }, 0);
      }
    });
  }, []);

  const hasInitialized = useRef(false);
  
  useEffect(() => {
    // Prevent multiple initialization calls
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    let mounted = true;
    
    // Load data in parallel for best performance
    const init = async () => {
      if (mounted) {
        try {
          console.log('Starting initialization - loading stats and books');
          
          // Start both operations in parallel
          const [_, __] = await Promise.all([
            loadInitialData().catch(err => {
              console.error('Failed to load initial data:', err);
            }),
            loadBooks(filters).catch(err => {
              console.error('Failed to load books:', err);
            })
          ]);
          
        } catch (error) {
          console.error('Initialization error:', error);
        } finally {
          // Ensure loading is false even on error
          if (mounted) {
            setLoading(false);
          }
        }
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  // Create stable abort controller reference
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadBooks = useCallback(async (currentFilters: BookFilters, isPagination = false, isSearch = false) => {
    // Only cancel if it's a search operation (user typing)
    if (isSearch && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for search operations
    if (isSearch) {
      abortControllerRef.current = new AbortController();
    }
    const signal = isSearch ? abortControllerRef.current?.signal : undefined;
    
    // Set a maximum timeout for loading states
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      setSearchLoading(false);
      setPaginationLoading(false);
    }, 5000); // 5 second maximum
    
    try {
      if (isSearch) {
        setSearchLoading(true);
      } else if (isPagination) {
        setPaginationLoading(true);
      } else {
        setLoading(true);
      }
      
      const result = await bookService.getBooksWithCount(currentFilters);
      
      if (!signal || !signal.aborted) {
        setBooks(result.books || []);
        setPaginationInfo({
          totalCount: result.totalCount || 0,
          totalPages: result.totalPages || 0,
          currentPage: result.currentPage || 1,
          pageSize: result.pageSize || 21
        });
      }
    } catch (error: any) {
      if (!signal || !signal.aborted) {
        console.error('Failed to load books:', error);
        // Set empty data on error to prevent UI blocking
        setBooks([]);
        setPaginationInfo({
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: 21
        });
      }
    } finally {
      clearTimeout(loadingTimeout);
      if (!signal || !signal.aborted) {
        setLoading(false);
        setSearchLoading(false);
        setPaginationLoading(false);
      }
    }
  }, []);

  // Track if initial load is complete to prevent duplicate calls
  const initialLoadRef = useRef(false);
  
  // Single effect for all filter changes except search
  useEffect(() => {
    // Skip if initial load hasn't completed
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      return;
    }
    
    const timer = setTimeout(() => {
      loadBooks(filters, filters.page !== 1, false);
    }, 100); // Small debounce to batch rapid changes
    
    return () => clearTimeout(timer);
  }, [filters.author, filters.categoryId, filters.contentType, filters.language, 
      filters.publicationYear, filters.tags, filters.isPublic, filters.pageSize, 
      filters.missingDescription, filters.missingAuthor, filters.missingCover, 
      filters.missingPublisher, filters.missingYear, filters.missingISBN, 
      filters.missingLanguage, filters.page, loadBooks]);
  
  // Separate effect for search with longer debouncing
  useEffect(() => {
    if (filters.search === undefined || !initialLoadRef.current) return;
    
    const timer = setTimeout(() => {
      loadBooks(filters, false, true);
    }, 500); // Increased debounce for search
    
    return () => clearTimeout(timer);
  }, [filters.search, loadBooks]);

  const loadInitialData = useCallback(async () => {
    try {
      console.log('loadInitialData: Starting to load stats and other data');
      
      // Load each piece of data independently with its own error handling
      // This prevents one failure from affecting others
      const [authorsData, languagesData, categoriesData, statsData] = await Promise.all([
        bookService.getAuthors().catch((error) => {
          console.error('Failed to load authors:', error);
          return [];
        }),
        bookService.getLanguages().catch((error) => {
          console.error('Failed to load languages:', error);
          return [];
        }),
        categoryService.getCategories({ type: 'book' }).catch((error) => {
          console.error('Failed to load categories:', error);
          return [];
        }),
        bookService.getBookStats().catch((error) => {
          console.error('Failed to load stats:', error);
          return { total: 0, text: 0, video: 0, audio: 0, pdf: 0, image: 0, interactive: 0 };
        })
      ]);
      
      console.log('loadInitialData: All data loaded. Stats data:', statsData);
      
      // Set the data even if some calls failed
      setAuthors(authorsData);
      setLanguages(languagesData);
      setCategories(categoriesData);
      
      // Always set stats data - even if it's zeros
      console.log('Setting stats in loadInitialData:', statsData);
      setStats(statsData);
      
    } catch (error) {
      console.error('Critical error in loadInitialData:', error);
      // Set default values on critical error
      setAuthors([]);
      setLanguages([]);
      setCategories([]);
      setStats({ total: 0, text: 0, video: 0, audio: 0, pdf: 0, image: 0, interactive: 0 });
    }
  }, []);


  const handleSearch = useCallback((search: string) => {
    // Defer state updates to next tick
    queueMicrotask(() => {
      const newFilters = { ...filters, search: search || undefined, page: 1 };
      setFilters(newFilters);
      updateURLAndStorage(newFilters);
    });
  }, [filters, updateURLAndStorage]);
  
  const handleSearchInputChange = useCallback((value: string) => {
    // Immediate update for UI responsiveness
    setSearchValue(value);
  }, []);

  const handleFilterChange = useCallback((filterId: string, value: any) => {
    // Batch filter updates using microtask
    queueMicrotask(() => {
      const newFilters = { ...filters, [filterId]: value, page: 1 };
      setFilters(newFilters);
      updateURLAndStorage(newFilters);
    });
  }, [filters, updateURLAndStorage]);

  const handlePageChange = useCallback((page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateURLAndStorage(newFilters);
    // loadBooks will be triggered by the useEffect watching filters.page
  }, [filters, updateURLAndStorage]);

  const handleImportComplete = useCallback(() => {
    // Run in parallel, non-blocking
    Promise.all([
      loadBooks(filters),
      loadInitialData()
    ]).catch(error => {
      console.error('Failed to refresh after import:', error);
    });
  }, [filters, loadBooks, loadInitialData]);

  const contentTypes = useMemo(() => bookService.getContentTypes(), []);
  
  // Memoize processed books to avoid re-computation on every render
  const processedBooks = useMemo(() => {
    return books.map(book => ({
      ...book,
      vocabGroups: book.vocabulary_group_books?.map(vgb => vgb.vocabulary_group).filter(Boolean) || []
    }));
  }, [books]);

  const filterGroups = useMemo(() => [
    {
      id: 'missing',
      label: 'Missing Fields',
      type: 'group' as const,
      filters: [
        { id: 'missingDescription', label: 'Missing Description', type: 'checkbox' as const },
        { id: 'missingAuthor', label: 'Missing Author', type: 'checkbox' as const },
        { id: 'missingCover', label: 'Missing Cover', type: 'checkbox' as const },
        { id: 'missingPublisher', label: 'Missing Publisher', type: 'checkbox' as const },
        { id: 'missingYear', label: 'Missing Year', type: 'checkbox' as const },
        { id: 'missingISBN', label: 'Missing ISBN', type: 'checkbox' as const },
        { id: 'missingLanguage', label: 'Missing Language', type: 'checkbox' as const },
      ],
    },
    {
      id: 'contentType',
      label: 'Content Type',
      type: 'checkbox' as const,
      options: contentTypes.map(type => ({
        value: type.value,
        label: type.label,
        icon: contentTypeIcons[type.value],
      })),
    },
    {
      id: 'author',
      label: 'Author',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Authors' },
        ...authors.map(author => ({ value: author, label: author })),
      ],
    },
    {
      id: 'language',
      label: 'Language',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Languages' },
        ...languages.map(lang => ({ value: lang, label: lang.toUpperCase() })),
      ],
    },
    {
      id: 'categoryId',
      label: 'Category',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Categories' },
        ...categories.map(cat => ({ value: cat.id, label: cat.name })),
      ],
    },
    {
      id: 'isPublic',
      label: 'Visibility',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Books' },
        { value: 'true', label: 'Public Only' },
        { value: 'false', label: 'Private Only' },
      ],
    },
  ], [contentTypes, authors, languages, categories]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Book Library</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your books and learning materials
            {paginationInfo.totalCount > 0 && (
              <span className="ml-2">
                ({paginationInfo.totalCount} total books)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
            <Select
              value={filters.pageSize?.toString() || '21'}
              onChange={(e) => {
                const newFilters = { ...filters, pageSize: parseInt(e.target.value), page: 1 };
                setFilters(newFilters);
                updateURLAndStorage(newFilters);
              }}
              className="w-24"
            >
              <option value="7">7</option>
              <option value="14">14</option>
              <option value="21">21</option>
              <option value="42">42</option>
              <option value="63">63</option>
            </Select>
          </div>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded",
                viewMode === 'grid'
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded",
                viewMode === 'list'
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowBatchSyncModal(true)}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Batch Sync
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            Import
          </Button>
          <Button
            onClick={() => router.push('/admin/books/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Book
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {stats.total}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
            </Card>
            {Object.entries(contentTypeIcons).slice(0, 5).map(([type, icon]) => (
              <Card key={type} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                      {type}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {stats[type as keyof typeof stats] || 0}
                    </p>
                  </div>
                  <div className="text-gray-400">{icon}</div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="max-w-2xl relative">
            <SearchBox
              placeholder="Search books..."
              value={searchValue}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onSearch={handleSearch}
              fullWidth
              debounceDelay={500}
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
            {Object.keys(filters).filter(k => filters[k as keyof BookFilters] && k !== 'page' && k !== 'pageSize').length > 0 && (
              <span className="ml-1 bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">
                {Object.keys(filters).filter(k => filters[k as keyof BookFilters] && k !== 'page' && k !== 'pageSize').length}
              </span>
            )}
          </Button>
        </div>

        {isFilterPanelOpen && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="space-y-4">
              {/* Missing Fields Filter Group */}
              <div>
                <h3 className="text-sm font-medium mb-3">Missing Fields</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'missingDescription', label: 'Description' },
                    { id: 'missingAuthor', label: 'Author' },
                    { id: 'missingCover', label: 'Cover Image' },
                    { id: 'missingPublisher', label: 'Publisher' },
                    { id: 'missingYear', label: 'Year' },
                    { id: 'missingISBN', label: 'ISBN' },
                    { id: 'missingLanguage', label: 'Language' },
                  ].map(field => (
                    <label key={field.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters[field.id as keyof BookFilters] as boolean || false}
                        onChange={(e) => handleFilterChange(field.id, e.target.checked || undefined)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Missing {field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Standard Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Author</label>
                  <Select
                    value={filters.author || ''}
                    onChange={(e) => handleFilterChange('author', e.target.value || undefined)}
                    className="w-full"
                  >
                    <option value="">All Authors</option>
                    {authors.map(author => (
                      <option key={author} value={author}>{author}</option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select
                    value={filters.categoryId || ''}
                    onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                    className="w-full"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Language</label>
                  <Select
                    value={filters.language || ''}
                    onChange={(e) => handleFilterChange('language', e.target.value || undefined)}
                    className="w-full"
                  >
                    <option value="">All Languages</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Visibility</label>
                  <Select
                    value={filters.isPublic !== undefined ? filters.isPublic.toString() : ''}
                    onChange={(e) => handleFilterChange('isPublic', e.target.value ? e.target.value === 'true' : undefined)}
                    className="w-full"
                  >
                    <option value="">All Books</option>
                    <option value="true">Public Only</option>
                    <option value="false">Private Only</option>
                  </Select>
                </div>
              </div>
              
              {/* Content Type Filters */}
              <div>
                <h3 className="text-sm font-medium mb-3">Content Type</h3>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map(type => (
                    <label key={type.value} className="flex items-center space-x-2 cursor-pointer px-3 py-1.5 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="contentType"
                        checked={filters.contentType === type.value}
                        onChange={(e) => handleFilterChange('contentType', e.target.checked ? type.value : undefined)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex items-center gap-1 text-sm">
                        {contentTypeIcons[type.value]}
                        {type.label}
                      </span>
                    </label>
                  ))}
                  {filters.contentType && (
                    <button
                      onClick={() => handleFilterChange('contentType', undefined)}
                      className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              {/* Reset Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newFilters = { page: 1, pageSize: filters.pageSize || 24 };
                    setFilters(newFilters);
                    setSearchValue('');
                    updateURLAndStorage(newFilters);
                  }}
                >
                  Reset All Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results summary */}
        {!loading && books.length > 0 && (
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {((paginationInfo.currentPage - 1) * paginationInfo.pageSize) + 1} to{' '}
              {Math.min(paginationInfo.currentPage * paginationInfo.pageSize, paginationInfo.totalCount)} of{' '}
              {paginationInfo.totalCount} books
            </span>
            <span>
              Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
            </span>
          </div>
        )}
      </div>


      {/* Books Display */}
      <div className="relative">
        {paginationLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-10 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg flex items-center gap-3">
              <Spinner size="sm" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading page...</span>
            </div>
          </div>
        )}
        
        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
              {[...Array(21)].map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[...Array(12)].map((_, i) => (
                <BookListItemSkeleton key={i} />
              ))}
            </div>
          )
        ) : searchLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            {processedBooks.map((book) => {
              const vocabGroups = book.vocabGroups;
              return (
                <Card
                  key={book.id}
                  className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden opacity-60 animate-pulse"
                  onClick={() => {
                    saveCurrentState();
                    navigateToBook(book.id);
                  }}
                >
                  {book.cover_image_url ? (
                    <div className="h-32 overflow-hidden bg-gray-100">
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  <Card.Content className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                        {book.title}
                      </h3>
                      <Badge
                        variant={contentTypeColors[book.content_type] as any}
                        size="sm"
                        className="ml-1 text-xs"
                      >
                        {contentTypeIcons[book.content_type]}
                      </Badge>
                    </div>
                    
                    {book.author && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                        by {book.author}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500">
                        {book.publication_year && <span>{book.publication_year}</span>}
                        {book.publication_year && book.language && <span className="mx-1">•</span>}
                        {book.language && <span className="uppercase">{book.language}</span>}
                      </div>
                      <div className="text-xs font-semibold">
                        {book.is_free ? (
                          <Badge variant="success" >FREE</Badge>
                        ) : book.discount_percentage && book.discount_percentage > 0 ? (
                          <span className="text-green-600">
                            <span className="line-through text-gray-400 mr-1">
                              {book.currency === 'CAD' ? 'CA$' : '$'}{book.price?.toFixed(0)}
                            </span>
                            {book.currency === 'CAD' ? 'CA$' : '$'}{book.sale_price?.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">
                            {book.currency === 'CAD' ? 'CA$' : '$'}{book.price?.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {vocabGroups.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Vocabulary Groups ({vocabGroups.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {vocabGroups.slice(0, 2).map((group) => group && (
                            <Badge
                              key={group.id}
                              variant="outline"
                              className="text-xs px-1 py-0.5"
                              title={group.name}
                            >
                              {group.name.length > 12 ? `${group.name.substring(0, 12)}...` : group.name}
                            </Badge>
                          ))}
                          {vocabGroups.length > 2 && (
                            <Badge variant="outline" className="text-xs px-1 py-0.5">
                              +{vocabGroups.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {book.category && (
                      <div className="mt-2">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: book.category.color ? `${book.category.color}20` : undefined,
                            color: book.category.color || undefined,
                          }}
                        >
                          {book.category.name}
                        </span>
                      </div>
                    )}
                  </Card.Content>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {processedBooks.map((book) => {
              const vocabGroups = book.vocabGroups;
              return (
                <Card
                  key={book.id}
                  className="hover:shadow-md transition-shadow cursor-pointer opacity-60 animate-pulse"
                  onClick={() => {
                    saveCurrentState();
                    navigateToBook(book.id);
                  }}
                >
                  <Card.Content className="p-4">
                    <div className="flex items-start gap-4">
                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-20 h-28 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-28 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {book.title}
                            </h3>
                            {book.author && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                by {book.author}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {book.is_free ? (
                              <Badge variant="success">FREE</Badge>
                            ) : book.discount_percentage && book.discount_percentage > 0 ? (
                              <div className="text-right">
                                <p className="text-xs line-through text-gray-400">
                                  {book.currency === 'CAD' ? 'CA$' : '$'}{book.price?.toFixed(2)}
                                </p>
                                <p className="text-sm font-bold text-green-600">
                                  {book.currency === 'CAD' ? 'CA$' : '$'}{book.sale_price?.toFixed(2)}
                                </p>
                                <Badge variant="warning" >{book.discount_percentage}% OFF</Badge>
                              </div>
                            ) : (
                              <p className="text-sm font-semibold">
                                {book.currency === 'CAD' ? 'CA$' : '$'}{book.price?.toFixed(2)}
                              </p>
                            )}
                            <Badge
                              variant={contentTypeColors[book.content_type] as any}
                              size="sm"
                            >
                              {book.content_type}
                            </Badge>
                          </div>
                        </div>
                        
                        {book.description && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {book.description}
                          </p>
                        )}
                        
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          {book.publisher && <span>Publisher: {book.publisher}</span>}
                          {book.publication_year && <span>{book.publication_year}</span>}
                          {book.total_pages && <span>{book.total_pages} pages</span>}
                          {book.language && <span className="uppercase">{book.language}</span>}
                        </div>
                        
                        {vocabGroups.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Vocabulary Groups ({vocabGroups.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {vocabGroups.slice(0, 4).map((group) => group && (
                                <Badge
                                  key={group.id}
                                  variant="outline"
                                  className="text-xs"
                                  title={group.name}
                                >
                                  {group.name}
                                </Badge>
                              ))}
                              {vocabGroups.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{vocabGroups.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-3 flex items-center gap-2">
                          {book.category && (
                            <span
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: book.category.color ? `${book.category.color}20` : undefined,
                                color: book.category.color || undefined,
                              }}
                            >
                              {book.category.name}
                            </span>
                          )}
                          {book.tags && book.tags.length > 0 && (
                            <>
                              {book.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                >
                                  {tag}
                                </span>
                              ))}
                              {book.tags.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{book.tags.length - 3}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              );
            })}
          </div>
        )
      ) : books.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No books found</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start building your library by adding your first book.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push('/admin/books/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Book
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
          {processedBooks.map((book) => {
            const vocabGroups = book.vocabGroups;
            return (
              <Card
                key={book.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative h-48"
                onClick={() => {
                  saveCurrentState();
                  navigateToBook(book.id);
                }}
              >
                {/* Background Image */}
                {book.cover_image_url ? (
                  <img 
                    src={book.cover_image_url}
                    alt={book.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                
                {/* Content Container */}
                <div className="absolute inset-0 flex flex-col justify-end p-2">
                  {/* Title - Always Visible */}
                  <div className="mb-1">
                    <h3 className="text-xs font-bold text-white drop-shadow-lg line-clamp-2">
                      {book.title}
                    </h3>
                  </div>
                  
                  {/* Details - Slide up on hover */}
                  <div className="transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-black/70 backdrop-blur-sm -mx-2 -mb-2 p-2 rounded-t-lg">
                    {book.author && (
                      <p className="text-[10px] text-gray-200 mb-1 line-clamp-1">
                        {book.author}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] text-gray-300">
                        {book.publication_year && <span>{book.publication_year}</span>}
                      </div>
                      <div className="text-[10px] font-semibold">
                        {book.is_free ? (
                          <span className="text-green-400">FREE</span>
                        ) : book.discount_percentage && book.discount_percentage > 0 ? (
                          <span className="text-green-400">
                            ${book.sale_price?.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-white">
                            ${book.price?.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {book.category && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-white/80 text-gray-900">
                        {book.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {processedBooks.map((book) => {
            const vocabGroups = book.vocabGroups;
            return (
              <Card
                key={book.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  saveCurrentState();
                  navigateToBook(book.id);
                }}
              >
                <Card.Content className="p-4">
                  <div className="flex items-start gap-4">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-20 h-28 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {book.title}
                          </h3>
                          {book.author && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              by {book.author}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {book.is_free ? (
                            <Badge variant="success">FREE</Badge>
                          ) : book.discount_percentage && book.discount_percentage > 0 ? (
                            <div className="text-right">
                              <p className="text-xs line-through text-gray-400">
                                {book.currency === 'CAD' ? 'CA$' : '$'}{book.price?.toFixed(2)}
                              </p>
                              <p className="text-sm font-bold text-green-600">
                                {book.currency === 'CAD' ? 'CA$' : '$'}{book.sale_price?.toFixed(2)}
                              </p>
                              <Badge variant="warning" >{book.discount_percentage}% OFF</Badge>
                            </div>
                          ) : (
                            <p className="text-sm font-semibold">
                              {book.currency === 'CAD' ? 'CA$' : '$'}{book.price?.toFixed(2)}
                            </p>
                          )}
                          <Badge
                            variant={contentTypeColors[book.content_type] as any}
                            size="sm"
                          >
                            {book.content_type}
                          </Badge>
                        </div>
                      </div>
                      
                      {book.description && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {book.description}
                        </p>
                      )}
                      
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                        {book.publisher && <span>Publisher: {book.publisher}</span>}
                        {book.publication_year && <span>{book.publication_year}</span>}
                        {book.total_pages && <span>{book.total_pages} pages</span>}
                        {book.language && <span className="uppercase">{book.language}</span>}
                      </div>
                      
                      {vocabGroups.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Vocabulary Groups ({vocabGroups.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {vocabGroups.slice(0, 4).map((group) => group && (
                              <Badge
                                key={group.id}
                                variant="outline"
                                className="text-xs"
                                title={group.name}
                              >
                                {group.name}
                              </Badge>
                            ))}
                            {vocabGroups.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{vocabGroups.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center gap-2">
                        {book.category && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: book.category.color ? `${book.category.color}20` : undefined,
                              color: book.category.color || undefined,
                            }}
                          >
                            {book.category.name}
                          </span>
                        )}
                        {book.tags && book.tags.length > 0 && (
                          <>
                            {book.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {book.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{book.tags.length - 3}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
      </div>

      {/* Pagination */}
      {!loading && paginationInfo.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination
            currentPage={paginationInfo.currentPage}
            totalPages={paginationInfo.totalPages}
            onPageChange={handlePageChange}
            showFirstLast={true}
          />
        </div>
      )}

      <BookImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />
      
      <BatchSyncModal
        isOpen={showBatchSyncModal}
        onClose={() => setShowBatchSyncModal(false)}
        onSyncComplete={handleImportComplete}
      />
    </div>
  );
}