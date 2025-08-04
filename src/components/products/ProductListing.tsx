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
  imageUrl?: string;
  category?: string;
  type?: string;
}

interface ProductListingProps {
  products: Product[];
  type: 'library' | 'store';
  title: string;
  subtitle?: string;
  categories?: string[];
  initialCategory?: string;
}

export default function ProductListing({
  products: initialProducts,
  type,
  title,
  subtitle,
  categories = [],
  initialCategory
}: ProductListingProps) {
  const [products, setProducts] = useState(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [sortBy, setSortBy] = useState('title');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Update products when initialProducts change
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Update selected category when URL changes
  useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
    setCurrentPage(1); // Reset to first page when category changes
  }, [initialCategory]);
  
  const itemsPerPage = 12;

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
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

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-4">
              {categories.length > 0 && (
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
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
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} results
          {searchTerm && ` for "${searchTerm}"`}
          {selectedCategory !== 'all' && ` in ${selectedCategory}`}
        </p>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedProducts.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                author={product.author}
                description={product.description}
                price={product.price}
                imageUrl={product.imageUrl}
                type={type}
                category={product.category}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
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
      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}