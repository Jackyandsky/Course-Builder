'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Eye, Package, ChevronUp, ChevronDown, BarChart3, ArrowUpDown, ChevronLeft, ChevronRight, Upload, FileText } from 'lucide-react';
import { Content, ContentFilters } from '@/types/content';
import { contentService } from '@/lib/supabase/content';
import { Button, Card, Badge, Input, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import PDFUploadModal from '@/components/content/PDFUploadModal';

interface GenericContentListProps {
  categoryName: string;
  categoryId?: string;
}

type SortField = 'name' | 'created_at' | 'updated_at' | 'status';
type SortOrder = 'asc' | 'desc';

export function GenericContentList({ categoryName, categoryId }: GenericContentListProps) {
  const router = useRouter();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
  
  // Create a unique key for this category's state
  const stateKey = `content-list-${categorySlug}`;
  
  // Initialize state from sessionStorage
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(stateKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.searchQuery || '';
      }
    }
    return '';
  });
  
  const [sortField, setSortField] = useState<SortField>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(stateKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only use saved value if it's explicitly set
        if (parsed.sortField && parsed.sortField !== 'created_at') {
          return parsed.sortField;
        }
      }
    }
    return 'name';
  });
  
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(stateKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset to ascending if we're changing from created_at default
        if (parsed.sortField === 'created_at' && parsed.sortOrder === 'desc') {
          return 'asc';
        }
        return parsed.sortOrder || 'asc';
      }
    }
    return 'asc';
  });
  
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(stateKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.currentPage || 1;
      }
    }
    return 1;
  });
  
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 36; // 12 rows × 3 items per row

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = {
        searchQuery,
        sortField,
        sortOrder,
        currentPage
      };
      sessionStorage.setItem(stateKey, JSON.stringify(state));
    }
  }, [searchQuery, sortField, sortOrder, currentPage, stateKey]);

  useEffect(() => {
    loadContent();
  }, [categoryName, searchQuery, sortField, sortOrder, currentPage]);

  const loadContent = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const filters: ContentFilters & { sortField?: string; sortOrder?: 'asc' | 'desc' } = {
        search: searchQuery,
        limit: itemsPerPage,
        offset: offset,
        sortField: sortField,
        sortOrder: sortOrder,
      };
      
      let data: Content[];
      let count: number;
      
      if (categoryId) {
        data = await contentService.getContent({ ...filters, category_id: categoryId });
        count = await contentService.getContentCount({ 
          category_id: categoryId,
          search: searchQuery 
        });
      } else {
        data = await contentService.getContentByCategory(categoryName, filters);
        // Get category to get count
        const categories = await contentService.getProprietaryProductCategories();
        const category = categories.find(c => c.name === categoryName);
        if (category) {
          count = await contentService.getContentCount({ 
            category_id: category.id,
            search: searchQuery 
          });
        } else {
          count = 0;
        }
      }
      
      setContent(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Failed to load content:', error);
      // Show a user-friendly error message for timeout issues
      if (error instanceof Error && error.message.includes('timeout')) {
        alert('The request timed out. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDelete = async (contentId: string, contentName: string) => {
    if (!confirm(`Are you sure you want to delete "${contentName}"?`)) return;
    
    try {
      await contentService.deleteContent(contentId);
      setContent(prev => prev.filter(item => item.id !== contentId));
    } catch (error) {
      console.error('Failed to delete content:', error);
      alert('Failed to delete content. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{categoryName}</h1>
          <p className="text-gray-600 mt-2">Manage {categoryName.toLowerCase()} content</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowUploadModal(true)} 
            size="lg"
            variant="outline"
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload PDFs
          </Button>
          <Button 
            onClick={() => router.push(`/admin/${categorySlug}/new`)} 
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create {categoryName.slice(0, -1)}
          </Button>
        </div>
      </div>

      {/* Analytics Bar */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Total Items:</span>
              <span className="text-lg font-bold text-gray-900">{totalCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Showing:</span>
              <span className="text-sm text-gray-600">
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
              </span>
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <div className="flex gap-2">
              <Button
                variant={sortField === 'name' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSort('name')}
              >
                Name
                {sortField === 'name' && (
                  sortOrder === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                )}
              </Button>
              <Button
                variant={sortField === 'created_at' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSort('created_at')}
              >
                Created
                {sortField === 'created_at' && (
                  sortOrder === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                )}
              </Button>
              <Button
                variant={sortField === 'updated_at' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSort('updated_at')}
              >
                Updated
                {sortField === 'updated_at' && (
                  sortOrder === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                )}
              </Button>
              <Button
                variant={sortField === 'status' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSort('status')}
              >
                Status
                {sortField === 'status' && (
                  sortOrder === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`Search ${categoryName.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {content.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">
              {searchQuery 
                ? `No ${categoryName.toLowerCase()} found matching your search.` 
                : `No ${categoryName.toLowerCase()} yet. Create your first one to get started.`}
            </p>
          </Card>
        ) : (
          content.map((item) => (
            <Card 
              key={item.id} 
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <div className="flex items-center gap-1">
                  {item.featured && (
                    <Badge variant="primary" size="sm">Featured</Badge>
                  )}
                  {item.is_public && (
                    <Badge variant="success" size="sm">Public</Badge>
                  )}
                  {item.status === 'draft' && (
                    <Badge variant="secondary" size="sm">Draft</Badge>
                  )}
                </div>
              </div>
              
              {item.content && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {item.content}
                </p>
              )}

              {/* Display multiple books */}
              {(item.content_books && item.content_books.length > 0) ? (
                <div className="mb-4 text-sm text-gray-500">
                  <span className="font-medium">Books:</span> {item.content_books.length} associated
                </div>
              ) : item.book ? (
                <div className="mb-4 text-sm text-gray-500">
                  <span className="font-medium">Book:</span> {item.book.title}
                </div>
              ) : null}

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="outline" size="sm">
                      +{item.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* PDF metadata if available */}
              {item.metadata?.source === 'pdf_upload' && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <FileText className="h-4 w-4" />
                  <span>{item.metadata.filename} ({item.metadata.pageCount} pages)</span>
                </div>
              )}

              {/* Date info */}
              <div className="text-xs text-gray-500 mb-3">
                Created: {new Date(item.created_at).toLocaleDateString()}
                {item.updated_at && item.updated_at !== item.created_at && (
                  <span className="ml-2">
                    • Updated: {new Date(item.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/${categorySlug}/${item.id}`)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/${categorySlug}/${item.id}/edit`)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id, item.name)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant={currentPage === 1 ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => goToPage(1)}
            >
              1
            </Button>
            
            {/* Show dots if there are many pages */}
            {currentPage > 3 && <span className="px-2 text-gray-500">...</span>}
            
            {/* Pages around current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage - 2 + i;
              if (page > 1 && page < totalPages) {
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Button>
                );
              }
              return null;
            })}
            
            {/* Show dots if there are many pages */}
            {currentPage < totalPages - 2 && <span className="px-2 text-gray-500">...</span>}
            
            {/* Last page */}
            {totalPages > 1 && (
              <Button
                variant={currentPage === totalPages ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => goToPage(totalPages)}
              >
                {totalPages}
              </Button>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* PDF Upload Modal */}
      <PDFUploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          loadContent(); // Refresh content after closing
        }}
        defaultCategory={categorySlug}
      />
    </div>
  );
}