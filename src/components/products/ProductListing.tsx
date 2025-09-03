'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import ProductCard from './ProductCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';

interface Product {
  id: string;
  title: string;
  author?: string;
  description?: string;
  price?: number;
  currency?: string;
  discount_percentage?: number;
  sale_price?: number;
  is_free?: boolean;
  imageUrl?: string;
  category?: string;
  type?: string;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

interface ProductListingProps {
  products: Product[];
  type: 'library' | 'store';
  title: string;
  subtitle?: string;
  categories?: string[];
  initialCategory?: string;
  searchValue?: string;
  onSearch?: (value: string) => void;
  onCategoryChange?: (category: string) => void;
  onProductClick?: (productId: string) => void;
  pagination?: PaginationProps;
  loading?: boolean;
}

export default function ProductListing({
  products: initialProducts,
  type,
  title,
  subtitle,
  categories = [],
  initialCategory,
  searchValue = '',
  onSearch,
  onCategoryChange,
  onProductClick,
  pagination,
  loading = false
}: ProductListingProps) {
  const [products, setProducts] = useState(initialProducts);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchValue);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [sortBy, setSortBy] = useState('title');
  const [currentPage, setCurrentPage] = useState(pagination?.currentPage || 1);
  const [showFilters, setShowFilters] = useState(false);

  // Update products when initialProducts change
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Update search term when searchValue prop changes
  useEffect(() => {
    setLocalSearchTerm(searchValue);
  }, [searchValue]);

  // Update selected category when URL changes
  useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
  }, [initialCategory]);
  
  const itemsPerPage = pagination?.pageSize || 12;

  // Handle search changes
  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  // Handle product click
  const handleProductClick = (productId: string) => {
    if (onProductClick) {
      onProductClick(productId);
    }
  };

  // Filter and sort products for local mode
  const filteredProducts = (() => {
    if (pagination) {
      // When using external pagination, no local filtering
      return products;
    }
    
    let filtered = [...products];

    // Local search filter
    if (localSearchTerm && !onSearch) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        product.author?.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(localSearchTerm.toLowerCase())
      );
    }

    // Category filter (only if no external handler)
    if (selectedCategory !== 'all' && !onCategoryChange) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    return filtered;
  })();

  // Calculate pagination values
  const startIndex = pagination 
    ? (pagination.currentPage - 1) * pagination.pageSize 
    : (currentPage - 1) * itemsPerPage;
  
  const endIndex = pagination
    ? Math.min(startIndex + pagination.pageSize, pagination.totalItems || products.length)
    : Math.min(startIndex + itemsPerPage, filteredProducts.length);

  // Get displayed products
  const displayedProducts = pagination 
    ? products 
    : filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search by title, author, or description..."
                  value={localSearchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-4">
              {categories.length > 0 && (
                <Select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-48"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              )}

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-48"
              >
                <option value="title">Sort by Title</option>
                <option value="author">Sort by Author</option>
                {type === 'store' && (
                  <>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </>
                )}
              </Select>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t space-y-4">
              {categories.length > 0 && (
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              )}

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full"
              >
                <option value="title">Sort by Title</option>
                <option value="author">Sort by Author</option>
                {type === 'store' && (
                  <>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </>
                )}
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-sm text-gray-600">
          {pagination ? (
            <>
              Showing {startIndex + 1}-{endIndex} of {pagination.totalItems} results
              {localSearchTerm && ` for "${localSearchTerm}"`}
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            </>
          ) : (
            <>
              Showing {filteredProducts.length > 0 ? startIndex + 1 : 0}-{endIndex} of {filteredProducts.length} results
              {localSearchTerm && ` for "${localSearchTerm}"`}
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            </>
          )}
        </p>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedProducts.map(product => (
              <div key={product.id} onClick={() => handleProductClick(product.id)}>
                <ProductCard
                  id={product.id}
                  title={product.title}
                  author={product.author}
                  description={product.description}
                  price={product.price}
                  currency={product.currency}
                  discount_percentage={product.discount_percentage}
                  sale_price={product.sale_price}
                  is_free={product.is_free}
                  imageUrl={product.imageUrl}
                  type={type}
                  category={product.category}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found matching your criteria.</p>
            <button
              onClick={() => {
                setLocalSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination ? (
        (pagination.totalPages > 1 || pagination.onPageSizeChange) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.onPageChange}
              pageSize={pagination.pageSize}
              onPageSizeChange={pagination.onPageSizeChange}
              pageSizeOptions={[12, 24, 48, 96]}
            />
          </div>
        )
      ) : (
        (() => {
          const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
          return totalPages > 1 ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          ) : null;
        })()
      )}
    </div>
  );
}