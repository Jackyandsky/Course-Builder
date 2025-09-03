import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseService } from './base.service';

type Course = Database['public']['Tables']['courses']['Row'];
type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type CourseUpdate = Database['public']['Tables']['courses']['Update'];

export class CourseService extends BaseService<Course> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'courses');
  }

  /**
   * Get courses with their schedules and lessons
   */
  async getCoursesWithDetails(userId?: string) {
    let query = this.supabase
      .from('courses')
      .select(`
        *,
        schedules (
          id,
          name,
          schedule_type,
          is_active,
          lessons (count)
        )
      `);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get course statistics
   */
  async getCourseStats(courseId: string) {
    const [enrollments, lessons, tasks] = await Promise.all([
      // Get enrollment count
      this.supabase
        .from('enrollments')
        .select('id', { count: 'exact' })
        .eq('course_id', courseId),
      
      // Get lesson count
      this.supabase
        .from('lessons')
        .select('id', { count: 'exact' })
        .eq('course_id', courseId),
      
      // Get task count through course_tasks
      this.supabase
        .from('course_tasks')
        .select('id', { count: 'exact' })
        .eq('course_id', courseId)
    ]);

    return {
      enrollmentCount: enrollments.count || 0,
      lessonCount: lessons.count || 0,
      taskCount: tasks.count || 0
    };
  }

  /**
   * Get courses by category
   */
  async getCoursesByCategory(categoryId: string) {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_public', true)
      .order('title');

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get featured courses for homepage
   */
  async getFeaturedCourses(limit = 8) {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .eq('show_on_homepage', true)
      .eq('is_public', true)
      .order('homepage_order', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get courses for menu display
   */
  async getMenuCourses() {
    const { data, error } = await this.supabase
      .from('courses')
      .select('id, title, short_description, public_slug')
      .eq('show_on_menu', true)
      .eq('is_public', true)
      .order('menu_order', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Search courses
   */
  async searchCourses(searchTerm: string, filters?: {
    difficulty?: string;
    status?: string;
    priceMin?: number;
    priceMax?: number;
  }) {
    let query = this.supabase
      .from('courses')
      .select('*')
      .eq('is_public', true);

    // Apply search term
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Apply filters
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.priceMin !== undefined) {
      query = query.gte('price', filters.priceMin);
    }

    if (filters?.priceMax !== undefined) {
      query = query.lte('price', filters.priceMax);
    }

    const { data, error } = await query.order('title');

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get course with all relationships
   */
  async getCourseWithRelationships(courseId: string) {
    const { data, error } = await this.supabase
      .from('courses')
      .select(`
        *,
        schedules (
          *,
          lessons (*)
        ),
        course_books (
          book_id,
          is_required,
          books (*)
        ),
        course_objectives (
          objective_id,
          objectives (*)
        ),
        course_methods (
          method_id,
          methods (*)
        ),
        course_tasks (
          task_id,
          is_required,
          tasks (*)
        ),
        course_vocabulary (
          vocabulary_id,
          vocabulary (*)
        )
      `)
      .eq('id', courseId)
      .single();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Duplicate a course
   */
  async duplicateCourse(courseId: string, newTitle: string) {
    // Get original course
    const { data: originalCourse, error: fetchError } = await this.getCourseWithRelationships(courseId);
    if (fetchError) throw fetchError;

    // Create new course
    const { data: newCourse, error: createError } = await this.create({
      ...originalCourse,
      id: undefined,
      title: newTitle,
      created_at: undefined,
      updated_at: undefined
    } as CourseInsert);

    if (createError) throw createError;

    // Copy relationships
    if (originalCourse.course_books?.length) {
      await this.supabase.from('course_books').insert(
        originalCourse.course_books.map(cb => ({
          course_id: newCourse.id,
          book_id: cb.book_id,
          is_required: cb.is_required
        }))
      );
    }

    if (originalCourse.course_objectives?.length) {
      await this.supabase.from('course_objectives').insert(
        originalCourse.course_objectives.map(co => ({
          course_id: newCourse.id,
          objective_id: co.objective_id
        }))
      );
    }

    // Copy other relationships similarly...

    return { data: newCourse, error: null };
  }
}