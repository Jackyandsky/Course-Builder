import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Course, CourseStatus, DifficultyLevel } from '@/types/database';

const supabase = createClientComponentClient();

export interface CourseFilters {
  status?: CourseStatus;
  difficulty?: DifficultyLevel;
  categoryId?: string;
  search?: string;
  isPublic?: boolean;
  tags?: string[];
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
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  id: string;
}

export const courseService = {
  // Get all courses with optional filters
  async getCourses(filters: CourseFilters = {}) {
    let query = supabase
      .from('courses')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    if (filters.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Course[];
  },

  // Get single course by ID
  async getCourse(id: string) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        category:categories(id, name, color, icon),
        course_books(
          id,
          book_id,
          is_required,
          notes,
          position,
          book:books(id, title, author, cover_image_url)
        ),
        course_vocabulary_groups(
          id,
          vocabulary_group_id,
          position,
          vocabulary_group:vocabulary_groups(id, name, language, difficulty)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  // Create new course
  async createCourse(courseData: CreateCourseData) {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...courseData,
        user_id: 'shared-user', // Use shared user ID since authentication is not required
        status: courseData.status || 'draft',
        difficulty: courseData.difficulty || 'beginner',
        is_public: courseData.is_public || false,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  // Update course
  async updateCourse({ id, ...courseData }: UpdateCourseData) {
    const { data, error } = await supabase
      .from('courses')
      .update({
        ...courseData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  // Delete course
  async deleteCourse(id: string) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Publish course
  async publishCourse(id: string) {
    const { data, error } = await supabase
      .from('courses')
      .update({
        status: 'published' as CourseStatus,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  // Archive course
  async archiveCourse(id: string) {
    const { data, error } = await supabase
      .from('courses')
      .update({
        status: 'archived' as CourseStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  // Get course statistics
  async getCourseStats() {
    const { data, error } = await supabase
      .from('courses')
      .select('status', { count: 'exact' });
    
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      draft: data?.filter(c => c.status === 'draft').length || 0,
      published: data?.filter(c => c.status === 'published').length || 0,
      archived: data?.filter(c => c.status === 'archived').length || 0,
    };

    return stats;
  },
};
