'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, CheckCircle, Clock, Users } from 'lucide-react';
import { Task } from '@/types/database';
import { taskService, TaskFilters } from '@/lib/supabase/tasks';
import { categoryService } from '@/lib/supabase/categories';
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
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tasks Management</h1>
        <Button onClick={() => router.push('/admin/tasks/new')} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="md:col-span-1"
          placeholder="All Categories"
          options={[
            { value: '', label: 'All Categories' },
            ...categories.map((category) => ({
              value: category.id,
              label: category.name
            }))
          ]}
        />
        <Select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="md:col-span-1"
          placeholder="All Priorities"
          options={[
            { value: '', label: 'All Priorities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' }
          ]}
        />
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No tasks found. Create your first task to get started.</p>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{task.title}</h3>
                    <Badge color={priorityColors[task.priority || 'medium']}>
                      {task.priority || 'medium'}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                    </div>
                    {task.assigned_to && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Assigned</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Status: {task.status || 'pending'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/tasks/${task.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    color="danger"
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}