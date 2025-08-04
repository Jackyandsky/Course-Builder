'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Cog, Users, Clock } from 'lucide-react';
import { Method } from '@/types/database';
import { methodService, MethodFilters } from '@/lib/supabase/methods';
import { categoryService } from '@/lib/supabase/categories';
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
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Filter methods based on search query
  const filteredMethods = methods.filter(method =>
    method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (method.description && method.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Methods</h1>
        <Button onClick={() => router.push('/admin/methods/new')} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Method
        </Button>
      </div>

      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search methods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMethods.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Cog className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'No methods found matching your search.' : 'No methods yet. Create your first method to get started.'}
            </p>
          </Card>
        ) : (
          filteredMethods.map((method) => (
            <Card 
              key={method.id} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/methods/${method.id}/edit`)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold">{method.name}</h3>
                <Badge variant="primary" size="sm">
                  Method
                </Badge>
              </div>
              
              {method.description && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {method.description}
                </p>
              )}

              {method.duration_minutes && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Clock className="h-4 w-4" />
                  <span>{method.duration_minutes} minutes</span>
                </div>
              )}

              {method.category && (
                <Badge variant="outline" size="sm">
                  {method.category.name}
                </Badge>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}