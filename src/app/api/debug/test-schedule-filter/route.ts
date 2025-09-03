import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('schedule_id') || '865ca447-492a-49c6-baf7-dbf4670f4589';

    console.log('[TestScheduleFilter] Testing schedule filtering for:', scheduleId);

    // Test the EXACT same query structure as admin-list API
    let query = supabase
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
        created_at,
        updated_at,
        schedule:schedules(id, name, course_id, course:courses(id, title))
      `)
      .order('date', { ascending: false })
      .order('start_time', { ascending: true });

    console.log('[TestScheduleFilter] Applying schedule_id filter:', scheduleId);
    query = query.eq('schedule_id', scheduleId);

    const { data: lessons, error } = await query.limit(10);

    if (error) {
      console.error('[TestScheduleFilter] Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    console.log(`[TestScheduleFilter] Query returned ${lessons?.length || 0} lessons`);
    
    const result = {
      requestedScheduleId: scheduleId,
      returnedLessonCount: lessons?.length || 0,
      lessons: lessons?.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        actual_schedule_id: lesson.schedule_id,
        schedule_name: lesson.schedule?.name,
        schedule_relation_id: lesson.schedule?.id,
        course_title: lesson.schedule?.course?.title,
        lesson_number: lesson.lesson_number,
        date: lesson.date
      })) || [],
      // Check if results match expected schedule
      correctlyFiltered: lessons?.every(lesson => lesson.schedule_id === scheduleId) || false,
      scheduleIdMismatches: lessons?.filter(lesson => lesson.schedule_id !== scheduleId).map(lesson => ({
        lesson_title: lesson.title,
        expected_schedule_id: scheduleId,
        actual_schedule_id: lesson.schedule_id
      })) || []
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in GET /api/debug/test-schedule-filter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}