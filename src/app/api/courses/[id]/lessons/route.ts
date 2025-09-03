import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const courseId = params.id;
    
    // Get schedule_id from query params if provided
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('schedule_id');

    let scheduleIds: string[] = [];
    
    if (scheduleId) {
      // If specific schedule_id is provided, only use that
      scheduleIds = [scheduleId];
    } else {
      // Otherwise, get all schedules for this course
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select('id')
        .eq('course_id', courseId);

      if (scheduleError) {
        console.error('Error fetching schedules:', scheduleError);
        return NextResponse.json(
          { error: 'Failed to fetch schedules' },
          { status: 500 }
        );
      }

      scheduleIds = schedules?.map(s => s.id) || [];
    }

    // Now fetch lessons that belong to these schedules
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        description,
        lesson_number,
        date,
        start_time,
        end_time,
        duration_minutes,
        status,
        location,
        schedule_id,
        schedule:schedules(id, name)
      `)
      .in('schedule_id', scheduleIds)
      .order('date', { ascending: true })
      .order('lesson_number', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 500 }
      );
    }

    // Add course_id to each lesson for consistency
    const lessonsWithCourseId = (lessons || []).map(lesson => ({
      ...lesson,
      course_id: courseId
    }));

    return NextResponse.json({ lessons: lessonsWithCourseId });
  } catch (error) {
    console.error('Error in lessons API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}