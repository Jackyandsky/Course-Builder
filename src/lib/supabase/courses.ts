import { createSupabaseClient } from '@/lib/supabase';
import { Course, CourseStatus, DifficultyLevel } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

const getSupabase = () => createSupabaseClient();

export interface CourseFilters {
  status?: CourseStatus;
  difficulty?: DifficultyLevel;
  categoryId?: string;
  search?: string;
  isPublic?: boolean;
  tags?: string[];
  page?: number;
  perPage?: number;
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
    draft: number;
    published: number;
    archived: number;
  };
}

export interface CreateCourseData {
  title: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  status?: CourseStatus;
  difficulty?: DifficultyLevel;
  duration_hours?: number;
  objectives?: string[];
  prerequisites?: string[];
  tags?: string[];
  thumbnail_url?: string;
  is_public?: boolean;
  public_slug?: string;
  price?: number;
  currency?: string;
  discount_percentage?: number;
  sale_price?: number;
  is_free?: boolean;
  stripe_product_id?: string;
  stripe_price_id?: string;
  show_on_menu?: boolean;
  show_on_homepage?: boolean;
  menu_order?: number;
  homepage_order?: number;
  metadata?: any;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  id: string;
}

export const courseService = {
  // Get all courses with optional filters - uses server-side API
  async getCourses(filters: CourseFilters = {}, simple: boolean = false): Promise<Course[]> {
    try {
      console.log('Getting courses with filters:', filters, 'simple:', simple);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.isPublic !== undefined) params.append('isPublic', String(filters.isPublic));
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.perPage) params.append('perPage', String(filters.perPage));
      params.append('isAdmin', 'true'); // Mark as admin request
      if (simple) params.append('simple', 'true'); // Add simple mode flag
      
      // Fetch from API route (server-side with proper auth)
      const response = await fetch(`/api/courses?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.error || 'Failed to fetch courses');
      }
      
      const data = await response.json();
      
      // Handle both old (array) and new (paginated) response formats
      if (Array.isArray(data)) {
        console.log('API response (legacy):', { count: data.length });
        return data as Course[];
      } else {
        console.log('API response (paginated):', { 
          count: data.courses?.length || 0,
          total: data.pagination?.total || 0 
        });
        return data.courses as Course[];
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  // Get paginated courses - returns full pagination metadata
  async getCoursesPaginated(filters: CourseFilters = {}): Promise<PaginatedResponse<Course>> {
    try {
      console.log('Getting paginated courses with filters:', filters);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.isPublic !== undefined) params.append('isPublic', String(filters.isPublic));
      if (filters.search) params.append('search', filters.search);
      params.append('page', String(filters.page || 1));
      params.append('perPage', String(filters.perPage || 12));
      params.append('isAdmin', 'true'); // Mark as admin request
      
      // Fetch from API route (server-side with proper auth)
      const response = await fetch(`/api/courses?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.error || 'Failed to fetch courses');
      }
      
      const result = await response.json();
      
      // Handle old format (backward compatibility)
      if (Array.isArray(result)) {
        return {
          data: result as Course[],
          pagination: {
            page: 1,
            perPage: result.length,
            total: result.length,
            totalPages: 1
          }
        };
      }
      
      return {
        data: result.courses as Course[],
        pagination: result.pagination,
        stats: result.stats
      };
    } catch (error) {
      console.error('Error fetching paginated courses:', error);
      throw error;
    }
  },

  // Get single course by ID - uses server-side API
  async getCourse(id: string) {
    try {
      console.log('Getting course:', id);
      
      // Fetch from API route (server-side with proper auth)
      const response = await fetch(`/api/courses/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.error || 'Failed to fetch course');
      }
      
      const data = await response.json();
      console.log('Course fetched successfully:', data);
      return data as Course;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  },

  // Create new course - uses server-side API
  async createCourse(courseData: CreateCourseData) {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...courseData,
          user_id: SHARED_USER_ID, // Use shared user ID since authentication is not required
          status: courseData.status || 'draft',
          difficulty: courseData.difficulty || 'beginner',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.error || 'Failed to create course');
      }
      
      const data = await response.json();
      console.log('Course created successfully:', data);
      return data as Course;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  // Update course - uses server-side API
  async updateCourse({ id, ...courseData }: UpdateCourseData) {
    try {
      console.log('Updating course:', id, courseData);
      
      // Fetch from API route (server-side with proper auth)
      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.error || 'Failed to update course');
      }
      
      const data = await response.json();
      console.log('Course updated successfully:', data);
      return data as Course;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  // Delete course - uses server-side API
  async deleteCourse(id: string) {
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.error || 'Failed to delete course');
      }
      
      console.log('Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  // Publish course - uses server-side API
  async publishCourse(id: string) {
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'published' as CourseStatus,
          published_at: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.error || 'Failed to publish course');
      }
      
      const data = await response.json();
      console.log('Course published successfully:', data);
      return data as Course;
    } catch (error) {
      console.error('Error publishing course:', error);
      throw error;
    }
  },

  // Archive course - uses server-side API
  async archiveCourse(id: string) {
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'archived' as CourseStatus,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.error || 'Failed to archive course');
      }
      
      const data = await response.json();
      console.log('Course archived successfully:', data);
      return data as Course;
    } catch (error) {
      console.error('Error archiving course:', error);
      throw error;
    }
  },

  // Get optimized admin courses list - lightweight for performance
  async getAdminCoursesList(filters: CourseFilters = {}): Promise<PaginatedResponse<Course>> {
    try {
      console.log('[CourseService] Getting admin courses list with filters:', filters);
      const startTime = Date.now();
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.search) params.append('search', filters.search);
      params.append('page', String(filters.page || 1));
      params.append('perPage', String(filters.perPage || 12));
      
      // Use optimized admin-list endpoint
      const response = await fetch(`/api/courses/admin-list?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Admin courses list API error:', error);
        throw new Error(error.error || 'Failed to fetch admin courses list');
      }
      
      const result = await response.json();
      const endTime = Date.now();
      
      console.log(`[CourseService] Admin courses list loaded in ${endTime - startTime}ms (API: ${result.loadTime}ms)`);
      
      return result;
    } catch (error) {
      console.error('Error fetching admin courses list:', error);
      throw error;
    }
  },

  // Get course statistics - uses dedicated stats API endpoint
  async getCourseStats() {
    try {
      const response = await fetch('/api/courses/stats?isAdmin=true', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.error || 'Failed to fetch course stats');
      }
      
      const stats = await response.json();
      console.log('Course stats:', stats);
      
      return stats;
    } catch (error) {
      console.error('Error fetching course stats:', error);
      return {
        total: 0,
        draft: 0,
        published: 0,
        archived: 0,
      };
    }
  },
};
