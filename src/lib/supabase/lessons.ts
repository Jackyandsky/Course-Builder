// src/lib/supabase/lessons.ts

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type {
  Lesson,
  Attendance,
  AttendanceStatus
} from '@/types/schedule';
import type { LessonStatus } from '@/types/database';

const supabase = createClientComponentClient();

export interface LessonFilters {
  schedule_id?: string;
  status?: LessonStatus;
  date_from?: string;
  date_to?: string;
  user_id?: string;
}

export interface CreateLessonData
  extends Omit<Lesson, 'id' | 'created_at' | 'updated_at'> {}

export interface UpdateLessonData extends Partial<CreateLessonData> {
  id: string;
}

export interface CreateAttendanceData
  extends Omit<Attendance, 'id' | 'marked_at'> {}

export const lessonService = {
  /**
   * Get all lessons with optional filters.
   */
  async getLessons(filters: LessonFilters = {}) {
    let query = supabase
      .from('lessons')
      .select(
        `
        *,
        schedule:schedules(id, name, course:courses(id, title))
      `
      )
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (filters.schedule_id) {
      query = query.eq('schedule_id', filters.schedule_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.date_from) {
      query = query.gte('date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('date', filters.date_to);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Lesson[];
  },

  /**
   * Get all lessons for a specific schedule.
   */
  async getScheduleLessons(scheduleId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data as Lesson[];
  },

  /**
   * Get a single lesson by its ID, including all related content.
   */
  async getLesson(id: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select(
        `
        *,
        schedule:schedules(*, course:courses(*)),
        objectives:lesson_objectives(*, objective:objectives(*)),
        methods:lesson_methods(*, method:methods(*)),
        tasks:lesson_tasks(*, task:tasks(*)),
        books:lesson_books(*, book:books(*)),
        vocabulary:lesson_vocabulary(*, vocabulary:vocabulary(*)),
        attendance(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new lesson.
   */
  async createLesson(lessonData: CreateLessonData) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lessons')
      .insert({ ...lessonData, user_id: user.user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing lesson.
   */
  async updateLesson(id: string, lessonData: Partial<UpdateLessonData>) {
    const { data, error } = await supabase
      .from('lessons')
      .update({ ...lessonData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a lesson.
   */
  async deleteLesson(id: string) {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) throw error;
  },

  // ==================== ATTENDANCE ====================

  /**
   * Get all attendance records for a specific lesson.
   */
  async getAttendance(lesson_id: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('lesson_id', lesson_id)
      .order('student_name');

    if (error) throw error;
    return data;
  },

  /**
   * Mark (create or update) a single attendance record.
   */
  async markAttendance(attendanceData: CreateAttendanceData) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        ...attendanceData,
        marked_at: new Date().toISOString(),
        marked_by: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark attendance for multiple students at once.
   */
  async bulkMarkAttendance(
    lesson_id: string,
    attendances: Omit<Attendance, 'id' | 'lesson_id' | 'marked_at' | 'marked_by'>[]
  ) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const records = attendances.map((a) => ({
      ...a,
      lesson_id,
      marked_at: new Date().toISOString(),
      marked_by: user.user.id,
    }));

    const { data, error } = await supabase.from('attendance').upsert(records).select();

    if (error) throw error;
    return data;
  },
};