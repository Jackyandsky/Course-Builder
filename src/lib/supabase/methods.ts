import { Method } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

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
    with_duration: number;
    with_tags: number;
  };
}

export const methodService = {
  // Get all methods with optional filters - uses API route
  async getMethods(filters: MethodFilters = {}) {
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

      const response = await fetch(`/api/methods?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch methods');
      }

      return await response.json() as Method[];
    } catch (error) {
      console.error('Error fetching methods:', error);
      throw error;
    }
  },

  // Get single method by ID - uses API route
  async getMethod(id: string) {
    try {
      const response = await fetch(`/api/methods/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch method');
      }

      return await response.json() as Method;
    } catch (error) {
      console.error('Error fetching method:', error);
      throw error;
    }
  },

  // Create new method - uses API route
  async createMethod(methodData: CreateMethodData) {
    try {
      const response = await fetch('/api/methods', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(methodData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create method');
      }

      return await response.json() as Method;
    } catch (error) {
      console.error('Error creating method:', error);
      throw error;
    }
  },

  // Update method - uses API route
  async updateMethod({ id, ...methodData }: UpdateMethodData) {
    try {
      const response = await fetch(`/api/methods/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(methodData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update method');
      }

      return await response.json() as Method;
    } catch (error) {
      console.error('Error updating method:', error);
      throw error;
    }
  },

  // Delete method - uses API route
  async deleteMethod(id: string) {
    try {
      const response = await fetch(`/api/methods/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete method');
      }
    } catch (error) {
      console.error('Error deleting method:', error);
      throw error;
    }
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
      name: newTitle || `${original.name} (Copy)`,
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

  // Course relationship methods - use API routes
  async getCourseMethods(courseId: string) {
    try {
      const response = await fetch(`/api/courses/${courseId}/methods`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch course methods');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course methods:', error);
      throw error;
    }
  },

  async addMethodToCourse(courseId: string, methodId: string, options: { position: number }) {
    try {
      const response = await fetch(`/api/courses/${courseId}/methods`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          methodIds: [methodId]
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add method to course');
      }

      const data = await response.json();
      return data[0]; // Return first item since we only added one
    } catch (error) {
      console.error('Error adding method to course:', error);
      throw error;
    }
  },

  async removeMethodFromCourse(relationId: string) {
    try {
      const response = await fetch(`/api/course-methods/${relationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove method from course');
      }
    } catch (error) {
      console.error('Error removing method from course:', error);
      throw error;
    }
  },

  // Lesson relationship methods - use API routes
  async getLessonMethods(lessonId: string) {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/methods`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch lesson methods');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching lesson methods:', error);
      throw error;
    }
  },

  async addMethodToLesson(lessonId: string, methodId: string, options: { position: number }) {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/methods`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          methodId,
          position: options.position
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add method to lesson');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding method to lesson:', error);
      throw error;
    }
  },

  async removeMethodFromLesson(relationId: string) {
    // Similar workaround as tasks - need to get lesson_id first
    console.warn('removeMethodFromLesson needs lessonId - using workaround');
    
    const { data: relation } = await supabase
      .from('lesson_methods')
      .select('lesson_id')
      .eq('id', relationId)
      .single();
    
    if (!relation) throw new Error('Relation not found');
    
    try {
      const response = await fetch(`/api/lessons/${relation.lesson_id}/methods?relationId=${relationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove method from lesson');
      }
    } catch (error) {
      console.error('Error removing method from lesson:', error);
      throw error;
    }
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

  // Get optimized admin methods list - lightweight for performance
  async getAdminMethodsList(filters: MethodFilters & { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<Method>> {
    try {
      console.log('[MethodService] Getting admin methods list with filters:', filters);
      const startTime = Date.now();
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.categoryId) params.append('category_id', filters.categoryId);
      params.append('page', String(filters.page || 1));
      params.append('perPage', String(filters.perPage || 20));
      
      // Use optimized admin-list endpoint
      const response = await fetch(`/api/methods/admin-list?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Admin methods list API error:', error);
        throw new Error(error.error || 'Failed to fetch admin methods list');
      }
      
      const result = await response.json();
      const endTime = Date.now();
      
      console.log(`[MethodService] Admin methods list loaded in ${endTime - startTime}ms (API: ${result.loadTime}ms)`);
      
      return result;
    } catch (error) {
      console.error('Error fetching admin methods list:', error);
      throw error;
    }
  },
};