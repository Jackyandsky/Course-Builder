'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, Clock, Users, Award, BookOpen, Play, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Course {
  id: string;
  title: string;
  description: string;
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
}

export default function CoursesClient({ initialCourses }: { initialCourses: Course[] }) {
  const [courses] = useState<Course[]>(initialCourses);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(initialCourses);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, selectedCategory, selectedLevel, sortBy]);

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
        // Map difficulty levels to display levels
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
          return (typeof b.rating === 'number' ? b.rating : parseFloat(b.rating || '0')) - 
                 (typeof a.rating === 'number' ? a.rating : parseFloat(a.rating || '0'));
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

// Course Card Component
function CourseCard({ course }: { course: Course }) {
  const difficultyColors: Record<string, string> = {
    'basic': 'bg-green-100 text-green-800',
    'standard': 'bg-yellow-100 text-yellow-800',
    'premium': 'bg-purple-100 text-purple-800',
  };

  const difficultyLabels: Record<string, string> = {
    'basic': 'Basic',
    'standard': 'Standard',
    'premium': 'Premium',
  };
  
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer">
        {/* Image Section */}
        {course.thumbnail_url ? (
          <div className="h-48 overflow-hidden">
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              width={400}
              height={200}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-white/30" />
          </div>
        )}

        {/* Content Section */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {course.title}
            </h3>
          </div>
          
          {course.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
              {course.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {course.difficulty && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  difficultyColors[course.difficulty] || 'bg-gray-100 text-gray-800'
                }`}>
                  {difficultyLabels[course.difficulty] || course.difficulty}
                </span>
              )}
              {course.duration && (
                <span className="text-sm text-gray-500">
                  {course.duration}
                </span>
              )}
            </div>
            
            {course.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {course.category.name}
              </span>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            {course.instructor_name && (
              <span>by {course.instructor_name}</span>
            )}
            {course.enrollment_count && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.enrollment_count}</span>
              </div>
            )}
            {course.rating && (
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-yellow-500" />
                <span>{course.rating}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center">
              {course.price !== undefined && course.price > 0 ? (
                <span className="text-xl font-bold text-gray-900">
                  ${course.price}
                </span>
              ) : (
                <span className="text-lg font-medium text-green-600">Free</span>
              )}
            </div>
            
            <span className="text-sm text-blue-600 font-medium">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}