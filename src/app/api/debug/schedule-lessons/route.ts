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
    const courseTitle = searchParams.get('course') || '8-9 Reading & Writing Course';

    console.log('[Debug] Investigating schedule-lesson relationship for course:', courseTitle);

    // Get the course first
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .ilike('title', `%${courseTitle}%`)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found', courseTitle }, { status: 404 });
    }

    // Get schedules for this course
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('id, name, course_id, is_active')
      .eq('course_id', course.id);

    if (schedulesError) {
      return NextResponse.json({ error: 'Failed to fetch schedules', details: schedulesError.message }, { status: 500 });
    }

    // For each schedule, get lessons
    const scheduleData = [];
    for (const schedule of schedules || []) {
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, schedule_id, lesson_number, date')
        .eq('schedule_id', schedule.id)
        .order('lesson_number', { ascending: true });

      if (lessonsError) {
        console.error('Error fetching lessons for schedule:', schedule.name, lessonsError);
        continue;
      }

      scheduleData.push({
        schedule: {
          id: schedule.id,
          name: schedule.name,
          is_active: schedule.is_active
        },
        lessons: lessons || [],
        lessonCount: lessons?.length || 0,
        sampleLessonTitles: (lessons || []).slice(0, 3).map(l => l.title)
      });
    }

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title
      },
      scheduleData,
      summary: {
        totalSchedules: schedules?.length || 0,
        scheduleNames: schedules?.map(s => s.name) || [],
        totalLessonsAcrossSchedules: scheduleData.reduce((sum, sd) => sum + sd.lessonCount, 0)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/debug/schedule-lessons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}