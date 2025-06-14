'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { taskService } from '@/lib/supabase/tasks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { 
  FileText,
  Plus,
  Trash2,
  Search,
  ExternalLink
} from 'lucide-react';

interface CourseTaskManagerProps {
  courseId: string;
  onUpdate?: () => void;
}

export function CourseTaskManager({ courseId, onUpdate }: CourseTaskManagerProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [courseTasks, setCourseTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTasks, courseTaskRelations] = await Promise.all([
        taskService.getTasks({}),
        taskService.getCourseTasks(courseId)
      ]);
      
      setTasks(allTasks);
      setCourseTasks(courseTaskRelations);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => 
    !courseTasks.some(ct => ct.task.id === task.id) &&
    (task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     task.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTasks = async () => {
    if (selectedTasks.length === 0) return;

    setAdding(true);
    try {
      for (const taskId of selectedTasks) {
        await taskService.addTaskToCourse(courseId, taskId, {
          position: courseTasks.length + selectedTasks.indexOf(taskId)
        });
      }
      
      setShowAddModal(false);
      setSelectedTasks([]);
      setSearchTerm('');
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add tasks to course:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTask = async (relationId: string) => {
    try {
      await taskService.removeTaskFromCourse(relationId);
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to remove task from course:', error);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Course Tasks
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {courseTasks.length} task{courseTasks.length !== 1 ? 's' : ''} assigned to this course
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Tasks
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/tasks/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create New
          </Button>
        </div>
      </div>

      {/* Course Tasks List */}
      {courseTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No tasks assigned
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Add learning tasks and assignments for students to complete
          </p>
          <Button 
            className="mt-4" 
            size="sm"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Tasks
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {courseTasks
            .sort((a, b) => a.position - b.position)
            .map((courseTask) => (
              <Card key={courseTask.id} className="hover:shadow-md transition-shadow">
                <Card.Content className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg">
                          {courseTask.task.title}
                        </h4>
                        {courseTask.task.priority && (
                          <Badge variant={getPriorityColor(courseTask.task.priority)} size="sm">
                            {courseTask.task.priority}
                          </Badge>
                        )}
                        {courseTask.task.category && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: courseTask.task.category.color ? `${courseTask.task.category.color}20` : undefined,
                              color: courseTask.task.category.color || undefined,
                            }}
                          >
                            {courseTask.task.category.name}
                          </span>
                        )}
                      </div>
                      
                      {courseTask.task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {courseTask.task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4">
                        {courseTask.task.points && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Points: {courseTask.task.points}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/tasks/${courseTask.task.id}/edit`)}
                        leftIcon={<ExternalLink className="h-4 w-4" />}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTask(courseTask.id)}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
        </div>
      )}

      {/* Add Tasks Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedTasks([]);
          setSearchTerm('');
        }}
        title="Add Tasks to Course"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No tasks found matching your search.' : 'All available tasks are already added to this course.'}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTasks.includes(task.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => toggleTaskSelection(task.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{task.title}</h5>
                        {task.priority && (
                          <Badge variant={getPriorityColor(task.priority)} size="sm">
                            {task.priority}
                          </Badge>
                        )}
                        {task.category && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: task.category.color ? `${task.category.color}20` : undefined,
                              color: task.category.color || undefined,
                            }}
                          >
                            {task.category.name}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {task.description}
                        </p>
                      )}
                      {task.points && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Points: {task.points}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setSelectedTasks([]);
                setSearchTerm('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTasks}
              disabled={selectedTasks.length === 0 || adding}
              leftIcon={adding ? <Spinner size="sm" /> : <Plus className="h-4 w-4" />}
            >
              {adding ? 'Adding...' : `Add ${selectedTasks.length} Task${selectedTasks.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}