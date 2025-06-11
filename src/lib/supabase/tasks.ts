import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Task, DifficultyLevel } from '@/types/database';

const supabase = createClientComponentClient();

export interface TaskFilters {
  categoryId?: string;
  difficulty?: DifficultyLevel;
  durationMin?: number;
  durationMax?: number;
  isTemplate?: boolean;
  search?: string;
  tags?: string[];
}

export interface CreateTaskData {
  title: string;
  description?: string;
  category_id?: string;
  instructions?: string;
  duration_minutes?: number;
  difficulty?: DifficultyLevel;
  materials_needed?: string[];
  assessment_criteria?: string;
  tags?: string[];
  is_template?: boolean;
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
    
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    
    if (filters.durationMin !== undefined) {
      query = query.gte('duration_minutes', filters.durationMin);
    }
    
    if (filters.durationMax !== undefined) {
      query = query.lte('duration_minutes', filters.durationMax);
    }
    
    if (filters.isTemplate !== undefined) {
      query = query.eq('is_template', filters.isTemplate);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,instructions.ilike.%${filters.search}%`);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
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
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        user_id: user.user.id,
        difficulty: taskData.difficulty ?? 'beginner',
        is_template: taskData.is_template ?? false,
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

  // Get tasks by difficulty
  async getTasksByDifficulty(difficulty: DifficultyLevel) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('difficulty', difficulty)
      .order('title', { ascending: true });
    
    if (error) throw error;
    return data as Task[];
  },

  // Get tasks by duration range
  async getTasksByDuration(minMinutes: number, maxMinutes: number) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .gte('duration_minutes', minMinutes)
      .lte('duration_minutes', maxMinutes)
      .order('duration_minutes', { ascending: true });
    
    if (error) throw error;
    return data as Task[];
  },

  // Clone task as template
  async cloneAsTemplate(id: string, newTitle?: string) {
    const original = await this.getTask(id);
    
    return this.createTask({
      title: newTitle || `${original.title} (Template)`,
      description: original.description,
      category_id: original.category_id,
      instructions: original.instructions,
      duration_minutes: original.duration_minutes,
      difficulty: original.difficulty,
      materials_needed: original.materials_needed,
      assessment_criteria: original.assessment_criteria,
      tags: original.tags,
      is_template: true,
    });
  },

  // Get task statistics
  async getTaskStats() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .select('difficulty, duration_minutes, is_template', { count: 'exact' })
      .eq('user_id', user.user.id);
    
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      templates: data?.filter(t => t.is_template).length || 0,
      averageDuration: data?.length ? 
        Math.round(data.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / data.length) : 0,
      byDifficulty: {
        beginner: data?.filter(t => t.difficulty === 'beginner').length || 0,
        intermediate: data?.filter(t => t.difficulty === 'intermediate').length || 0,
        advanced: data?.filter(t => t.difficulty === 'advanced').length || 0,
        expert: data?.filter(t => t.difficulty === 'expert').length || 0,
      },
      byDurationRange: {
        short: data?.filter(t => (t.duration_minutes || 0) <= 15).length || 0, // 0-15 mins
        medium: data?.filter(t => (t.duration_minutes || 0) > 15 && (t.duration_minutes || 0) <= 45).length || 0, // 16-45 mins
        long: data?.filter(t => (t.duration_minutes || 0) > 45).length || 0, // 45+ mins
      },
    };

    return stats;
  },

  // Get popular materials for tasks
  async getPopularMaterials(limit: number = 10) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .select('materials_needed')
      .eq('user_id', user.user.id)
      .not('materials_needed', 'is', null);
    
    if (error) throw error;

    // Flatten and count materials
    const materialCounts: Record<string, number> = {};
    data?.forEach(task => {
      task.materials_needed?.forEach((material: string) => {
        materialCounts[material] = (materialCounts[material] || 0) + 1;
      });
    });

    // Sort by count and return top items
    return Object.entries(materialCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([material, count]) => ({ material, count }));
  },

  // Get tasks suitable for specific lesson duration
  async getTasksForLessonDuration(lessonDurationMinutes: number, bufferMinutes: number = 5) {
    const maxTaskDuration = lessonDurationMinutes - bufferMinutes;
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .lte('duration_minutes', maxTaskDuration)
      .order('duration_minutes', { ascending: false });
    
    if (error) throw error;
    return data as Task[];
  },

  // Get assessment rubric suggestions
  getAssessmentCriteriaSuggestions() {
    return [
      'Accuracy of completion',
      'Time management',
      'Following instructions',
      'Creativity and innovation',
      'Collaboration and teamwork',
      'Communication skills',
      'Problem-solving approach',
      'Quality of final product',
      'Use of resources',
      'Reflection and self-assessment',
    ];
  },

  // Get difficulty level descriptions
  getDifficultyDescriptions() {
    return {
      beginner: 'Basic concepts, minimal prior knowledge required',
      intermediate: 'Some familiarity with topic, moderate complexity',
      advanced: 'Strong foundation required, complex problem-solving',
      expert: 'Mastery level, highly complex and nuanced tasks',
    };
  },
};