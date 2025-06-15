'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { taskService } from '@/lib/supabase/tasks';
import { lessonService } from '@/lib/supabase/lessons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { SearchBox } from '@/components/ui/SearchBox';
import { Spinner } from '@/components/ui/Spinner';
import { 
  FileText,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  Clock,
  Calendar
} from 'lucide-react';

interface LessonTaskManagerProps {
  lessonId: string;
  courseId?: string;
  onUpdate?: () => void;
}

export function LessonTaskManager({ lessonId, courseId, onUpdate }: LessonTaskManagerProps) {
  console.log('LessonTaskManager rendered with props:', { lessonId, courseId }); // Debug log
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [lessonTasks, setLessonTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [lessonId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTasks, lesson] = await Promise.all([
        courseId ? taskService.getCourseTasks(courseId) : taskService.getTasks({}),
        lessonService.getLesson(lessonId)
      ]);
      
      setTasks(allTasks);
      setLessonTasks(lesson?.lesson_tasks || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableTasks = tasks.filter(task => 
    !lessonTasks.some(lt => lt.task_id === task.id) &&
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTasks = async () => {
    if (selectedTasks.length === 0) return;
    
    setAdding(true);
    try {
      for (let i = 0; i < selectedTasks.length; i++) {
        const taskId = selectedTasks[i];
        const position = lessonTasks.length + i; // Add to end
        await taskService.addTaskToLesson(lessonId, taskId, { position });
      }
      
      await loadData();
      setSelectedTasks([]);
      setShowAddModal(false);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add tasks:', error);
      alert('Failed to add tasks');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTask = async (relationId: string) => {
    if (!confirm('Remove this task from the lesson?')) return;

    try {
      await taskService.removeTaskFromLesson(relationId);
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to remove task:', error);
      alert('Failed to remove task');
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
    switch (priority?.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'outline';
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
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Lesson Tasks</h3>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Tasks
            </Button>
            <Button 
              onClick={() => router.push('/tasks/new')} 
              variant="outline" 
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>
        </div>
        
        {/* Debug info */}
        <div className="text-sm text-gray-500">
          Debug: lessonId={lessonId}, courseId={courseId}, tasks count={lessonTasks.length}, loading={loading}
        </div>

        {lessonTasks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {lessonTasks.map((lessonTask) => (
              <Card key={lessonTask.id} className="relative">
                <Card.Content className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{lessonTask.task?.title}</h4>
                      {lessonTask.task?.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {lessonTask.task.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTask(lessonTask.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {lessonTask.task?.priority && (
                      <Badge variant={getPriorityColor(lessonTask.task.priority)}>
                        {lessonTask.task.priority}
                      </Badge>
                    )}
                    {lessonTask.is_homework && (
                      <Badge variant="secondary">Homework</Badge>
                    )}
                    {lessonTask.task?.points && (
                      <Badge variant="outline">{lessonTask.task.points} pts</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      {(lessonTask.task?.duration_minutes || lessonTask.duration_override) && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>~{lessonTask.duration_override || lessonTask.task?.duration_minutes} min</span>
                        </div>
                      )}
                      {lessonTask.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {new Date(lessonTask.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/tasks/${lessonTask.task_id}`)}
                      className="p-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No tasks assigned
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by adding tasks to this lesson.
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tasks
            </Button>
          </div>
        )}
      </div>

      <Modal
        title={`Add Tasks to Lesson${courseId ? ' (from course)' : ''}`}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        size="lg"
      >
        <div className="space-y-4">
          <SearchBox
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks..."
          />

          {availableTasks.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {availableTasks.map((task) => (
                <div
                  key={task.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedTasks.includes(task.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
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
                      <h4 className="font-medium mb-1">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {task.priority && (
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                            {task.priority}
                          </Badge>
                        )}
                        {task.category?.name && (
                          <Badge variant="outline" className="text-xs">
                            {task.category.name}
                          </Badge>
                        )}
                        {task.points && (
                          <Badge variant="secondary" className="text-xs">
                            {task.points} pts
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">
              {courseId ? "No course tasks available to add" : "No tasks found"}
            </p>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTasks}
              disabled={selectedTasks.length === 0}
              loading={adding}
            >
              Add {selectedTasks.length} Task{selectedTasks.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}