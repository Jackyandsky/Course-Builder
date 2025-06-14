'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, CheckCircle, Clock, Users } from 'lucide-react';
import { Task } from '@/types/database';
import { taskService, TaskFilters } from '@/lib/supabase/tasks';
import { categoryService } from '@/lib/supabase/categories';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, Badge, Input, Select, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

const priorityColors: Record<string, 'secondary' | 'warning' | 'danger' | 'primary'> = {
  low: 'secondary',
  medium: 'warning',
  high: 'danger',
  urgent: 'primary',
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [searchQuery, selectedCategory, selectedPriority]);

  const loadData = async () => {
    try {
      const [tasksData, categoriesData] = await Promise.all([
        taskService.getTasksWithBelongings({}),
        categoryService.getCategories({ type: 'task' })
      ]);
      setTasks(tasksData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const filters: TaskFilters = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory) filters.categoryId = selectedCategory;
      if (selectedPriority) filters.priority = selectedPriority as 'low' | 'medium' | 'high' | 'urgent';

      const data = await taskService.getTasksWithBelongings(filters);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
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
                Tasks
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage learning tasks and activities for lessons
              </p>
            </div>
            <Button
              onClick={() => router.push('/tasks/new')}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New Task
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <Card.Content className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks..."
                      className="pl-10"
                    />
                  </div>
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
                
                <Select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  options={[
                    { value: '', label: 'All Priorities' },
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' }
                  ]}
                  placeholder="Priority"
                />
                
              </div>
            </Card.Content>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <Card.Content className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{tasks.length}</p>
                    <p className="text-sm text-gray-600">Total Tasks</p>
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
                      {tasks.filter(task => task.priority === 'high' || task.priority === 'urgent').length}
                    </p>
                    <p className="text-sm text-gray-600">High Priority</p>
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
                  <CheckCircle className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">
                      {tasks.reduce((sum, task) => sum + (task.points || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Points</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Tasks Grid */}
          {tasks.length === 0 ? (
            <Card>
              <Card.Content className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No tasks found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get started by creating your first task.
                </p>
                <Button
                  onClick={() => router.push('/tasks/new')}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create First Task
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <Card.Content className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <span className="text-sm font-medium">Points: {task.points || 0}</span>
                        </div>
                        {task.priority && (
                          <Badge variant={priorityColors[task.priority]} size="sm">
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                        )}
                      </div>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" size="sm">
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 3 && (
                            <Badge variant="outline" size="sm">
                              +{task.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Belonging Information */}
                      {((task.belongingCourses?.length || 0) > 0 || (task.belongingLessons?.length || 0) > 0) && (
                        <div className="space-y-2">
                          {(task.belongingCourses?.length || 0) > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Courses:</p>
                              <div className="flex flex-wrap gap-1">
                                {task.belongingCourses?.slice(0, 2).map((course: any) => (
                                  <Badge key={course.id} variant="secondary" size="sm">
                                    {course.title}
                                  </Badge>
                                ))}
                                {(task.belongingCourses?.length || 0) > 2 && (
                                  <Badge variant="secondary" size="sm">
                                    +{(task.belongingCourses?.length || 0) - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {(task.belongingLessons?.length || 0) > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Lessons:</p>
                              <div className="flex flex-wrap gap-1">
                                {task.belongingLessons?.slice(0, 2).map((lesson: any) => (
                                  <Badge key={lesson.id} variant="info" size="sm">
                                    {lesson.topic || lesson.title || `Lesson ${lesson.lesson_number}`}
                                  </Badge>
                                ))}
                                {(task.belongingLessons?.length || 0) > 2 && (
                                  <Badge variant="info" size="sm">
                                    +{(task.belongingLessons?.length || 0) - 2} more
                                  </Badge>
                                )}
                              </div>
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
                          onClick={() => router.push(`/tasks/${task.id}/edit`)}
                        >
                          Edit
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
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