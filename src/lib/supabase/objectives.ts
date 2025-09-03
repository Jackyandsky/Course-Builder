import { Objective } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  stats?: {
    total: number;
    templates: number;
    non_templates: number;
  };
}

export const objectiveService = {
  // Get all objectives with optional filters - uses API route
  async getObjectives(filters: ObjectiveFilters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }

      const response = await fetch(`/api/objectives?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch objectives');
      }

      return await response.json() as Objective[];
    } catch (error) {
      console.error('Error fetching objectives:', error);
      throw error;
    }
  },

  // Get single objective by ID - uses API route
  async getObjective(id: string) {
    try {
      const response = await fetch(`/api/objectives/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch objective');
      }

      return await response.json() as Objective;
    } catch (error) {
      console.error('Error fetching objective:', error);
      throw error;
    }
  },

  // Create new objective - uses API route
  async createObjective(objectiveData: CreateObjectiveData) {
    try {
      const response = await fetch('/api/objectives', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(objectiveData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create objective');
      }

      return await response.json() as Objective;
    } catch (error) {
      console.error('Error creating objective:', error);
      throw error;
    }
  },

  // Update objective - uses API route
  async updateObjective({ id, ...objectiveData }: UpdateObjectiveData) {
    try {
      const response = await fetch(`/api/objectives/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(objectiveData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update objective');
      }

      return await response.json() as Objective;
    } catch (error) {
      console.error('Error updating objective:', error);
      throw error;
    }
  },

  // Delete objective - uses API route
  async deleteObjective(id: string) {
    try {
      const response = await fetch(`/api/objectives/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete objective');
      }
    } catch (error) {
      console.error('Error deleting objective:', error);
      throw error;
    }
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

  // Course relationship methods - use API routes
  async getCourseObjectives(courseId: string) {
    try {
      const response = await fetch(`/api/courses/${courseId}/objectives`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch course objectives');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course objectives:', error);
      throw error;
    }
  },

  async addObjectiveToCourse(courseId: string, objectiveId: string, options: { position: number }) {
    try {
      const response = await fetch(`/api/courses/${courseId}/objectives`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          objectiveIds: [objectiveId]
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add objective to course');
      }

      const data = await response.json();
      return data[0]; // Return first item since we only added one
    } catch (error) {
      console.error('Error adding objective to course:', error);
      throw error;
    }
  },

  async removeObjectiveFromCourse(relationId: string) {
    try {
      const response = await fetch(`/api/course-objectives/${relationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove objective from course');
      }
    } catch (error) {
      console.error('Error removing objective from course:', error);
      throw error;
    }
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

  // Get optimized admin objectives list - lightweight for performance
  async getAdminObjectivesList(filters: ObjectiveFilters & { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<Objective>> {
    try {
      console.log('[ObjectiveService] Getting admin objectives list with filters:', filters);
      const startTime = Date.now();
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.categoryId) params.append('category_id', filters.categoryId);
      params.append('page', String(filters.page || 1));
      params.append('perPage', String(filters.perPage || 20));
      
      // Use optimized admin-list endpoint
      const response = await fetch(`/api/objectives/admin-list?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Admin objectives list API error:', error);
        throw new Error(error.error || 'Failed to fetch admin objectives list');
      }
      
      const result = await response.json();
      const endTime = Date.now();
      
      console.log(`[ObjectiveService] Admin objectives list loaded in ${endTime - startTime}ms (API: ${result.loadTime}ms)`);
      
      return result;
    } catch (error) {
      console.error('Error fetching admin objectives list:', error);
      throw error;
    }
  },
};