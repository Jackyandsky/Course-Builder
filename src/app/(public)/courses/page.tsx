'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, BookOpen } from 'lucide-react';
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
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, selectedCategory, selectedLevel, sortBy]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await courseService.getCourses({ status: 'published' });
      
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
          'beginner': 'Beginner',
          'intermediate': 'Intermediate',
          'advanced': 'Advanced',
          'expert': 'All Levels'
        };
        return difficultyMap[course.difficulty || ''] === selectedLevel;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
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
  };

  const categories = [
    'Reading & Writing',
    'Close Reading', 
    'Systematic Writing',
    'Foreign Languages',
    'Standardized Testing',
    'Customized Programs'
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

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
            Showing <span className="font-semibold">{filteredCourses.length}</span> courses
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            Filters applied
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredCourses.length > 0 ? (
          <>
            {/* Featured Course */}
            {filteredCourses.length > 3 && (
              <div className="mb-8">
                <CourseCard 
                  course={filteredCourses[0]} 
                  featured={true}
                />
              </div>
            )}
            
            {/* Regular Course Grid - 2 per row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCourses.slice(filteredCourses.length > 3 ? 1 : 0).map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  featured={false}
                />
              ))}
            </div>
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

