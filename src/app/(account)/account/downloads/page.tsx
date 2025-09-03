'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSingletonSupabaseClient } from '@/lib/supabase-singleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Download, FileText, Book, Package, Search,
  Filter, Clock, CheckCircle, AlertCircle,
  ChevronRight, Eye, Share2, Star, Archive,
  Grid, List, Calendar, HardDrive
} from 'lucide-react';
import Link from 'next/link';

interface PurchasedContent {
  id: string;
  item_id: string;
  item_type: 'content' | 'book';
  title: string;
  description?: string;
  author?: string;
  category?: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  purchase_date: string;
  download_count: number;
  last_downloaded?: string;
  expiry_date?: string;
  is_active: boolean;
  thumbnail_url?: string;
  pages?: number;
  language?: string;
  tags?: string[];
}

export default function DownloadsPage() {
  const { user } = useAuth();
  const supabase = getSingletonSupabaseClient();
  const [content, setContent] = useState<PurchasedContent[]>([]);
  const [filteredContent, setFilteredContent] = useState<PurchasedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'books' | 'content'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'downloads'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const stats = {
    totalItems: content.length,
    books: content.filter(c => c.item_type === 'book').length,
    contentItems: content.filter(c => c.item_type === 'content').length,
    totalDownloads: content.reduce((sum, c) => sum + c.download_count, 0),
    totalSize: content.reduce((sum, c) => sum + (c.file_size || 0), 0)
  };

  useEffect(() => {
    if (user) {
      fetchPurchasedContent();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortContent();
  }, [content, searchTerm, filter, sortBy]);

  const fetchPurchasedContent = async () => {
    if (!supabase || !user) return;
    
    try {
      // Fetch purchased books and content
      const { data: purchases, error } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user.id)
        .in('item_type', ['book', 'content'])
        .eq('is_active', true);

      if (error) throw error;

      // Fetch details for books and content
      const bookIds = purchases?.filter(p => p.item_type === 'book').map(p => p.item_id) || [];
      const contentIds = purchases?.filter(p => p.item_type === 'content').map(p => p.item_id) || [];

      let books: any[] = [];
      let contentItems: any[] = [];

      if (bookIds.length > 0) {
        const { data: booksData } = await supabase
          .from('books')
          .select('*')
          .in('id', bookIds);
        books = booksData || [];
      }

      if (contentIds.length > 0) {
        const { data: contentData } = await supabase
          .from('content')
          .select('*')
          .in('id', contentIds);
        contentItems = contentData || [];
      }

      // Combine and format the data
      const formattedContent: PurchasedContent[] = [];

      purchases?.forEach(purchase => {
        if (purchase.item_type === 'book') {
          const book = books.find(b => b.id === purchase.item_id);
          if (book) {
            formattedContent.push({
              id: purchase.id,
              item_id: purchase.item_id,
              item_type: 'book',
              title: book.title,
              description: book.description,
              author: book.author,
              category: 'Books',
              file_url: book.file_url,
              file_size: 2048000, // Mock size in bytes
              file_type: 'PDF',
              purchase_date: purchase.purchase_date,
              download_count: 0, // Mock count
              is_active: purchase.is_active,
              thumbnail_url: book.cover_image_url,
              pages: book.total_pages,
              language: book.language,
              tags: book.tags
            });
          }
        } else if (purchase.item_type === 'content') {
          const contentItem = contentItems.find(c => c.id === purchase.item_id);
          if (contentItem) {
            formattedContent.push({
              id: purchase.id,
              item_id: purchase.item_id,
              item_type: 'content',
              title: contentItem.name,
              description: contentItem.content,
              category: 'Study Materials',
              file_url: contentItem.file_url,
              file_size: 1024000, // Mock size
              file_type: 'PDF',
              purchase_date: purchase.purchase_date,
              download_count: 0,
              is_active: purchase.is_active,
              tags: contentItem.tags
            });
          }
        }
      });

      setContent(formattedContent);
    } catch (error) {
      console.error('Error fetching purchased content:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortContent = () => {
    let filtered = [...content];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filter !== 'all') {
      filtered = filtered.filter(item => 
        filter === 'books' ? item.item_type === 'book' : item.item_type === 'content'
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'downloads':
          return b.download_count - a.download_count;
        default:
          return 0;
      }
    });

    setFilteredContent(filtered);
  };

  const handleDownload = async (item: PurchasedContent) => {
    // Future implementation: Track download and provide file
    console.log('Downloading:', item.title);
    
    // Update download count locally
    setContent(prev => prev.map(c => 
      c.id === item.id 
        ? { ...c, download_count: c.download_count + 1, last_downloaded: new Date().toISOString() }
        : c
    ));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Downloads</h1>
        <p className="mt-2 text-gray-600">
          Access your purchased books and content
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{stats.totalItems}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Books</p>
              <p className="text-2xl font-bold">{stats.books}</p>
            </div>
            <Book className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Content</p>
              <p className="text-2xl font-bold">{stats.contentItems}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Downloads</p>
              <p className="text-2xl font-bold">{stats.totalDownloads}</p>
            </div>
            <Download className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Size</p>
              <p className="text-xl font-bold">{formatFileSize(stats.totalSize)}</p>
            </div>
            <HardDrive className="h-8 w-8 text-indigo-600" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search downloads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Items</option>
            <option value="books">Books Only</option>
            <option value="content">Content Only</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Recently Purchased</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="downloads">Most Downloaded</option>
          </select>
          <div className="flex border rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Display */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredContent.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="aspect-[3/4] relative bg-gradient-to-br from-gray-100 to-gray-200">
                  {item.thumbnail_url ? (
                    <img 
                      src={item.thumbnail_url} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-4">
                      {item.item_type === 'book' ? (
                        <Book className="h-16 w-16 mb-3" />
                      ) : (
                        <FileText className="h-16 w-16 mb-3" />
                      )}
                      <p className="text-center text-sm font-medium line-clamp-2">{item.title}</p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      item.item_type === 'book' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {item.item_type === 'book' ? 'Book' : 'Content'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-1 mb-1">{item.title}</h3>
                  {item.author && (
                    <p className="text-sm text-gray-600 mb-2">by {item.author}</p>
                  )}
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{item.file_type} • {formatFileSize(item.file_size || 0)}</span>
                    </div>
                    {item.pages && (
                      <div className="flex items-center gap-2">
                        <Book className="h-4 w-4" />
                        <span>{item.pages} pages</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Purchased {new Date(item.purchase_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownload(item)}
                      className="flex-1 flex items-center justify-center gap-2"
                      size="sm"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContent.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex items-start gap-6">
                  {/* Thumbnail */}
                  <div className="w-24 h-32 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded">
                    {item.thumbnail_url ? (
                      <img 
                        src={item.thumbnail_url} 
                        alt={item.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        {item.item_type === 'book' ? (
                          <Book className="h-8 w-8" />
                        ) : (
                          <FileText className="h-8 w-8" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        {item.author && (
                          <p className="text-sm text-gray-600">by {item.author}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        item.item_type === 'book' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.item_type === 'book' ? 'Book' : 'Content'}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    )}

                    {/* Details and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {item.file_type} • {formatFileSize(item.file_size || 0)}
                        </div>
                        {item.pages && (
                          <div className="flex items-center gap-1">
                            <Book className="h-4 w-4" />
                            {item.pages} pages
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {item.download_count} downloads
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Purchased {new Date(item.purchase_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDownload(item)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? 'No items found' : 'No downloads available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Purchase books or content to access them here'}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/library">
                <Button>Browse Library</Button>
              </Link>
              <Link href="/store">
                <Button variant="outline">Visit Store</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}