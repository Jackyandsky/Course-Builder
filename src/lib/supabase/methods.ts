import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Method } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

const supabase = createClientComponentClient();

export interface MethodFilters {
  categoryId?: string;
  search?: string;
  tags?: string[];
}

export interface CreateMethodData {
  name: string;
  description?: string;
  category_id?: string;
  tags?: string[];
}

export interface UpdateMethodData extends Partial<CreateMethodData> {
  id: string;
}

export const methodService = {
  // Get all methods with optional filters
  async getMethods(filters: MethodFilters = {}) {
    let query = supabase
      .from('methods')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Method[];
  },

  // Get single method by ID
  async getMethod(id: string) {
    const { data, error } = await supabase
      .from('methods')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Method;
  },

  // Create new method
  async createMethod(methodData: CreateMethodData) {
    const { data, error } = await supabase
      .from('methods')
      .insert({
        ...methodData,
        user_id: SHARED_USER_ID,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Method;
  },

  // Update method
  async updateMethod({ id, ...methodData }: UpdateMethodData) {
    const { data, error } = await supabase
      .from('methods')
      .update({
        ...methodData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Method;
  },

  // Delete method
  async deleteMethod(id: string) {
    const { error } = await supabase
      .from('methods')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get methods by category
  async getMethodsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('methods')
      .select('*')
      .eq('category_id', categoryId)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as Method[];
  },

  // Clone method as template
  async cloneAsTemplate(id: string, newTitle?: string) {
    const original = await this.getMethod(id);
    
    return this.createMethod({
      name: newTitle || `${original.title} (Copy)`,
      description: original.description,
      category_id: original.category_id,
      tags: original.tags,
    });
  },

  // Get method statistics
  async getMethodStats() {
    const { data, error } = await supabase
      .from('methods')
      .select('tags', { count: 'exact' });
    
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byCategory: {} as Record<string, number>,
      popularTags: [] as Array<{ tag: string; count: number }>,
    };

    // Count popular tags
    const tagCounts: Record<string, number> = {};
    data?.forEach(method => {
      method.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort tags by popularity and get top 10
    stats.popularTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return stats;
  },

  // Course relationship methods
  async getCourseMethods(courseId: string) {
    const { data, error } = await supabase
      .from('course_methods')
      .select(`
        id,
        position,
        method:methods(
          id,
          name,
          description,
          tags,
          category:categories(id, name, color, icon)
        )
      `)
      .eq('course_id', courseId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async addMethodToCourse(courseId: string, methodId: string, options: { position: number }) {
    const { data, error } = await supabase
      .from('course_methods')
      .insert({
        course_id: courseId,
        method_id: methodId,
        position: options.position
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeMethodFromCourse(relationId: string) {
    const { error } = await supabase
      .from('course_methods')
      .delete()
      .eq('id', relationId);
    
    if (error) throw error;
  },

  // Lesson relationship methods
  async getLessonMethods(lessonId: string) {
    const { data, error } = await supabase
      .from('lesson_methods')
      .select(`
        id,
        position,
        method:methods(
          id,
          name,
          description,
          tags,
          category:categories(id, name, color, icon)
        )
      `)
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async addMethodToLesson(lessonId: string, methodId: string, options: { position: number }) {
    const { data, error } = await supabase
      .from('lesson_methods')
      .insert({
        lesson_id: lessonId,
        method_id: methodId,
        position: options.position
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeMethodFromLesson(relationId: string) {
    const { error } = await supabase
      .from('lesson_methods')
      .delete()
      .eq('id', relationId);
    
    if (error) throw error;
  },

  // Get method with its belonging relationships
  async getMethodWithBelongings(methodId: string) {
    const [method, courseRelations, lessonRelations] = await Promise.all([
      this.getMethod(methodId),
      supabase
        .from('course_methods')
        .select('course:courses(id, title)')
        .eq('method_id', methodId),
      supabase
        .from('lesson_methods')
        .select('lesson:lessons(id, topic, title, lesson_number)')
        .eq('method_id', methodId)
    ]);

    return {
      ...method,
      belongingCourses: courseRelations.data?.map(r => r.course) || [],
      belongingLessons: lessonRelations.data?.map(r => r.lesson) || [],
    };
  },

  // Get all methods with their belonging relationships
  async getMethodsWithBelongings(filters: MethodFilters = {}) {
    const methods = await this.getMethods(filters);
    
    // Get all relationships in parallel
    const methodIds = methods.map(m => m.id);
    
    const [courseRelations, lessonRelations] = await Promise.all([
      supabase
        .from('course_methods')
        .select('method_id, course:courses(id, title)')
        .in('method_id', methodIds),
      supabase
        .from('lesson_methods')
        .select('method_id, lesson:lessons(id, topic, title, lesson_number)')
        .in('method_id', methodIds)
    ]);

    // Map relationships to methods
    return methods.map(method => ({
      ...method,
      belongingCourses: courseRelations.data?.filter(r => r.method_id === method.id)?.map(r => r.course) || [],
      belongingLessons: lessonRelations.data?.filter(r => r.method_id === method.id)?.map(r => r.lesson) || [],
    }));
  },

  // Remove method from all courses
  async removeMethodFromAllCourses(methodId: string) {
    const { error } = await supabase
      .from('course_methods')
      .delete()
      .eq('method_id', methodId);
    
    if (error) throw error;
  },

  // Remove method from all lessons
  async removeMethodFromAllLessons(methodId: string) {
    const { error } = await supabase
      .from('lesson_methods')
      .delete()
      .eq('method_id', methodId);
    
    if (error) throw error;
  },
};