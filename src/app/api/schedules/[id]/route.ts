import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // Fetch schedule with related data
    // First get the schedule with course
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('id', id)
      .single();

    if (scheduleError) {
      console.error('Database error fetching schedule:', scheduleError);
      return NextResponse.json(
        { error: 'Failed to fetch schedule', details: scheduleError.message },
        { status: 500 }
      );
    }

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Then get the lessons - simplified query first
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('schedule_id', id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    // If lessons were fetched successfully, get their relationships
    let enrichedLessons = lessons || [];
    if (lessons && lessons.length > 0 && !lessonsError) {
      // Get lesson books and tasks separately to avoid complex joins
      const lessonIds = lessons.map(l => l.id);
      
      // Fetch lesson_books
      const { data: lessonBooks } = await supabase
        .from('lesson_books')
        .select(`
          id,
          lesson_id,
          book_id,
          pages_from,
          pages_to,
          notes,
          books(*)
        `)
        .in('lesson_id', lessonIds);
      
      // Fetch lesson_tasks
      const { data: lessonTasks } = await supabase
        .from('lesson_tasks')
        .select(`
          id,
          lesson_id,
          task_id,
          position,
          is_homework,
          due_date,
          duration_override,
          notes,
          tasks(*)
        `)
        .in('lesson_id', lessonIds);
      
      // Map relationships to lessons
      enrichedLessons = lessons.map(lesson => ({
        ...lesson,
        lesson_books: lessonBooks?.filter(lb => lb.lesson_id === lesson.id) || [],
        lesson_tasks: lessonTasks?.filter(lt => lt.lesson_id === lesson.id) || []
      }));
    }

    if (lessonsError) {
      console.error('Database error fetching lessons:', lessonsError);
      // Continue without lessons rather than failing completely
      return NextResponse.json({
        ...schedule,
        lessons: []
      });
    }

    // Combine the data
    const scheduleWithLessons = {
      ...schedule,
      lessons: enrichedLessons
    };

    return NextResponse.json(scheduleWithLessons);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // Update schedule
    const { data, error } = await supabase
      .from('schedules')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating schedule:', error);
      return NextResponse.json(
        { error: 'Failed to update schedule', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // Delete schedule (lessons will be cascade deleted)
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error deleting schedule:', error);
      return NextResponse.json(
        { error: 'Failed to delete schedule', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}