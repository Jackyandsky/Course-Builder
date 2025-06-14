import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Objective } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

const supabase = createClientComponentClient();

export interface ObjectiveFilters {
  categoryId?: string;
  search?: string;
  tags?: string[];
}

export interface CreateObjectiveData {
  title: string;
  description?: string;
  category_id?: string;
  tags?: string[];
}

export interface UpdateObjectiveData extends Partial<CreateObjectiveData> {
  id: string;
}

export const objectiveService = {
  // Get all objectives with optional filters
  async getObjectives(filters: ObjectiveFilters = {}) {
    let query = supabase
      .from('objectives')
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
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Objective[];
  },

  // Get single objective by ID
  async getObjective(id: string) {
    const { data, error } = await supabase
      .from('objectives')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Objective;
  },

  // Create new objective
  async createObjective(objectiveData: CreateObjectiveData) {
    const { data, error } = await supabase
      .from('objectives')
      .insert({
        ...objectiveData,
        user_id: SHARED_USER_ID,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Objective;
  },

  // Update objective
  async updateObjective({ id, ...objectiveData }: UpdateObjectiveData) {
    const { data, error } = await supabase
      .from('objectives')
      .update({
        ...objectiveData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Objective;
  },

  // Delete objective
  async deleteObjective(id: string) {
    const { error } = await supabase
      .from('objectives')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get objectives by category
  async getObjectivesByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('objectives')
      .select('*')
      .eq('category_id', categoryId)
      .order('title', { ascending: true });
    
    if (error) throw error;
    return data as Objective[];
  },

  // Clone objective
  async cloneObjective(id: string, newTitle?: string) {
    const original = await this.getObjective(id);
    
    return this.createObjective({
      title: newTitle || `${original.title} (Copy)`,
      description: original.description,
      category_id: original.category_id,
      tags: original.tags,
    });
  },

  // Get objective statistics
  async getObjectiveStats() {
    const { data, error } = await supabase
      .from('objectives')
      .select('tags', { count: 'exact' });
    
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      popularTags: [] as Array<{ tag: string; count: number }>,
    };

    // Count popular tags
    const tagCounts: Record<string, number> = {};
    data?.forEach(objective => {
      objective.tags?.forEach((tag: string) => {
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
  async getCourseObjectives(courseId: string) {
    const { data, error } = await supabase
      .from('course_objectives')
      .select(`
        id,
        position,
        objective:objectives(
          id,
          title,
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

  async addObjectiveToCourse(courseId: string, objectiveId: string, options: { position: number }) {
    const { data, error } = await supabase
      .from('course_objectives')
      .insert({
        course_id: courseId,
        objective_id: objectiveId,
        position: options.position
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeObjectiveFromCourse(relationId: string) {
    const { error } = await supabase
      .from('course_objectives')
      .delete()
      .eq('id', relationId);
    
    if (error) throw error;
  },

  // Lesson relationship methods
  async getLessonObjectives(lessonId: string) {
    const { data, error } = await supabase
      .from('lesson_objectives')
      .select(`
        id,
        position,
        objective:objectives(
          id,
          title,
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

  async addObjectiveToLesson(lessonId: string, objectiveId: string, options: { position: number }) {
    const { data, error } = await supabase
      .from('lesson_objectives')
      .insert({
        lesson_id: lessonId,
        objective_id: objectiveId,
        position: options.position
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeObjectiveFromLesson(relationId: string) {
    const { error } = await supabase
      .from('lesson_objectives')
      .delete()
      .eq('id', relationId);
    
    if (error) throw error;
  },

  // Get objective with its belonging relationships
  async getObjectiveWithBelongings(objectiveId: string) {
    const [objective, courseRelations, lessonRelations] = await Promise.all([
      this.getObjective(objectiveId),
      supabase
        .from('course_objectives')
        .select('course:courses(id, title)')
        .eq('objective_id', objectiveId),
      supabase
        .from('lesson_objectives')
        .select('lesson:lessons(id, topic, title, lesson_number)')
        .eq('objective_id', objectiveId)
    ]);

    return {
      ...objective,
      belongingCourses: courseRelations.data?.map(r => r.course) || [],
      belongingLessons: lessonRelations.data?.map(r => r.lesson) || [],
    };
  },

  // Get all objectives with their belonging relationships
  async getObjectivesWithBelongings(filters: ObjectiveFilters = {}) {
    const objectives = await this.getObjectives(filters);
    
    // Get all relationships in parallel
    const objectiveIds = objectives.map(o => o.id);
    
    const [courseRelations, lessonRelations] = await Promise.all([
      supabase
        .from('course_objectives')
        .select('objective_id, course:courses(id, title)')
        .in('objective_id', objectiveIds),
      supabase
        .from('lesson_objectives')
        .select('objective_id, lesson:lessons(id, topic, title, lesson_number)')
        .in('objective_id', objectiveIds)
    ]);

    // Map relationships to objectives
    return objectives.map(objective => ({
      ...objective,
      belongingCourses: courseRelations.data?.filter(r => r.objective_id === objective.id)?.map(r => r.course) || [],
      belongingLessons: lessonRelations.data?.filter(r => r.objective_id === objective.id)?.map(r => r.lesson) || [],
    }));
  },

  // Remove objective from all courses
  async removeObjectiveFromAllCourses(objectiveId: string) {
    const { error } = await supabase
      .from('course_objectives')
      .delete()
      .eq('objective_id', objectiveId);
    
    if (error) throw error;
  },

  // Remove objective from all lessons
  async removeObjectiveFromAllLessons(objectiveId: string) {
    const { error } = await supabase
      .from('lesson_objectives')
      .delete()
      .eq('objective_id', objectiveId);
    
    if (error) throw error;
  },
};