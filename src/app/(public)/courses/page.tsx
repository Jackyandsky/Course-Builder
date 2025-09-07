'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Filter, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { courseService } from '@/lib/supabase/courses';
import CourseCard from '@/components/courses/CourseCard';

interface Course {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  instructor_name?: string;
  duration?: string;
  difficulty?: string;
  category?: {
    id: string;
    name: string;
  };
  price?: number;
  enrollment_count?: number;
  rating?: number;
  thumbnail_url?: string;
  features?: string[];
  objectives?: any[];
  created_at: string;
  status: string;
  course_books?: any[];
  course_objectives?: any[];
  schedules?: any[];
  book_count?: number;
}

export default function CoursesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'most-content');
  const [currentPage, setCurrentPage] = useState(searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1);
  const [itemsPerPage, setItemsPerPage] = useState(searchParams.get('perPage') ? parseInt(searchParams.get('perPage')!) : 4);

  // Initialize from URL params only on mount
  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, selectedCategory, selectedLevel, sortBy]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (itemsPerPage !== 4) params.set('perPage', itemsPerPage.toString());
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedLevel !== 'all') params.set('level', selectedLevel);
    if (sortBy !== 'most-content') params.set('sort', sortBy);
    
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.replace(url, { scroll: false });
  }, [currentPage, itemsPerPage, searchTerm, selectedCategory, selectedLevel, sortBy, pathname, router]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all public courses using the public API (no auth required)
      const data = await courseService.getPublicCourses({ 
        status: 'published',
        perPage: 500  // Load up to 500 courses to ensure we get them all
      });
      
      // Use actual data from the database
      setCourses(data);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCourses = () => {
    let filtered = [...courses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category?.name === selectedCategory);
    }

    // Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course => {
        const difficultyMap: { [key: string]: string } = {
          'basic': 'Basic',
          'standard': 'Standard', 
          'premium': 'Premium'
        };
        return difficultyMap[course.difficulty || ''] === selectedLevel;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'most-content':
          // Sort by book count first (descending), then by title (ascending)
          const bookDiff = (b.book_count || 0) - (a.book_count || 0);
          if (bookDiff !== 0) return bookDiff;
          return a.title.localeCompare(b.title);
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'z-a':
          return b.title.localeCompare(a.title);
        case 'popular':
          return (b.enrollment_count || 0) - (a.enrollment_count || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    setFilteredCourses(filtered);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const categories = [
    'Reading & Writing',
    'Close Reading', 
    'Systematic Writing',
    'Foreign Languages',
    'Standardized Testing',
    'Customized Programs'
  ];

  const levels = ['Basic', 'Standard', 'Premium'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Courses</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadCourses}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Explore Our Courses</h1>
            <p className="mt-2 text-gray-600">
              Discover comprehensive courses designed to elevate your literary excellence and critical thinking skills
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search courses, topics, or instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 h-12 text-lg"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-48 h-12"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>

              <Select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-40 h-12"
              >
                <option value="all">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </Select>

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-44 h-12"
              >
                <option value="most-content">Most Content</option>
                <option value="a-z">A-Z (Name)</option>
                <option value="z-a">Z-A (Name)</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </Select>
            </div>
          </div>

        </div>
      </div>

      {/* Results Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {filteredCourses.length > 0 ? (
              <>
                Showing <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredCourses.length)}</span> of{' '}
                <span className="font-semibold">{filteredCourses.length}</span> courses
                {searchTerm && ` for "${searchTerm}"`}
                {selectedCategory !== 'all' && ` in ${selectedCategory}`}
              </>
            ) : (
              <>No courses found{searchTerm && ` for "${searchTerm}"`}</>
            )}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Per page:</label>
              <Select
                value={itemsPerPage.toString()}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="w-16 h-8 text-sm"
              >
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="6">6</option>
                <option value="8">8</option>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              Filters applied
            </div>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredCourses.length > 0 ? (
          <>
            {/* Regular Course Grid - 2 per row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {paginatedCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  featured={false}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded border-2 transition-colors ${
                    currentPage === 1
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-gray-600 text-gray-600 hover:border-blue-600 hover:text-blue-600'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded border-2 font-bold transition-colors ${
                            page === currentPage
                              ? 'border-blue-600 text-blue-600 bg-blue-50'
                              : 'border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded border-2 transition-colors ${
                    currentPage === totalPages
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-gray-600 text-gray-600 hover:border-blue-600 hover:text-blue-600'
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        ) : courses.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
            <p className="mt-2 text-sm text-gray-600">
              Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedLevel('all');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No published courses available</h3>
            <p className="mt-2 text-sm text-gray-600">
              Please check back later for new courses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

