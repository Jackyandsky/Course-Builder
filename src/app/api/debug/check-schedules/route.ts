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

    // Get the specific course we're testing
    const courseId = '461e5e40-4268-4b14-a051-e3586cd2fbed'; // 8-9 Reading & Writing Course

    // Get all schedules for this course
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('id, name, course_id, is_active')
      .eq('course_id', courseId)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check for duplicate names
    const nameMap = new Map<string, string[]>();
    schedules?.forEach(schedule => {
      if (!nameMap.has(schedule.name)) {
        nameMap.set(schedule.name, []);
      }
      nameMap.get(schedule.name)?.push(schedule.id);
    });

    const duplicates = Array.from(nameMap.entries())
      .filter(([name, ids]) => ids.length > 1)
      .map(([name, ids]) => ({ name, ids }));

    // Check specifically for week15 and week30
    const week15Schedules = schedules?.filter(s => s.name.toLowerCase().includes('week15')) || [];
    const week30Schedules = schedules?.filter(s => s.name.toLowerCase().includes('week30')) || [];

    return NextResponse.json({
      course: '8-9 Reading & Writing Course',
      course_id: courseId,
      total_schedules: schedules?.length || 0,
      all_schedules: schedules || [],
      duplicates: duplicates.length > 0 ? duplicates : 'No duplicate schedule names found',
      week15_schedules: {
        count: week15Schedules.length,
        schedules: week15Schedules
      },
      week30_schedules: {
        count: week30Schedules.length,
        schedules: week30Schedules
      },
      expected_ids: {
        week15: '865ca447-492a-49c6-baf7-dbf4670f4589',
        week30: '583d9d7b-4a8a-4334-a67e-2419c674e5a4'
      }
    });

  } catch (error) {
    console.error('Error in GET /api/debug/check-schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}