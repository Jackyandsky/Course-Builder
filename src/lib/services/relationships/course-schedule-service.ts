import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

export class CourseScheduleService {
  private supabase = createSupabaseClient()

  // Link a schedule to a course
  async linkScheduleToCourse(scheduleId: string, courseId: string) {
    const { data, error } = await this.supabase
      .from('schedules')
      .update({ course_id: courseId })
      .eq('id', scheduleId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Unlink a schedule from a course
  async unlinkScheduleFromCourse(scheduleId: string) {
    const { data, error } = await this.supabase
      .from('schedules')
      .update({ course_id: null })
      .eq('id', scheduleId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get all schedules for a course
  async getCourseSchedules(courseId: string) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select(`
        *,
        lessons (
          id,
          title,
          date,
          start_time,
          end_time,
          status
        )
      `)
      .eq('course_id', courseId)
      .order('start_date', { ascending: true })

    if (error) throw error
    return data
  }

  // Get active schedules for a course
  async getActiveCourseSchedules(courseId: string) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select(`
        *,
        lessons (
          id,
          title,
          date,
          start_time,
          end_time,
          status
        )
      `)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })

    if (error) throw error
    return data
  }

  // Get course for a schedule
  async getScheduleCourse(scheduleId: string) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select(`
        course:courses (
          id,
          title,
          description,
          status,
          difficulty
        )
      `)
      .eq('id', scheduleId)
      .single()

    if (error) throw error
    return data?.course
  }

  // Get all lessons for a course across all schedules
  async getCourseLessons(courseId: string) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select(`
        lessons (
          *,
          schedule:schedules (
            id,
            name
          )
        )
      `)
      .eq('course_id', courseId)

    if (error) throw error

    // Flatten lessons from all schedules
    const lessons = data?.flatMap(schedule => 
      schedule.lessons?.map(lesson => ({
        ...lesson,
        schedule: schedule
      })) ?? []
    )

    return lessons
  }

  // Get upcoming lessons for a course
  async getUpcomingCourseLessons(courseId: string, limit = 10) {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await this.supabase
      .from('schedules')
      .select(`
        lessons (
          *,
          schedule:schedules (
            id,
            name
          )
        )
      `)
      .eq('course_id', courseId)
      .eq('is_active', true)

    if (error) throw error

    // Flatten and filter upcoming lessons
    const upcomingLessons = data?.flatMap(schedule => 
      schedule.lessons?.filter(lesson => lesson.date >= today) ?? []
    )
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.start_time.localeCompare(b.start_time)
    })
    .slice(0, limit)

    return upcomingLessons
  }

  // Check if a course has any schedules
  async courseHasSchedules(courseId: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('schedules')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)

    if (error) throw error
    return (count ?? 0) > 0
  }

  // Get course progress based on completed lessons
  async getCourseProgress(courseId: string) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select(`
        lessons (
          status
        )
      `)
      .eq('course_id', courseId)

    if (error) throw error

    const allLessons = data?.flatMap(schedule => schedule.lessons ?? []) ?? []
    const completedLessons = allLessons.filter(lesson => lesson.status === 'completed')

    return {
      totalLessons: allLessons.length,
      completedLessons: completedLessons.length,
      progressPercentage: allLessons.length > 0 
        ? Math.round((completedLessons.length / allLessons.length) * 100)
        : 0
    }
  }

  // Create a schedule for a course
  async createCourseSchedule(courseId: string, scheduleData: {
    name: string
    description?: string
    start_date: string
    end_date: string
    timezone?: string
    recurrence_rule?: string
    tags?: string[]
    default_start_time?: string
    default_duration_minutes?: number
    location?: string
    max_students?: number
    is_active?: boolean
  }) {
    const { data: userData, error: userError } = await this.supabase.auth.getUser()
    if (userError) throw userError

    const { data, error } = await this.supabase
      .from('schedules')
      .insert({
        ...scheduleData,
        course_id: courseId,
        user_id: userData.user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const courseScheduleService = new CourseScheduleService()
