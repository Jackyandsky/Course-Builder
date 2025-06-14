'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Cog, Users, Clock } from 'lucide-react';
import { Method } from '@/types/database';
import { methodService, MethodFilters } from '@/lib/supabase/methods';
import { categoryService } from '@/lib/supabase/categories';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, Badge, Input, Select, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function MethodsPage() {
  const router = useRouter();
  const [methods, setMethods] = useState<Method[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMethods();
  }, [searchQuery, selectedCategory]);

  const loadData = async () => {
    try {
      const [methodsData, categoriesData] = await Promise.all([
        methodService.getMethodsWithBelongings({}),
        categoryService.getCategories({ type: 'method' })
      ]);
      setMethods(methodsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMethods = async () => {
    try {
      const filters: MethodFilters = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory) filters.categoryId = selectedCategory;

      const data = await methodService.getMethodsWithBelongings(filters);
      setMethods(data);
    } catch (error) {
      console.error('Failed to load methods:', error);
    }
  };

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

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <DashboardLayout>
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Teaching Methods
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage teaching strategies and methodologies
              </p>
            </div>
            <Button
              onClick={() => router.push('/methods/new')}
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
                  <Clock className="h-8 w-8 text-purple-600 mr-3" />
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
                  <Users className="h-8 w-8 text-green-600 mr-3" />
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
          {methods.length === 0 ? (
            <Card>
              <Card.Content className="p-12 text-center">
                <Cog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No methods found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get started by creating your first teaching method.
                </p>
                <Button
                  onClick={() => router.push('/methods/new')}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create First Method
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {methods.map((method) => (
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
                              <Users className="h-3 w-3" />
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/methods/${method.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}