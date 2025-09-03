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

    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        is_active,
        default_start_time,
        default_duration_minutes,
        location,
        max_students
      `)
      .eq('course_id', courseId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedules: schedules || [] });
  } catch (error) {
    console.error('Error in schedules API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}