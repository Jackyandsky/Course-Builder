import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseService } from './base.service';

type Enrollment = Database['public']['Tables']['enrollments']['Row'];
type EnrollmentInsert = Database['public']['Tables']['enrollments']['Insert'];
type EnrollmentUpdate = Database['public']['Tables']['enrollments']['Update'];

export class EnrollmentService extends BaseService<Enrollment> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'enrollments');
  }

  /**
   * Get user's enrollments
   */
  async getUserEnrollments(userId: string, status?: string) {
    let query = this.supabase
      .from('enrollments')
      .select(`
        *,
        course:courses!inner (
          id,
          title,
          description,
          thumbnail_url,
          difficulty,
          duration_hours
        ),
        schedule:schedules (
          id,
          name,
          schedule_type
        )
      `)
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('enrolled_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get course enrollments (for admin)
   */
  async getCourseEnrollments(courseId: string) {
    const { data, error } = await this.supabase
      .from('enrollments')
      .select(`
        *,
        user:user_profiles!inner (
          id,
          full_name,
          email,
          profile_image_url
        ),
        schedule:schedules (
          id,
          name
        )
      `)
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Enroll user in course
   */
  async enrollUser(enrollment: {
    user_id: string;
    course_id: string;
    schedule_id?: string;
    enrollment_type?: string;
    price_paid?: number;
    payment_method?: string;
  }) {
    // Check if already enrolled
    const { data: existing } = await this.supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', enrollment.user_id)
      .eq('course_id', enrollment.course_id)
      .single();

    if (existing) {
      throw new Error('User is already enrolled in this course');
    }

    // Create enrollment
    const { data, error } = await this.supabase
      .from('enrollments')
      .insert({
        ...enrollment,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        progress: 0
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Update enrollment status
   */
  async updateEnrollmentStatus(enrollmentId: string, status: string) {
    const updates: EnrollmentUpdate = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.progress = 100;
    }

    const { data, error } = await this.supabase
      .from('enrollments')
      .update(updates)
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Update enrollment progress
   */
  async updateEnrollmentProgress(enrollmentId: string, progress: number) {
    const { data, error } = await this.supabase
      .from('enrollments')
      .update({
        progress: Math.min(100, Math.max(0, progress)),
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Assign schedule to enrollment
   */
  async assignSchedule(enrollmentId: string, scheduleId: string) {
    const { data, error } = await this.supabase
      .from('enrollments')
      .update({
        schedule_id: scheduleId,
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get enrollment statistics
   */
  async getEnrollmentStats(filters?: {
    courseId?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    let query = this.supabase
      .from('enrollments')
      .select('status, progress, enrolled_at, completed_at');

    if (filters?.courseId) {
      query = query.eq('course_id', filters.courseId);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.dateFrom) {
      query = query.gte('enrolled_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('enrolled_at', filters.dateTo);
    }

    const { data: enrollments, error } = await query;

    if (error) throw error;

    const stats = {
      total: enrollments?.length || 0,
      active: 0,
      completed: 0,
      paused: 0,
      dropped: 0,
      averageProgress: 0,
      completionRate: 0
    };

    if (enrollments && enrollments.length > 0) {
      enrollments.forEach(enrollment => {
        stats[enrollment.status as keyof typeof stats]++;
      });

      stats.averageProgress = Math.round(
        enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
      );

      stats.completionRate = Math.round((stats.completed / stats.total) * 100);
    }

    return stats;
  }

  /**
   * Bulk enroll users
   */
  async bulkEnrollUsers(enrollments: EnrollmentInsert[]) {
    // Check for existing enrollments
    const userCoursesPairs = enrollments.map(e => ({
      user_id: e.user_id,
      course_id: e.course_id
    }));

    const existingCheck = await Promise.all(
      userCoursesPairs.map(pair =>
        this.supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', pair.user_id)
          .eq('course_id', pair.course_id)
          .single()
      )
    );

    const newEnrollments = enrollments.filter((_, index) => !existingCheck[index].data);

    if (newEnrollments.length === 0) {
      return { data: [], error: null, message: 'All users are already enrolled' };
    }

    const { data, error } = await this.supabase
      .from('enrollments')
      .insert(newEnrollments.map(e => ({
        ...e,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        progress: 0
      })))
      .select();

    if (error) throw error;
    return { 
      data, 
      error: null,
      message: `Enrolled ${data.length} users successfully`
    };
  }

  /**
   * Get recommended courses based on user's enrollments
   */
  async getRecommendedCourses(userId: string, limit = 5) {
    // Get user's enrolled courses
    const { data: userEnrollments } = await this.supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId);

    const enrolledCourseIds = userEnrollments?.map(e => e.course_id) || [];

    // Get courses not enrolled in
    let query = this.supabase
      .from('courses')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'published');

    if (enrolledCourseIds.length > 0) {
      query = query.not('id', 'in', `(${enrolledCourseIds.join(',')})`);
    }

    const { data, error } = await query.limit(limit);

    if (error) throw error;
    return { data, error: null };
  }
}