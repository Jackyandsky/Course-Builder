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

    console.log('[TestAdminList] Testing admin-list API with schedule_id:', scheduleId);

    // Make a direct call to the admin-list API endpoint logic
    // Copy the exact same query structure as admin-list route
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
        schedule_id,
        schedule:schedules(id, name, course_id, course:courses(id, title))
      `)
      .order('date', { ascending: false })
      .order('start_time', { ascending: true });

    // Apply the schedule filter exactly like admin-list does
    console.log('[TestAdminList] Applying schedule_id filter:', scheduleId);
    query = query.eq('schedule_id', scheduleId);

    const { data: lessons, error } = await query.limit(10);

    if (error) {
      console.error('[TestAdminList] Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    console.log(`[TestAdminList] Query returned ${lessons?.length || 0} lessons`);

    const result = {
      test_type: 'admin_list_api_simulation',
      requested_schedule_id: scheduleId,
      returned_lesson_count: lessons?.length || 0,
      lessons: lessons?.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        lesson_schedule_id: lesson.schedule_id,
        schedule_name: lesson.schedule?.name,
        schedule_relation_id: lesson.schedule?.id,
        course_title: lesson.schedule?.course?.title,
        lesson_number: lesson.lesson_number,
        date: lesson.date
      })) || [],
      // Analysis
      all_lessons_match_requested_schedule: lessons?.every(lesson => lesson.schedule_id === scheduleId) || false,
      mismatched_lessons: lessons?.filter(lesson => lesson.schedule_id !== scheduleId).map(lesson => ({
        lesson_title: lesson.title,
        expected_schedule_id: scheduleId,
        actual_schedule_id: lesson.schedule_id,
        actual_schedule_name: lesson.schedule?.name
      })) || [],
      summary: {
        requested_schedule: scheduleId,
        lesson_titles_returned: lessons?.slice(0, 3).map(l => l.title) || [],
        schedule_names_in_results: [...new Set(lessons?.map(l => l.schedule?.name))] || []
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in GET /api/debug/test-admin-list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}