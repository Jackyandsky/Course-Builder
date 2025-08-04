import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Course, CourseStatus, DifficultyLevel } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

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
  objectives?: string[];
  prerequisites?: string[];
  tags?: string[];
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
        category:categories(id, name, color, icon),
        course_books(
          id,
          book_id,
          is_required,
          notes,
          position,
          book:books(id, title, author, isbn, publisher)
        ),
        course_objectives(
          id,
          objective_id,
          position,
          objective:objectives(id, title, description)
        ),
        course_methods(
          id,
          method_id,
          position,
          method:methods(id, name, description)
        ),
        schedules(
          id,
          name,
          description,
          start_date,
          end_date,
          recurrence_type,
          is_active
        )
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
    try {
      // Try to get course with all relationships including schedules and methods
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
          ),
          course_objectives(
            id,
            objective_id,
            position,
            objective:objectives(id, title, description, bloom_level, measurable, tags, is_template)
          ),
          course_methods(
            id,
            method_id,
            position,
            method:methods(id, name, description, tags)
          ),
          schedules(
            id,
            name,
            description,
            start_date,
            end_date,
            recurrence_type,
            recurrence_days,
            default_start_time,
            default_duration_minutes,
            timezone,
            location,
            max_students,
            is_active,
            lessons(count)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Course;
    } catch (error: any) {
      // If some tables don't exist, fall back progressively
      if (error.message?.includes('course_objectives') || error.message?.includes('course_methods') || error.code === '42P01') {
        try {
          const { data, error: fallbackError } = await supabase
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
              ),
              schedules(
                id,
                name,
                description,
                start_date,
                end_date,
                recurrence_type,
                recurrence_days,
                default_start_time,
                default_duration_minutes,
                timezone,
                location,
                max_students,
                is_active,
                lessons(count)
              )
            `)
            .eq('id', id)
            .single();
          
          if (fallbackError) throw fallbackError;
          return { ...data, course_objectives: [], course_methods: [] } as Course;
        } catch (scheduleError: any) {
          // Final fallback without schedules if needed
          const { data, error: finalError } = await supabase
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
          
          if (finalError) throw finalError;
          return { ...data, course_objectives: [], course_methods: [], schedules: [] } as Course;
        }
      }
      throw error;
    }
  },

  // Create new course
  async createCourse(courseData: CreateCourseData) {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...courseData,
        user_id: SHARED_USER_ID, // Use shared user ID since authentication is not required
        status: courseData.status || 'draft',
        difficulty: courseData.difficulty || 'beginner',
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
