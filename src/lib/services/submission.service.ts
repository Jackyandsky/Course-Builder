import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseService } from './base.service';

type TaskSubmission = Database['public']['Tables']['task_submissions']['Row'];
type TaskSubmissionInsert = Database['public']['Tables']['task_submissions']['Insert'];
type TaskSubmissionUpdate = Database['public']['Tables']['task_submissions']['Update'];

export class SubmissionService extends BaseService<TaskSubmission> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'task_submissions');
  }

  /**
   * Get user's submissions
   */
  async getUserSubmissions(userId: string, status?: string) {
    let query = this.supabase
      .from('task_submissions')
      .select(`
        *,
        task:tasks!inner (
          id,
          title,
          points,
          media_required,
          submission_type
        ),
        course_id,
        lesson_id
      `)
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('submitted_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get submissions with details
   */
  async getSubmissionsWithDetails(userId?: string) {
    let query = this.supabase
      .from('task_submissions')
      .select(`
        *,
        task:tasks!inner (
          id,
          title,
          points,
          media_required
        ),
        course_id,
        lesson_id
      `);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: submissions, error } = await query.order('submitted_at', { ascending: false });

    if (error) throw error;

    // Fetch additional details
    const submissionsWithDetails = await Promise.all(
      (submissions || []).map(async (submission) => {
        // Get user profile
        const { data: userProfile } = await this.supabase
          .from('user_profiles')
          .select('full_name, email')
          .eq('id', submission.user_id)
          .single();

        // Get media files count
        const { data: mediaFiles } = await this.supabase
          .from('task_media')
          .select('id')
          .eq('task_id', submission.task_id)
          .eq('user_id', submission.user_id)
          .eq('is_active', true);

        // Get course info
        let courseInfo = null;
        if (submission.course_id) {
          const { data: course } = await this.supabase
            .from('courses')
            .select('id, title')
            .eq('id', submission.course_id)
            .single();
          courseInfo = course;
        }

        // Get lesson info
        let lessonInfo = null;
        if (submission.lesson_id) {
          const { data: lesson } = await this.supabase
            .from('lessons')
            .select('id, title, lesson_number')
            .eq('id', submission.lesson_id)
            .single();
          lessonInfo = lesson;
        }

        return {
          ...submission,
          media_count: mediaFiles?.length || 0,
          user: {
            id: submission.user_id,
            email: userProfile?.email || 'Unknown',
            full_name: userProfile?.full_name
          },
          course: courseInfo,
          lesson: lessonInfo
        };
      })
    );

    return { data: submissionsWithDetails, error: null };
  }

  /**
   * Create or update submission
   */
  async createOrUpdateSubmission(
    taskId: string,
    userId: string,
    data: {
      submission_text?: string;
      submission_data?: any;
      course_id?: string;
      lesson_id?: string;
      status?: string;
    }
  ) {
    // Check for existing submission
    const { data: existing } = await this.supabase
      .from('task_submissions')
      .select('id, status')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing
      const { data: updated, error } = await this.supabase
        .from('task_submissions')
        .update({
          ...data,
          status: data.status || 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return { data: updated, error: null };
    } else {
      // Create new
      const { data: created, error } = await this.supabase
        .from('task_submissions')
        .insert({
          task_id: taskId,
          user_id: userId,
          ...data,
          status: data.status || 'submitted',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data: created, error: null };
    }
  }

  /**
   * Initialize draft submissions for lesson
   */
  async initializeLessonSubmissions(lessonId: string, userId: string, courseId?: string) {
    // Get all tasks for this lesson
    const { data: tasks, error: tasksError } = await this.supabase
      .from('lesson_tasks')
      .select('task_id')
      .eq('lesson_id', lessonId);

    if (tasksError) throw tasksError;

    if (!tasks || tasks.length === 0) {
      return { created: 0, existing: 0, submissions: [] };
    }

    const createdSubmissions = [];
    const existingSubmissions = [];

    // For each task, check if submission exists, create if not
    for (const lessonTask of tasks) {
      // Check for existing submission
      const { data: existingSubmission } = await this.supabase
        .from('task_submissions')
        .select('id, status, task_id')
        .eq('task_id', lessonTask.task_id)
        .eq('user_id', userId)
        .single();

      if (existingSubmission) {
        existingSubmissions.push(existingSubmission);
      } else {
        // Create draft submission
        const { data: newSubmission, error: createError } = await this.supabase
          .from('task_submissions')
          .insert({
            task_id: lessonTask.task_id,
            user_id: userId,
            course_id: courseId,
            lesson_id: lessonId,
            status: 'pending', // Draft status
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!createError && newSubmission) {
          createdSubmissions.push(newSubmission);
        }
      }
    }

    return {
      created: createdSubmissions.length,
      existing: existingSubmissions.length,
      submissions: [...createdSubmissions, ...existingSubmissions]
    };
  }

  /**
   * Review submission (admin/teacher)
   */
  async reviewSubmission(
    submissionId: string,
    reviewerId: string,
    review: {
      status: 'approved' | 'rejected' | 'revision_requested';
      score?: number;
      review_notes?: string;
      response_file_url?: string;
    }
  ) {
    const { data, error } = await this.supabase
      .from('task_submissions')
      .update({
        ...review,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get submission statistics
   */
  async getSubmissionStats(userId?: string) {
    let query = this.supabase
      .from('task_submissions')
      .select('status, score');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: submissions, error } = await query;

    if (error) throw error;

    const stats = {
      total: submissions?.length || 0,
      pending: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      revision_requested: 0,
      avgScore: null as number | null
    };

    if (submissions && submissions.length > 0) {
      submissions.forEach(sub => {
        stats[sub.status as keyof typeof stats]++;
      });

      const scored = submissions.filter(s => s.score !== null);
      if (scored.length > 0) {
        stats.avgScore = Math.round(
          scored.reduce((sum, s) => sum + (s.score || 0), 0) / scored.length
        );
      }
    }

    return stats;
  }

  /**
   * Delete submission
   */
  async deleteSubmission(submissionId: string) {
    // First delete associated media
    const { data: submission } = await this.supabase
      .from('task_submissions')
      .select('task_id, user_id')
      .eq('id', submissionId)
      .single();

    if (submission) {
      await this.supabase
        .from('task_media')
        .update({ is_active: false })
        .eq('task_id', submission.task_id)
        .eq('user_id', submission.user_id);
    }

    // Delete submission
    const { error } = await this.supabase
      .from('task_submissions')
      .delete()
      .eq('id', submissionId);

    if (error) throw error;
    return { error: null };
  }
}