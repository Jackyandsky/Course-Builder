'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Cog, Users, Clock, Filter, BookOpen, Edit, Trash2, Eye, Target } from 'lucide-react';
import { Method } from '@/types/database';
import { methodService } from '@/lib/supabase/methods';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';

export default function MethodsPage() {
  const router = useRouter();
  const [methods, setMethods] = useState<Method[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const loadMethods = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('[AdminMethodsPage] Loading methods with optimized API');
      
      // Load methods with optimized API
      const filters = {
        page: 1,
        perPage: 100,
        search: searchQuery,
        categoryId: selectedCategory
      };
      
      const result = await methodService.getAdminMethodsList(filters);
      setMethods(result.data);
      
      // Load categories separately
      const response = await fetch('/api/admin/methods');
      if (response.ok) {
        const { data } = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load methods:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const handleDelete = async (methodId: string) => {
    if (!confirm('Are you sure you want to delete this method?')) return;
    
    try {
      await methodService.deleteMethod(methodId);
      setMethods(prev => prev.filter(method => method.id !== methodId));
    } catch (error) {
      console.error('Failed to delete method:', error);
      alert('Failed to delete method. Please try again.');
    }
  };

  const filteredMethods = useMemo(() => {
    return methods.filter(method => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          method.name.toLowerCase().includes(query) ||
          (method.description && method.description.toLowerCase().includes(query)) ||
          (method.tags && method.tags.some(tag => tag.toLowerCase().includes(query)));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory && method.category_id !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [methods, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Teaching Methods
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage reusable teaching methods and instructional techniques
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/methods/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Method
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search methods..."
                className="pl-10"
              />
            </div>
            
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
              ]}
              placeholder="Category"
            />
          </div>
        </Card.Content>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center">
              <Cog className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{methods.length}</p>
                <p className="text-sm text-gray-600">Total Methods</p>
              </div>
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-gray-600">Categories</p>
              </div>
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {methods.reduce((sum, method) => sum + (method.tags?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Tags</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Methods Grid */}
      {filteredMethods.length === 0 ? (
        <Card>
          <Card.Content className="p-12 text-center">
            <Cog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No methods found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || selectedCategory
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first teaching method.'
              }
            </p>
            {!searchQuery && !selectedCategory && (
              <Button
                onClick={() => router.push('/admin/methods/new')}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Create First Method
              </Button>
            )}
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMethods.map((method) => (
            <Card key={method.id} className="hover:shadow-md transition-shadow">
              <Card.Content className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {method.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {method.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {method.category && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Category:</span>
                      <span className="ml-1">{method.category.name}</span>
                    </div>
                  )}

                  {method.duration_minutes && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{method.duration_minutes} minutes</span>
                    </div>
                  )}

                  {method.tags && method.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {method.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" size="sm">
                          {tag}
                        </Badge>
                      ))}
                      {method.tags.length > 3 && (
                        <Badge variant="outline" size="sm">
                          +{method.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Belonging Information */}
                  {((method as any).belongingCourses?.length > 0 || (method as any).belongingLessons?.length > 0) && (
                    <div className="text-xs text-gray-500">
                      {(method as any).belongingCourses?.length > 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          <BookOpen className="h-3 w-3" />
                          <span>
                            Courses: {(method as any).belongingCourses.slice(0, 2).map((c: any) => c.title).join(', ')}
                            {(method as any).belongingCourses.length > 2 && ` +${(method as any).belongingCourses.length - 2} more`}
                          </span>
                        </div>
                      )}
                      {(method as any).belongingLessons?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Lessons: {(method as any).belongingLessons.slice(0, 2).map((l: any) => l.topic || l.title || `Lesson ${l.lesson_number}`).join(', ')}
                            {(method as any).belongingLessons.length > 2 && ` +${(method as any).belongingLessons.length - 2} more`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/methods/${method.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/methods/${method.id}/edit`)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(method.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}