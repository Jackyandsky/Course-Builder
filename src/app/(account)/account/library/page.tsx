'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  BookOpen, FileText, Play, Download, Search, 
  Filter, Grid, List, Calendar, Star, Lock,
  ExternalLink, Eye, Clock, RefreshCw
} from 'lucide-react';
import { UserPurchase, ItemType } from '@/types/orders';
import Link from 'next/link';

interface LibraryItem extends UserPurchase {
  item?: {
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    cover_image_url?: string;
    author?: string;
    file_url?: string;
    content_type?: string;
    content?: string;
    difficulty?: string;
    duration_hours?: number;
    category_id?: string;
    categories?: {
      id: string;
      name: string;
      description?: string;
    };
  };
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'content' | 'book';

// Cache key and duration constants
const CACHE_KEY = 'account_library_purchases';
const CACHE_DURATION = 120000; // 2 minutes cache for library

// Utility: Get cached data with TTL
const getCachedPurchases = (): LibraryItem[] | null => {
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
const setCachedPurchases = (purchases: LibraryItem[]) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data: purchases,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to cache library purchases:', error);
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

// Skeleton loader components
const LibraryItemSkeleton = ({ viewMode }: { viewMode: ViewMode }) => {
  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
        <div className="aspect-video bg-gray-200"></div>
        <div className="p-4">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div className="h-9 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

const StatCardSkeleton = () => (
  <Card className="p-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-7 bg-gray-200 rounded w-8"></div>
      </div>
      <div className="h-5 w-5 bg-gray-200 rounded"></div>
    </div>
  </Card>
);

export default function MyLibraryPage() {
  const { user } = useAuth();
  
  // Initialize with cached data for instant UI
  const [purchases, setPurchases] = useState<LibraryItem[]>(() => {
    return getCachedPurchases() || [];
  });
  const [loading, setLoading] = useState(false); // Start with false for instant UI
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if we have cached data
  const hasCachedData = purchases.length > 0;

  useEffect(() => {
    // If no cached data, show loading
    if (!hasCachedData && user) {
      setLoading(true);
    }
    
    // Always fetch fresh data when user is available (background refresh if cached)
    if (user) {
      fetchUserPurchases();
    }
  }, [user]);

  const fetchUserPurchases = async () => {
    try {
      setError(null);
      
      // Only show refreshing indicator if we have cached data
      if (hasCachedData) {
        setIsRefreshing(true);
      }
      
      const response = await fetchWithTimeout('/api/account/library', 5000);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Don't redirect immediately - let user see cached data
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          return;
        }
        throw new Error('Failed to fetch library');
      }
      
      const data = await response.json();
      setPurchases(data.purchases || []);
      setCachedPurchases(data.purchases || []); // Cache the new data
    } catch (error: any) {
      console.error('Error fetching library:', error);
      
      // Only show error if no cached data
      if (!hasCachedData) {
        setError(error.message || 'Failed to load library');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Memoized filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase => {
      const matchesSearch = purchase.item?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           purchase.item?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           purchase.item?.author?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || purchase.item_type === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [purchases, searchTerm, filterType]);

  // Memoized stats
  const stats = useMemo(() => ({
    total: purchases.length,
    courses: purchases.filter(p => p.item_type === 'course').length,
    books: purchases.filter(p => p.item_type === 'book').length,
    active: purchases.filter(p => p.is_active).length
  }), [purchases]);

  const getItemIcon = (itemType: ItemType) => {
    switch (itemType) {
      case 'course':
        return <BookOpen className="h-5 w-5" />;
      case 'content':
        return <FileText className="h-5 w-5" />;
      case 'book':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getAccessBadge = (purchase: LibraryItem) => {
    if (!purchase.is_active) {
      return <Badge variant="danger" size="sm">Expired</Badge>;
    }
    
    if (purchase.access_type === 'lifetime') {
      return <Badge variant="success" size="sm">Lifetime</Badge>;
    }
    
    if (purchase.expiry_date) {
      const expiryDate = new Date(purchase.expiry_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 7) {
        return <Badge variant="warning" size="sm">Expires in {daysUntilExpiry} days</Badge>;
      }
      return <Badge variant="info" size="sm">Active</Badge>;
    }
    
    return <Badge variant="success" size="sm">Active</Badge>;
  };

  const getItemUrl = useCallback((purchase: LibraryItem) => {
    switch (purchase.item_type) {
      case 'course':
        return `/account/courses/${purchase.item_id}`;
      case 'content':
        return `/account/library/content/${purchase.item_id}`;
      case 'book':
        return `/account/library/book/${purchase.item_id}`;
      default:
        return '#';
    }
  }, []);

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Manual refresh function
  const handleRefresh = () => {
    if (!isRefreshing && user) {
      fetchUserPurchases();
    }
  };

  // Helper functions for content categorization
  const getSpecificCategoryLabel = useCallback((categoryName: string, title: string) => {
    const titleLower = title?.toLowerCase() || '';
    
    if (categoryName?.includes('Decoder')) {
      if (titleLower.includes('novel') || titleLower.includes('book')) return 'Novel Decoder';
      if (titleLower.includes('play') || titleLower.includes('drama')) return 'Drama Decoder';
      if (titleLower.includes('poem') || titleLower.includes('poetry')) return 'Poetry Decoder';
      if (titleLower.includes('short story')) return 'Short Story Decoder';
      return 'Literary Decoder';
    }
    if (categoryName?.includes('Complete Study')) {
      if (titleLower.includes('ap ')) return 'AP Study Package';
      if (titleLower.includes('ib ')) return 'IB Study Package';
      if (titleLower.includes('exam')) return 'Exam Prep Package';
      if (titleLower.includes('course')) return 'Course Study Package';
      return 'Complete Study Package';
    }
    if (categoryName?.includes('Standardizer')) {
      if (titleLower.includes('test')) return 'Test Standardizer';
      if (titleLower.includes('quiz')) return 'Quiz Standardizer';
      if (titleLower.includes('assessment')) return 'Assessment Tool';
      if (titleLower.includes('practice')) return 'Practice Standardizer';
      return 'Learning Standardizer';
    }
    return categoryName || 'Study Material';
  }, []);

  const getCategoryDescription = useCallback((categoryName: string, itemContent: string | undefined, isListView = false) => {
    // Extract first few lines of meaningful content
    if (itemContent) {
      const lines = itemContent.split('\n')
        .filter(line => line.trim() && !line.includes('━') && !line.includes('─') && !line.includes('='))
        .slice(0, isListView ? 3 : 4);
      if (lines.length > 0) {
        return lines.join(' ').substring(0, isListView ? 180 : 200) + '...';
      }
    }
    
    // Category-specific descriptions
    if (isListView) {
      if (categoryName?.includes('Decoder')) {
        return 'Literary analysis with plot summaries, character studies, themes, and critical perspectives for deeper understanding.';
      }
      if (categoryName?.includes('Complete Study')) {
        return 'Full study materials including syllabus, weekly readings, discussion prompts, and exam preparation resources.';
      }
      if (categoryName?.includes('Standardizer')) {
        return 'Standardized assessments with exercises, evaluation rubrics, and aligned learning objectives for progress tracking.';
      }
      return 'Educational content with structured materials and guided exercises for academic success.';
    } else {
      if (categoryName?.includes('Decoder')) {
        return 'Comprehensive literary analysis featuring detailed plot breakdowns, character development studies, and thematic explorations. Includes critical perspectives, symbolism analysis, and discussion questions for deeper understanding.';
      }
      if (categoryName?.includes('Complete Study')) {
        return 'Full semester study materials with structured syllabus, weekly reading schedules, and discussion prompts. Contains essay topics, exam preparation guides, vocabulary lists, and supplementary resources for mastery.';
      }
      if (categoryName?.includes('Standardizer')) {
        return 'Standardized assessment tools featuring progressive skill-building exercises and evaluation rubrics. Includes practice tests, answer keys, performance metrics, and aligned learning objectives for systematic progress.';
      }
      return 'Educational content designed to enhance learning through structured materials, guided exercises, and comprehensive assessments for academic success.';
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Library</h1>
            <p className="mt-1 text-sm text-gray-500">
              {loading && !hasCachedData ? (
                <span className="animate-pulse">Loading library...</span>
              ) : (
                <>Access all your purchased courses, books, and content</>
              )}
            </p>
          </div>
          {hasCachedData && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search your library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading && !hasCachedData}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              disabled={loading && !hasCachedData}
              className="border border-gray-300 rounded-lg px-4 py-2 min-w-[150px] focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="all">All Items</option>
              <option value="content">Study Materials</option>
              <option value="book">Books</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            disabled={loading && !hasCachedData}
            className={`p-2 rounded ${
              viewMode === 'grid'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            } disabled:opacity-50`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            disabled={loading && !hasCachedData}
            className={`p-2 rounded ${
              viewMode === 'list'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            } disabled:opacity-50`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {loading && !hasCachedData ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Courses</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.courses}</p>
              </div>
              <BookOpen className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Books</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.books}</p>
              </div>
              <BookOpen className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
              <Star className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Error Message */}
      {error && !hasCachedData && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchUserPurchases}
            className="text-sm font-medium underline mt-1"
          >
            Try again
          </button>
        </div>
      )}

      {/* Content Grid/List */}
      {loading && !hasCachedData ? (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }>
          <LibraryItemSkeleton viewMode={viewMode} />
          <LibraryItemSkeleton viewMode={viewMode} />
          <LibraryItemSkeleton viewMode={viewMode} />
        </div>
      ) : filteredPurchases.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? 'No matching items' : 'Your library is empty'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Purchase courses, books, or content to access them here'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Link href="/store">
                <Button variant="primary">Browse Store</Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }>
          {filteredPurchases.map((purchase) => {
            const item = purchase.item;
            
            if (viewMode === 'grid') {
              // Grid view cards
              if (purchase.item_type === 'content') {
                const categoryName = item?.categories?.name || 'Study Material';
                const specificCategory = getSpecificCategoryLabel(categoryName, item?.title || '');
                const contentDescription = getCategoryDescription(categoryName, item?.content);
                
                return (
                  <Card key={purchase.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative">
                      <div className="w-full h-full bg-gray-500 flex items-center justify-center p-4">
                        <h3 className="font-bold text-center text-white text-lg leading-tight">
                          {item?.title || 'Untitled'}
                        </h3>
                      </div>
                      <div className="absolute top-2 right-2">
                        {getAccessBadge(purchase)}
                      </div>
                    </div>
                    
                    <Card.Content className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate flex-1">
                          {item?.title || 'Untitled'}
                        </h3>
                        <Badge variant="secondary" size="sm" className="ml-2 flex-shrink-0">
                          {specificCategory}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3 min-h-[3.5rem]">
                        {contentDescription}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Purchased {formatDate(purchase.purchase_date)}</span>
                        </div>
                      </div>
                      
                      <Link href={getItemUrl(purchase)} className="block">
                        <Button variant="primary" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Read Content
                        </Button>
                      </Link>
                    </Card.Content>
                  </Card>
                );
              } else {
                // Book card
                return (
                  <Card key={purchase.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-500 relative">
                      {item?.cover_image_url ? (
                        <img
                          src={item.cover_image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {getAccessBadge(purchase)}
                      </div>
                    </div>
                    
                    <Card.Content className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate flex-1">
                          {item?.title || 'Untitled'}
                        </h3>
                        <Badge variant="secondary" size="sm" className="ml-2 flex-shrink-0">
                          Book
                        </Badge>
                      </div>
                      
                      {item?.author && (
                        <p className="text-sm text-gray-500 mb-2">by {item.author}</p>
                      )}
                      
                      {item?.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Purchased {formatDate(purchase.purchase_date)}</span>
                        </div>
                      </div>
                      
                      <Link href={getItemUrl(purchase)} className="block">
                        <Button variant="primary" size="sm" className="w-full">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Read Book
                        </Button>
                      </Link>
                    </Card.Content>
                  </Card>
                );
              }
            } else {
              // List view
              if (purchase.item_type === 'content') {
                const categoryName = item?.categories?.name || 'Study Material';
                const specificCategory = getSpecificCategoryLabel(categoryName, item?.title || '');
                const contentDescription = getCategoryDescription(categoryName, item?.content, true);
                
                return (
                  <Card key={purchase.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-gray-500 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
                        <p className="text-white text-xs font-bold text-center leading-tight line-clamp-3">
                          {item?.title || 'Untitled'}
                        </p>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {item?.title || 'Untitled'}
                          </h3>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant="secondary" size="sm">{specificCategory}</Badge>
                            {getAccessBadge(purchase)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {contentDescription}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Purchased {formatDate(purchase.purchase_date)}</span>
                          </div>
                          
                          <Link href={getItemUrl(purchase)}>
                            <Button variant="primary" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Read Content
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              } else {
                // Book list item
                return (
                  <Card key={purchase.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-gray-500 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item?.cover_image_url ? (
                          <img
                            src={item.cover_image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {item?.title || 'Untitled'}
                          </h3>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant="secondary" size="sm">Book</Badge>
                            {getAccessBadge(purchase)}
                          </div>
                        </div>
                        
                        {item?.author && (
                          <p className="text-sm text-gray-500 mb-1">by {item.author}</p>
                        )}
                        
                        <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                          {item?.description || 'No description available'}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Purchased {formatDate(purchase.purchase_date)}</span>
                          </div>
                          
                          <Link href={getItemUrl(purchase)}>
                            <Button variant="primary" size="sm">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Read Book
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              }
            }
          })}
        </div>
      )}
    </div>
  );
}