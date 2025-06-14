import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Task, DifficultyLevel } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

const supabase = createClientComponentClient();

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
  // Get all tasks with optional filters
  async getTasks(filters: TaskFilters = {}) {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters.pointsMin !== undefined) {
      query = query.gte('points', filters.pointsMin);
    }
    
    if (filters.pointsMax !== undefined) {
      query = query.lte('points', filters.pointsMax);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Task[];
  },

  // Get single task by ID
  async getTask(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Task;
  },

  // Create new task
  async createTask(taskData: CreateTaskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        user_id: SHARED_USER_ID,
        priority: taskData.priority ?? 'medium',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Task;
  },

  // Update task
  async updateTask({ id, ...taskData }: UpdateTaskData) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...taskData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Task;
  },

  // Delete task
  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get tasks by category
  async getTasksByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('category_id', categoryId)
      .order('title', { ascending: true });
    
    if (error) throw error;
    return data as Task[];
  },

  // Get template tasks
  async getTemplateTasks() {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('tasks')
      .select('priority, points', { count: 'exact' })
      .eq('user_id', SHARED_USER_ID);
    
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

  // Course relationship methods
  async getCourseTasks(courseId: string) {
    const { data, error } = await supabase
      .from('course_tasks')
      .select(`
        id,
        position,
        task:tasks(
          id,
          title,
          description,
          priority,
          points,
          category:categories(id, name, color, icon)
        )
      `)
      .eq('course_id', courseId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async addTaskToCourse(courseId: string, taskId: string, options: { position: number }) {
    const { data, error } = await supabase
      .from('course_tasks')
      .insert({
        course_id: courseId,
        task_id: taskId,
        position: options.position
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeTaskFromCourse(relationId: string) {
    const { error } = await supabase
      .from('course_tasks')
      .delete()
      .eq('id', relationId);
    
    if (error) throw error;
  },

  // Lesson relationship methods
  async getLessonTasks(lessonId: string) {
    const { data, error } = await supabase
      .from('lesson_tasks')
      .select(`
        id,
        position,
        task:tasks(
          id,
          title,
          description,
          priority,
          points,
          category:categories(id, name, color, icon)
        )
      `)
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async addTaskToLesson(lessonId: string, taskId: string, options: { position: number }) {
    const { data, error } = await supabase
      .from('lesson_tasks')
      .insert({
        lesson_id: lessonId,
        task_id: taskId,
        position: options.position
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeTaskFromLesson(relationId: string) {
    const { error } = await supabase
      .from('lesson_tasks')
      .delete()
      .eq('id', relationId);
    
    if (error) throw error;
  },

  // Get task with its belonging relationships
  async getTaskWithBelongings(taskId: string) {
    const [task, courseRelations, lessonRelations] = await Promise.all([
      this.getTask(taskId),
      supabase
        .from('course_tasks')
        .select('course:courses(id, title)')
        .eq('task_id', taskId),
      supabase
        .from('lesson_tasks')
        .select('lesson:lessons(id, topic, title, lesson_number)')
        .eq('task_id', taskId)
    ]);

    return {
      ...task,
      belongingCourses: courseRelations.data?.map(r => r.course) || [],
      belongingLessons: lessonRelations.data?.map(r => r.lesson) || [],
    };
  },

  // Get all tasks with their belonging relationships
  async getTasksWithBelongings(filters: TaskFilters = {}) {
    const tasks = await this.getTasks(filters);
    
    // Get all relationships in parallel
    const taskIds = tasks.map(t => t.id);
    
    const [courseRelations, lessonRelations] = await Promise.all([
      supabase
        .from('course_tasks')
        .select('task_id, course:courses(id, title)')
        .in('task_id', taskIds),
      supabase
        .from('lesson_tasks')
        .select('task_id, lesson:lessons(id, topic, title, lesson_number)')
        .in('task_id', taskIds)
    ]);

    // Map relationships to tasks
    return tasks.map(task => ({
      ...task,
      belongingCourses: courseRelations.data?.filter(r => r.task_id === task.id)?.map(r => r.course) || [],
      belongingLessons: lessonRelations.data?.filter(r => r.task_id === task.id)?.map(r => r.lesson) || [],
    }));
  },

  // Remove task from all courses
  async removeTaskFromAllCourses(taskId: string) {
    const { error } = await supabase
      .from('course_tasks')
      .delete()
      .eq('task_id', taskId);
    
    if (error) throw error;
  },

  // Remove task from all lessons
  async removeTaskFromAllLessons(taskId: string) {
    const { error } = await supabase
      .from('lesson_tasks')
      .delete()
      .eq('task_id', taskId);
    
    if (error) throw error;
  },
};