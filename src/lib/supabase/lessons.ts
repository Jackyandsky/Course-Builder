// src/lib/supabase/lessons.ts

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type {
  Lesson,
  Attendance,
  AttendanceStatus
} from '@/types/schedule';
import type { LessonStatus } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

const supabase = createClientComponentClient();

export interface LessonFilters {
  schedule_id?: string;
  status?: LessonStatus;
  date_from?: string;
  date_to?: string;
  user_id?: string;
  search?: string;
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
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data: lessons, error } = await query;
    if (error) throw error;

    if (!lessons || lessons.length === 0) {
      return [];
    }

    // Get lesson IDs for fetching related data
    const lessonIds = lessons.map(lesson => lesson.id);

    // Fetch lesson_books and lesson_tasks separately
    const [lessonBooksResult, lessonTasksResult] = await Promise.all([
      supabase
        .from('lesson_books')
        .select(`
          id,
          lesson_id,
          book_id,
          pages_from,
          pages_to,
          notes,
          book:books(id, title, author, cover_image_url)
        `)
        .in('lesson_id', lessonIds),
      supabase
        .from('lesson_tasks')
        .select(`
          id,
          lesson_id,
          task_id,
          position,
          is_homework,
          due_date,
          duration_override,
          notes,
          task:tasks(id, title, description, duration_minutes)
        `)
        .in('lesson_id', lessonIds)
    ]);

    if (lessonBooksResult.error) throw lessonBooksResult.error;
    if (lessonTasksResult.error) throw lessonTasksResult.error;

    // Group lesson_books and lesson_tasks by lesson_id
    const lessonBooksMap = new Map();
    lessonBooksResult.data?.forEach(lessonBook => {
      if (!lessonBooksMap.has(lessonBook.lesson_id)) {
        lessonBooksMap.set(lessonBook.lesson_id, []);
      }
      lessonBooksMap.get(lessonBook.lesson_id).push(lessonBook);
    });

    const lessonTasksMap = new Map();
    lessonTasksResult.data?.forEach(lessonTask => {
      if (!lessonTasksMap.has(lessonTask.lesson_id)) {
        lessonTasksMap.set(lessonTask.lesson_id, []);
      }
      lessonTasksMap.get(lessonTask.lesson_id).push(lessonTask);
    });

    // Attach lesson_books and lesson_tasks to lessons
    const enrichedLessons = lessons.map(lesson => ({
      ...lesson,
      lesson_books: lessonBooksMap.get(lesson.id) || [],
      lesson_tasks: lessonTasksMap.get(lesson.id) || []
    }));

    return enrichedLessons as Lesson[];
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
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select(
        `
        *,
        schedule:schedules(*, course:courses(*))
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!lesson) return null;

    // Fetch lesson_books and lesson_tasks separately
    const [lessonBooksResult, lessonTasksResult] = await Promise.all([
      supabase
        .from('lesson_books')
        .select(`
          *,
          book:books(*)
        `)
        .eq('lesson_id', id),
      supabase
        .from('lesson_tasks')
        .select(`
          *,
          task:tasks(*)
        `)
        .eq('lesson_id', id)
    ]);

    if (lessonBooksResult.error) throw lessonBooksResult.error;
    if (lessonTasksResult.error) throw lessonTasksResult.error;

    return {
      ...lesson,
      lesson_books: lessonBooksResult.data || [],
      lesson_tasks: lessonTasksResult.data || []
    };
  },

  /**
   * Create a new lesson.
   */
  async createLesson(lessonData: CreateLessonData) {
    const { data, error } = await supabase
      .from('lessons')
      .insert({ ...lessonData, user_id: SHARED_USER_ID })
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
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        ...attendanceData,
        marked_at: new Date().toISOString(),
        marked_by: SHARED_USER_ID,
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
    const records = attendances.map((a) => ({
      ...a,
      lesson_id,
      marked_at: new Date().toISOString(),
      marked_by: SHARED_USER_ID,
    }));

    const { data, error } = await supabase.from('attendance').upsert(records).select();

    if (error) throw error;
    return data;
  },

  // === LESSON CONTENT RELATIONSHIP METHODS ===

  /**
   * Add a book to a lesson
   */
  async addBookToLesson(lesson_id: string, book_id: string, options: {
    position?: number;
    is_required?: boolean;
    reading_pages?: string;
    notes?: string;
  } = {}) {
    const { data, error } = await supabase
      .from('lesson_books')
      .insert({
        lesson_id,
        book_id,
        position: options.position || 0,
        is_required: options.is_required || false,
        reading_pages: options.reading_pages,
        notes: options.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove a book from a lesson
   */
  async removeBookFromLesson(lesson_id: string, book_id: string) {
    const { error } = await supabase
      .from('lesson_books')
      .delete()
      .eq('lesson_id', lesson_id)
      .eq('book_id', book_id);

    if (error) throw error;
  },

  /**
   * Add a vocabulary group to a lesson
   */
  async addVocabularyGroupToLesson(lesson_id: string, vocabulary_group_id: string, options: {
    position?: number;
    focus_words?: string[];
    notes?: string;
  } = {}) {
    const { data, error } = await supabase
      .from('lesson_vocabulary_groups')
      .insert({
        lesson_id,
        vocabulary_group_id,
        position: options.position || 0,
        focus_words: options.focus_words,
        notes: options.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove a vocabulary group from a lesson
   */
  async removeVocabularyGroupFromLesson(lesson_id: string, vocabulary_group_id: string) {
    const { error } = await supabase
      .from('lesson_vocabulary_groups')
      .delete()
      .eq('lesson_id', lesson_id)
      .eq('vocabulary_group_id', vocabulary_group_id);

    if (error) throw error;
  },

  /**
   * Get lessons for a specific course (used in course lessons tab)
   */
  async getCourseLessons(course_id: string, filters: {
    status?: LessonStatus;
    date_from?: string;
    date_to?: string;
  } = {}) {
    let query = supabase
      .from('lessons')
      .select(`
        *,
        schedule:schedules(id, name)
      `)
      .eq('course_id', course_id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.date_from) {
      query = query.gte('date', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('date', filters.date_to);
    }

    const { data: lessons, error } = await query;
    if (error) throw error;

    if (!lessons || lessons.length === 0) {
      return [];
    }

    // Get lesson IDs for fetching related data
    const lessonIds = lessons.map(lesson => lesson.id);

    // Fetch lesson_books and lesson_tasks separately
    const [lessonBooksResult, lessonTasksResult] = await Promise.all([
      supabase
        .from('lesson_books')
        .select(`
          id,
          lesson_id,
          book_id,
          pages_from,
          pages_to,
          notes,
          book:books(id, title, author, cover_image_url)
        `)
        .in('lesson_id', lessonIds),
      supabase
        .from('lesson_tasks')
        .select(`
          id,
          lesson_id,
          task_id,
          position,
          is_homework,
          due_date,
          duration_override,
          notes,
          task:tasks(id, title, description)
        `)
        .in('lesson_id', lessonIds)
    ]);

    if (lessonBooksResult.error) throw lessonBooksResult.error;
    if (lessonTasksResult.error) throw lessonTasksResult.error;

    // Group lesson_books and lesson_tasks by lesson_id
    const lessonBooksMap = new Map();
    lessonBooksResult.data?.forEach(lessonBook => {
      if (!lessonBooksMap.has(lessonBook.lesson_id)) {
        lessonBooksMap.set(lessonBook.lesson_id, []);
      }
      lessonBooksMap.get(lessonBook.lesson_id).push(lessonBook);
    });

    const lessonTasksMap = new Map();
    lessonTasksResult.data?.forEach(lessonTask => {
      if (!lessonTasksMap.has(lessonTask.lesson_id)) {
        lessonTasksMap.set(lessonTask.lesson_id, []);
      }
      lessonTasksMap.get(lessonTask.lesson_id).push(lessonTask);
    });

    // Attach lesson_books and lesson_tasks to lessons
    const enrichedLessons = lessons.map(lesson => ({
      ...lesson,
      lesson_books: lessonBooksMap.get(lesson.id) || [],
      lesson_tasks: lessonTasksMap.get(lesson.id) || []
    }));

    return enrichedLessons as Lesson[];
  },
};