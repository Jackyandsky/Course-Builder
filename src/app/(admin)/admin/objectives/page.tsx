'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { objectiveService } from '@/lib/supabase/objectives';
import { categoryService } from '@/lib/supabase/categories';
import type { Objective, Category } from '@/types/database';
import { 
  Plus, 
  Search, 
  Filter, 
  Target, 
  Clock, 
  BookOpen,
  Edit,
  Trash2,
  Eye,
  Users,
  CheckCircle
} from 'lucide-react';

export default function ObjectivesPage() {
  const router = useRouter();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [objectivesData, categoriesData] = await Promise.all([
        objectiveService.getObjectivesWithBelongings({}),
        categoryService.getCategories({ type: 'objective' })
      ]);
      setObjectives(objectivesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredObjectives = useMemo(() => {
    return objectives.filter(objective => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          objective.title.toLowerCase().includes(query) ||
          (objective.description && objective.description.toLowerCase().includes(query)) ||
          (objective.tags && objective.tags.some(tag => tag.toLowerCase().includes(query)));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory && objective.category_id !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [objectives, searchQuery, selectedCategory]);

  const handleDelete = async (objectiveId: string) => {
    if (!confirm('Are you sure you want to delete this objective?')) return;
    
    try {
      await objectiveService.deleteObjective(objectiveId);
      setObjectives(prev => prev.filter(obj => obj.id !== objectiveId));
    } catch (error) {
      console.error('Failed to delete objective:', error);
      alert('Failed to delete objective. Please try again.');
    }
  };


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
            Teaching Objectives
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage reusable teaching objectives for courses and lessons
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/objectives/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Objective
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
                placeholder="Search objectives..."
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
              <Target className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{objectives.length}</p>
                <p className="text-sm text-gray-600">Total Objectives</p>
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
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {objectives.reduce((sum, obj) => sum + (obj.tags?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Tags</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Objectives Grid */}
      {filteredObjectives.length === 0 ? (
        <Card>
          <Card.Content className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No objectives found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || selectedCategory
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first teaching objective.'
              }
            </p>
            {!searchQuery && !selectedCategory && (
              <Button
                onClick={() => router.push('/admin/objectives/new')}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Create First Objective
              </Button>
            )}
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredObjectives.map((objective) => (
            <Card key={objective.id} className="hover:shadow-md transition-shadow">
              <Card.Content className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {objective.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {objective.description}
                    </p>
                  </div>
                  {objective.is_template && (
                    <Badge variant="outline" size="sm" className="ml-2">
                      Template
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {objective.category && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Category:</span>
                      <span className="ml-1">{objective.category.name}</span>
                    </div>
                  )}

                  {objective.tags && objective.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {objective.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" size="sm">
                          {tag}
                        </Badge>
                      ))}
                      {objective.tags.length > 3 && (
                        <Badge variant="outline" size="sm">
                          +{objective.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Belonging Information */}
                  {((objective as any).belongingCourses?.length > 0 || (objective as any).belongingLessons?.length > 0) && (
                    <div className="text-xs text-gray-500">
                      {(objective as any).belongingCourses?.length > 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          <BookOpen className="h-3 w-3" />
                          <span>
                            Courses: {(objective as any).belongingCourses.slice(0, 2).map((c: any) => c.title).join(', ')}
                            {(objective as any).belongingCourses.length > 2 && ` +${(objective as any).belongingCourses.length - 2} more`}
                          </span>
                        </div>
                      )}
                      {(objective as any).belongingLessons?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Lessons: {(objective as any).belongingLessons.slice(0, 2).map((l: any) => l.topic || l.title || `Lesson ${l.lesson_number}`).join(', ')}
                            {(objective as any).belongingLessons.length > 2 && ` +${(objective as any).belongingLessons.length - 2} more`}
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
                      onClick={() => router.push(`/admin/objectives/${objective.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/objectives/${objective.id}/edit`)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(objective.id)}
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