'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, CheckCircle, Clock, Users, Filter, Target, FileText } from 'lucide-react';
import { Task } from '@/types/database';
import { taskService } from '@/lib/supabase/tasks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedPriority) params.append('priority', selectedPriority);
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());

      const response = await fetch(`/api/admin/tasks?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const { data, pagination } = await response.json();
      setTasks(data.tasks);
      setCategories(data.categories);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.total);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedPriority, currentPage, pageSize]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedPriority]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
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

  const priorityStats = {
    urgent: tasks.filter(t => t.priority === 'urgent').length,
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  };

  const statusStats = {
    completed: tasks.filter(t => t.status === 'completed').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
  };

  const columns = [
    {
      key: 'title',
      label: 'Task',
      render: (task: Task) => (
        <div 
          onClick={() => router.push(`/admin/tasks/${task.id}`)}
          className="cursor-pointer"
        >
          <p className="font-medium">{task.title}</p>
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (task: Task) => (
        <Badge variant={priorityColors[task.priority || 'medium']}>
          {task.priority || 'medium'}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (task: Task) => {
        const statusVariants = {
          completed: 'success' as const,
          in_progress: 'primary' as const,
          pending: 'secondary' as const,
        };
        return (
          <Badge variant={statusVariants[task.status as keyof typeof statusVariants] || 'secondary'}>
            {task.status || 'pending'}
          </Badge>
        );
      }
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (task: Task) => task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (task: Task) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/tasks/${task.id}/edit`);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(task.id);
            }}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-gray-600 mt-1">Manage and track tasks across all projects</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => router.push('/admin/submissions')} 
            leftIcon={<FileText className="h-4 w-4" />}
          >
            View Submissions
          </Button>
          <Button onClick={() => router.push('/admin/tasks/new')} leftIcon={<Plus className="h-4 w-4" />}>
            Create Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgent Tasks</p>
                <p className="text-2xl font-bold text-red-600">{priorityStats.urgent}</p>
              </div>
              <Target className="h-8 w-8 text-red-500" />
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{statusStats.in_progress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{statusStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
              <Users className="h-8 w-8 text-gray-500" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <Card.Content className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((category) => ({
                  value: category.id,
                  label: category.name
                }))
              ]}
              className="w-48"
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
              className="w-48"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Spinner size="lg" />
            </div>
          ) : tasks.length > 0 ? (
            <Table
              columns={columns}
              data={tasks}
              className="cursor-pointer"
            />
          ) : (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tasks found</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first task to get started'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} tasks
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 20, 50, 100]}
                className="justify-end"
              />
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}