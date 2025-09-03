import { createSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { Task, DifficultyLevel } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

// Keep for legacy methods that still need direct access
const getSupabase = () => createSupabaseClient();

export interface TaskFilters {
  categoryId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  search?: string;
  pointsMin?: number;
  pointsMax?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  category_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  points?: number;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  id: string;
}

export const taskService = {
  // Get all tasks with optional filters - uses API route
  async getTasks(filters: TaskFilters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId);
      }
      if (filters.priority) {
        params.append('priority', filters.priority);
      }
      if (filters.pointsMin !== undefined) {
        params.append('pointsMin', filters.pointsMin.toString());
      }
      if (filters.pointsMax !== undefined) {
        params.append('pointsMax', filters.pointsMax.toString());
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://builder.vanboss.work' 
        : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      const response = await fetch(`${baseUrl}/api/tasks?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tasks');
      }

      return await response.json() as Task[];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  // Get single task by ID - uses API route
  async getTask(id: string) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch task');
      }

      return await response.json() as Task;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  },

  // Create new task - uses API route
  async createTask(taskData: CreateTaskData) {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      return await response.json() as Task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Update task - uses API route
  async updateTask({ id, ...taskData }: UpdateTaskData) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task');
      }

      return await response.json() as Task;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Delete task - uses API route
  async deleteTask(id: string) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Get tasks by category
  async getTasksByCategory(categoryId: string) {
    const { data, error } = await getSupabase()
      .from('tasks')
      .select('*')
      .eq('category_id', categoryId)
      .order('title', { ascending: true });
    
    if (error) throw error;
    return data as Task[];
  },

  // Get template tasks
  async getTemplateTasks() {
    const { data, error } = await getSupabase()
      .from('tasks')
      .select('*')
      .eq('is_template', true)
      .order('title', { ascending: true });
    
    if (error) throw error;
    return data as Task[];
  },

  // Clone task
  async cloneTask(id: string, newTitle?: string) {
    const original = await this.getTask(id);
    
    return this.createTask({
      title: newTitle || `${original.title} (Copy)`,
      description: original.description,
      category_id: original.category_id,
      priority: original.priority,
      points: original.points,
    });
  },

  // Get task statistics
  async getTaskStats() {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('tasks')
      .select('priority, points', { count: 'exact' })
      .eq('user_id', user?.id || SHARED_USER_ID);
    
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      totalPoints: data?.reduce((sum, t) => sum + (t.points || 0), 0) || 0,
      averagePoints: data?.length ? 
        Math.round((data.reduce((sum, t) => sum + (t.points || 0), 0) / data.length) * 100) / 100 : 0,
      byPriority: {
        low: data?.filter(t => t.priority === 'low').length || 0,
        medium: data?.filter(t => t.priority === 'medium').length || 0,
        high: data?.filter(t => t.priority === 'high').length || 0,
        urgent: data?.filter(t => t.priority === 'urgent').length || 0,
      },
    };

    return stats;
  },

  // Course relationship methods - use API routes
  async getCourseTasks(courseId: string) {
    try {
      const response = await fetch(`/api/courses/${courseId}/tasks`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch course tasks');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course tasks:', error);
      throw error;
    }
  },

  async addTaskToCourse(courseId: string, taskId: string, options: { position: number }) {
    try {
      const response = await fetch(`/api/courses/${courseId}/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskIds: [taskId]
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add task to course');
      }

      const data = await response.json();
      return data[0]; // Return first item since we only added one
    } catch (error) {
      console.error('Error adding task to course:', error);
      throw error;
    }
  },

  async removeTaskFromCourse(relationId: string) {
    try {
      const response = await fetch(`/api/course-tasks/${relationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove task from course');
      }
    } catch (error) {
      console.error('Error removing task from course:', error);
      throw error;
    }
  },

  // Lesson relationship methods - use API routes
  async getLessonTasks(lessonId: string) {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/tasks`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch lesson tasks');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching lesson tasks:', error);
      throw error;
    }
  },

  async addTaskToLesson(lessonId: string, taskId: string, options: { position: number }) {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          position: options.position
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add task to lesson');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding task to lesson:', error);
      throw error;
    }
  },

  async removeTaskFromLesson(relationId: string) {
    // Extract lessonId from somewhere or modify API to accept relationId
    // For now, this needs to be handled differently
    console.warn('removeTaskFromLesson needs lessonId - using workaround');
    
    // First get the relation to find the lesson_id
    const { data: relation } = await getSupabase()
      .from('lesson_tasks')
      .select('lesson_id')
      .eq('id', relationId)
      .single();
    
    if (!relation) throw new Error('Relation not found');
    
    try {
      const response = await fetch(`/api/lessons/${relation.lesson_id}/tasks?relationId=${relationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove task from lesson');
      }
    } catch (error) {
      console.error('Error removing task from lesson:', error);
      throw error;
    }
  },

  // Get task with its belonging relationships
  async getTaskWithBelongings(taskId: string) {
    const supabase = getSupabase();
    
    // Get the task first
    const task = await this.getTask(taskId);
    
    // Get course relationships - simplified query without join
    const { data: courseData, error: courseError } = await supabase
      .from('course_tasks')
      .select('course_id')
      .eq('task_id', taskId);
    
    // Get lesson relationships - simplified query without join
    const { data: lessonData, error: lessonError } = await supabase
      .from('lesson_tasks')
      .select('lesson_id')
      .eq('task_id', taskId);

    console.log('Task ID:', taskId);
    console.log('Course data raw:', courseData);
    console.log('Lesson data raw:', lessonData);
    console.log('Course error:', courseError);
    console.log('Lesson error:', lessonError);
    
    // Map the data to extract just the lesson/course IDs
    const courseIds = courseData?.map(item => item.course_id) || [];
    const lessonIds = lessonData?.map(item => item.lesson_id) || [];
    
    console.log('Extracted course IDs:', courseIds);
    console.log('Extracted lesson IDs:', lessonIds);

    return {
      ...task,
      belongingCourses: courseIds,
      belongingLessons: lessonIds,
    };
  },

  // Get all tasks with their belonging relationships
  async getTasksWithBelongings(filters: TaskFilters = {}) {
    // For now, just return tasks without belongings to fix the admin page
    // The relationships can be loaded separately when needed
    return await this.getTasks(filters);
  },

  // Remove task from all courses
  async removeTaskFromAllCourses(taskId: string) {
    const { error } = await getSupabase()
      .from('course_tasks')
      .delete()
      .eq('task_id', taskId);
    
    if (error) throw error;
  },

  // Remove task from all lessons
  async removeTaskFromAllLessons(taskId: string) {
    const { error } = await getSupabase()
      .from('lesson_tasks')
      .delete()
      .eq('task_id', taskId);
    
    if (error) throw error;
  },
};