// src/lib/getSupabase()/schedules.ts

import { createSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';
import {
  Schedule,
  Lesson,
  RecurrenceType,
  DayOfWeek,
} from '@/types/schedule';
import { Course } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

const getSupabase = () => createSupabaseClient();

export interface ScheduleFilters {
  course_id?: string;
  is_active?: boolean;
  user_id?: string;
  search?: string;
}

export interface CreateScheduleData
  extends Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'course'> {}

export interface UpdateScheduleData extends Partial<CreateScheduleData> {
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
    active: number;
    inactive: number;
  };
}

/**
 * Generates lessons for a recurring schedule.
 * @param schedule_id - The ID of the schedule.
 * @param schedule - The schedule data.
 */
async function generateRecurringLessons(
  schedule_id: string,
  schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>
) {
  const lessons: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>[] = [];
  const startDate = new Date(`${schedule.start_date}T00:00:00Z`);
  const endDate = schedule.end_date
    ? new Date(`${schedule.end_date}T00:00:00Z`)
    : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());

  let currentDate = new Date(startDate);
  let lessonNumber = 1;
  const dayMap: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  while (currentDate <= endDate) {
    const dayOfWeek = dayMap[currentDate.getUTCDay()];
    if (schedule.recurrence_days?.includes(dayOfWeek)) {
      const [hours, minutes] = schedule.default_start_time.split(':').map(Number);
      const lessonStartTime = new Date(currentDate);
      lessonStartTime.setUTCHours(hours, minutes, 0, 0);

      const lessonEndTime = new Date(lessonStartTime);
      lessonEndTime.setUTCMinutes(
        lessonStartTime.getUTCMinutes() + schedule.default_duration_minutes
      );

      lessons.push({
        schedule_id,
        course_id: schedule.course_id,
        user_id: schedule.user_id,
        title: `${schedule.name} - Lesson ${lessonNumber}`,
        description: `Automatically generated lesson from schedule: ${schedule.name}`,
        lesson_number: lessonNumber,
        date: currentDate.toISOString().split('T')[0],
        start_time: lessonStartTime.toUTCString().slice(17, 22),
        end_time: lessonEndTime.toUTCString().slice(17, 22),
        duration_minutes: schedule.default_duration_minutes,
        location: schedule.location,
        status: 'scheduled',
        tags: ['auto-generated', 'from-schedule'],
      });
      lessonNumber++;
    }

    // Move to the next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  if (lessons.length > 0) {
    const { error } = await getSupabase().from('lessons').insert(lessons);
    if (error) throw error;
  }
}

export const scheduleService = {
  /**
   * Generate lessons for a schedule manually
   */
  async generateLessonsForSchedule(scheduleId: string) {
    const schedule = await this.getSchedule(scheduleId);
    if (!schedule) throw new Error('Schedule not found');
    
    // Delete existing auto-generated lessons for this schedule
    await getSupabase()
      .from('lessons')
      .delete()
      .eq('schedule_id', scheduleId)
      .contains('tags', ['auto-generated']);
    
    // Generate new lessons
    await generateRecurringLessons(scheduleId, schedule);
    
    return this.getScheduleLessons(scheduleId);
  },
  /**
   * Get all schedules with optional filters.
   */
  async getSchedules(filters: ScheduleFilters = {}) {
    try {
      // If course_id is provided, use the course-specific API route
      if (filters.course_id) {
        const response = await fetch(`/api/courses/${filters.course_id}/schedules`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch schedules');
        }

        const data = await response.json();
        return data.schedules || [];
      }

      // For general schedules, we still need to use direct Supabase
      // TODO: Create a general schedules API route
      let query = getSupabase()
        .from('schedules')
        .select(
          `
          *,
          course:courses(id, title),
          lessons(count)
        `
        )
        .order('created_at', { ascending: false });

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  },

  /**
   * Get a single schedule by its ID.
   */
  async getSchedule(id: string) {
    try {
      // Use API route for better error handling and auth
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch schedule: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Fallback to direct Supabase call if API fails
      console.warn('API call failed, falling back to direct Supabase:', error);
      
      // Use separate queries to avoid relationship issues
      const { data: schedule, error: scheduleError } = await getSupabase()
        .from('schedules')
        .select(
          `
          *,
          course:courses(*)
        `
        )
        .eq('id', id)
        .single();
      
      if (scheduleError) throw scheduleError;
      
      // Get lessons separately
      const { data: lessons, error: lessonsError } = await getSupabase()
        .from('lessons')
        .select('*')
        .eq('schedule_id', id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
      }
      
      return {
        ...schedule,
        lessons: lessons || []
      };
    }
  },

  /**
   * Create a new schedule and generate recurring lessons if applicable.
   */
  async createSchedule(scheduleData: CreateScheduleData) {
    const { data, error } = await getSupabase()
      .from('schedules')
      .insert({ ...scheduleData, user_id: SHARED_USER_ID })
      .select()
      .single();

    if (error) throw error;

    if (data && scheduleData.recurrence_type !== 'none') {
      await generateRecurringLessons(data.id, { ...scheduleData, user_id: SHARED_USER_ID });
    }

    return data;
  },

  /**
   * Update an existing schedule.
   */
  async updateSchedule(id: string, scheduleData: Partial<UpdateScheduleData>) {
    const { data, error } = await getSupabase()
      .from('schedules')
      .update({ ...scheduleData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Get all lessons for a specific schedule
   */
  async getScheduleLessons(scheduleId: string) {
    const { data, error } = await getSupabase()
      .from('lessons')
      .select(`
        *,
        lesson_books(
          id,
          lesson_id,
          book_id,
          pages_from,
          pages_to,
          notes,
          book:books(id, title, author, cover_image_url)
        ),
        lesson_tasks(
          id,
          lesson_id,
          task_id,
          position,
          is_homework,
          due_date,
          duration_override,
          notes,
          task:tasks(id, title, description, estimated_minutes)
        )
      `)
      .eq('schedule_id', scheduleId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Delete a schedule and its associated lessons.
   */
  async deleteSchedule(id: string) {
    const { error } = await getSupabase().from('schedules').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Transform lessons to calendar events format
   */
  transformToCalendarEvents(lessons: any[]): any[] {
    return lessons.map(lesson => {
      const startDateTime = new Date(`${lesson.date}T${lesson.start_time}`);
      const endDateTime = new Date(`${lesson.date}T${lesson.end_time}`);
      
      return {
        id: lesson.id,
        title: lesson.title,
        start: startDateTime,
        end: endDateTime,
        resource: {
          lesson,
          schedule: lesson.schedule
        },
        className: getLessonClassName(lesson.status)
      };
    });
  },

  // Get optimized admin schedules list - lightweight for performance
  async getAdminSchedulesList(filters: ScheduleFilters & { page?: number; perPage?: number; course_ids?: string[] } = {}): Promise<PaginatedResponse<Schedule>> {
    try {
      console.log('[ScheduleService] Getting admin schedules list with filters:', filters);
      const startTime = Date.now();
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
      if (filters.course_ids && filters.course_ids.length > 0) {
        // Send course IDs as comma-separated string
        params.append('course_ids', filters.course_ids.join(','));
      }
      params.append('page', String(filters.page || 1));
      params.append('perPage', String(filters.perPage || 20));
      
      // Use optimized admin-list endpoint
      const response = await fetch(`/api/schedules/admin-list?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Admin schedules list API error:', error);
        throw new Error(error.error || 'Failed to fetch admin schedules list');
      }
      
      const result = await response.json();
      const endTime = Date.now();
      
      console.log(`[ScheduleService] Admin schedules list loaded in ${endTime - startTime}ms (API: ${result.loadTime}ms)`);
      
      return result;
    } catch (error) {
      console.error('Error fetching admin schedules list:', error);
      throw error;
    }
  },
};

function getLessonClassName(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 border-green-300 text-green-800';
    case 'cancelled':
      return 'bg-red-100 border-red-300 text-red-800';
    case 'draft':
      return 'bg-gray-100 border-gray-300 text-gray-800';
    default:
      return 'bg-blue-100 border-blue-300 text-blue-800';
  }
}