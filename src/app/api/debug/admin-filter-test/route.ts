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
    const testScheduleId = searchParams.get('schedule_id') || '865ca447-492a-49c6-baf7-dbf4670f4589';

    console.log('[AdminFilterTest] Testing admin-list filtering with schedule_id:', testScheduleId);

    // Step 1: Verify the schedule exists
    const { data: schedule, error: schedError } = await supabase
      .from('schedules')
      .select('id, name, course_id, course:courses(title)')
      .eq('id', testScheduleId)
      .single();

    if (schedError) {
      console.error('[AdminFilterTest] Schedule lookup error:', schedError);
      return NextResponse.json({ 
        error: 'Schedule lookup failed', 
        details: schedError.message,
        schedule_id: testScheduleId 
      }, { status: 500 });
    }

    if (!schedule) {
      return NextResponse.json({ 
        error: 'Schedule not found', 
        schedule_id: testScheduleId 
      }, { status: 404 });
    }

    console.log('[AdminFilterTest] Schedule found:', schedule.name);

    // Step 2: Test the EXACT same query as admin-list API
    console.log('[AdminFilterTest] Testing exact admin-list query structure...');
    
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

    // Apply the schedule filter - this is the critical line
    console.log('[AdminFilterTest] Applying schedule_id filter:', testScheduleId);
    query = query.eq('schedule_id', testScheduleId);

    const { data: lessons, error } = await query.limit(10);

    if (error) {
      console.error('[AdminFilterTest] Query error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    console.log(`[AdminFilterTest] Query returned ${lessons?.length || 0} lessons`);

    // Step 3: Analyze the results
    const analysis = {
      schedule_lookup: {
        id: schedule.id,
        name: schedule.name,
        course_title: schedule.course?.title
      },
      query_results: {
        total_returned: lessons?.length || 0,
        lessons: lessons?.map(lesson => ({
          title: lesson.title,
          lesson_schedule_id: lesson.schedule_id,
          schedule_relation_id: lesson.schedule?.id,
          schedule_name: lesson.schedule?.name,
          matches_requested: lesson.schedule_id === testScheduleId
        })) || []
      },
      filtering_analysis: {
        all_lessons_match: lessons?.every(lesson => lesson.schedule_id === testScheduleId) || false,
        mismatched_lessons: lessons?.filter(lesson => lesson.schedule_id !== testScheduleId).length || 0,
        unique_schedule_ids_in_results: [...new Set(lessons?.map(lesson => lesson.schedule_id) || [])],
        unique_schedule_names_in_results: [...new Set(lessons?.map(lesson => lesson.schedule?.name) || [])]
      }
    };

    // Step 4: If we have mismatches, log them for debugging
    if (analysis.filtering_analysis.mismatched_lessons > 0) {
      console.error('[AdminFilterTest] CRITICAL: Found mismatched lessons!');
      const mismatches = lessons?.filter(lesson => lesson.schedule_id !== testScheduleId) || [];
      mismatches.forEach(lesson => {
        console.error(`  - Lesson "${lesson.title}": expected schedule_id ${testScheduleId}, got ${lesson.schedule_id}`);
      });
    }

    return NextResponse.json({
      test_type: 'admin_filter_test',
      requested_schedule_id: testScheduleId,
      ...analysis
    });

  } catch (error) {
    console.error('Error in GET /api/debug/admin-filter-test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}