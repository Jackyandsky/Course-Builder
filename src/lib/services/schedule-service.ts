import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { 
  Schedule, 
  Lesson, 
  Attendance, 
  LessonObjective, 
  LessonMethod, 
  LessonTask,
  RecurrenceType,
  DayOfWeek
} from '@/types/schedule';

export class ScheduleService {
  private supabase = createClientComponentClient();

  // Schedule CRUD operations
  async getSchedules(filters?: { 
    course_id?: string; 
    is_active?: boolean;
    user_id?: string;
  }) {
    let query = this.supabase
      .from('schedules')
      .select(`
        *,
        course:courses(id, title, description),
        lessons(count)
      `)
      .order('created_at', { ascending: false });

    if (filters?.course_id) {
      query = query.eq('course_id', filters.course_id);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getSchedule(id: string) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select(`
        *,
        course:courses(*),
        lessons(
          *,
          objectives:lesson_objectives(
            *,
            objective:objectives(*)
          ),
          methods:lesson_methods(
            *,
            method:methods(*)
          ),
          tasks:lesson_tasks(
            *,
            task:tasks(*)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('schedules')
      .insert(schedule)
      .select()
      .single();

    if (error) throw error;

    // Generate lessons based on recurrence
    if (schedule.recurrence_type !== 'none' && data) {
      await this.generateRecurringLessons(data.id, schedule);
    }

    return data;
  }

  async updateSchedule(id: string, schedule: Partial<Schedule>) {
    const { data, error } = await this.supabase
      .from('schedules')
      .update(schedule)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSchedule(id: string) {
    const { error } = await this.supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Lesson CRUD operations
  async getLessons(filters?: {
    schedule_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    user_id?: string;
  }) {
    let query = this.supabase
      .from('lessons')
      .select(`
        *,
        schedule:schedules(
          *,
          course:courses(id, title)
        ),
        attendance(count)
      `)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (filters?.schedule_id) {
      query = query.eq('schedule_id', filters.schedule_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date_from) {
      query = query.gte('date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('date', filters.date_to);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getLesson(id: string) {
    const { data, error } = await this.supabase
      .from('lessons')
      .select(`
        *,
        schedule:schedules(
          *,
          course:courses(*)
        ),
        attendance(*),
        objectives:lesson_objectives(
          *,
          objective:objectives(*)
        ),
        methods:lesson_methods(
          *,
          method:methods(*)
        ),
        tasks:lesson_tasks(
          *,
          task:tasks(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createLesson(lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateLesson(id: string, lesson: Partial<Lesson>) {
    const { data, error } = await this.supabase
      .from('lessons')
      .update({
        ...lesson,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteLesson(id: string) {
    const { error } = await this.supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Attendance operations
  async getAttendance(lesson_id: string) {
    const { data, error } = await this.supabase
      .from('attendance')
      .select('*')
      .eq('lesson_id', lesson_id)
      .order('student_name');

    if (error) throw error;
    return data;
  }

  async markAttendance(attendance: Omit<Attendance, 'id' | 'marked_at'>) {
    const { data, error } = await this.supabase
      .from('attendance')
      .upsert({
        ...attendance,
        marked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async bulkMarkAttendance(lesson_id: string, attendances: Omit<Attendance, 'id' | 'lesson_id' | 'marked_at'>[]) {
    const records = attendances.map(a => ({
      ...a,
      lesson_id,
      marked_at: new Date().toISOString()
    }));

    const { data, error } = await this.supabase
      .from('attendance')
      .upsert(records)
      .select();

    if (error) throw error;
    return data;
  }

  // Helper methods
  async generateRecurringLessons(
    schedule_id: string, 
    schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>
  ) {
    const lessons: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>[] = [];
    const startDate = new Date(schedule.start_date);
    const endDate = schedule.end_date ? new Date(schedule.end_date) : new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3); // Default to 3 months if no end date

    let currentDate = new Date(startDate);
    let lessonNumber = 1;

    while (currentDate <= endDate) {
      if (this.shouldCreateLesson(currentDate, schedule)) {
        const [hours, minutes] = schedule.default_start_time.split(':').map(Number);
        const startTime = new Date(currentDate);
        startTime.setHours(hours, minutes, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + schedule.default_duration_minutes);

        lessons.push({
          schedule_id,
          title: `${schedule.name} - Lesson ${lessonNumber}`,
          date: currentDate.toISOString().split('T')[0],
          start_time: startTime.toTimeString().slice(0, 5),
          end_time: endTime.toTimeString().slice(0, 5),
          duration_minutes: schedule.default_duration_minutes,
          location: schedule.location,
          status: 'scheduled',
          user_id: schedule.user_id
        });

        lessonNumber++;
      }

      // Increment date based on recurrence type
      currentDate = this.getNextLessonDate(currentDate, schedule);
    }

    if (lessons.length > 0) {
      const { error } = await this.supabase
        .from('lessons')
        .insert(lessons);

      if (error) throw error;
    }
  }

  private shouldCreateLesson(date: Date, schedule: any): boolean {
    if (schedule.recurrence_type === 'none') return true;
    
    // const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    if (schedule.recurrence_days && schedule.recurrence_days.length > 0) {
      return schedule.recurrence_days.includes(dayOfWeek);
    }
    
    return true;
  }

  private getNextLessonDate(currentDate: Date, schedule: any): Date {
    const nextDate = new Date(currentDate);
    
    nextDate.setDate(nextDate.getDate() + 1);
    
    return nextDate;
  }

  // Calendar data transformation
  transformToCalendarEvents(lessons: Lesson[]): any[] {
    // console.log('Transforming lessons to calendar events:', lessons);
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
        className: this.getLessonClassName(lesson.status)
      };
    });
  }

  private getLessonClassName(status: string): string {
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

  // Statistics
  async getScheduleStats(schedule_id: string) {
    const { data: lessons, error } = await this.supabase
      .from('lessons')
      .select('status, attendance(status)')
      .eq('schedule_id', schedule_id);

    if (error) throw error;

    const stats = {
      total_lessons: lessons?.length || 0,
      completed_lessons: lessons?.filter(l => l.status === 'completed').length || 0,
      cancelled_lessons: lessons?.filter(l => l.status === 'cancelled').length || 0,
      scheduled_lessons: lessons?.filter(l => l.status === 'scheduled').length || 0,
      attendance_rate: 0
    };

    // Calculate attendance rate
    const allAttendance = lessons?.flatMap(l => l.attendance || []) || [];
    const presentCount = allAttendance.filter(a => a.status === 'present').length;
    if (allAttendance.length > 0) {
      stats.attendance_rate = Math.round((presentCount / allAttendance.length) * 100);
    }

    return stats;
  }
}

export const scheduleService = new ScheduleService();
