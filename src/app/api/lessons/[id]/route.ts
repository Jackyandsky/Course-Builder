import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

    const lessonId = params.id;
    console.log('[API] Getting lesson:', lessonId);

    // Get the lesson with its schedule and course
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select(`
        *,
        schedule:schedules(
          *,
          course:courses(*)
        )
      `)
      .eq('id', lessonId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Fetch lesson_books
    const { data: lessonBooks } = await supabase
      .from('lesson_books')
      .select(`
        *,
        book:books(*)
      `)
      .eq('lesson_id', lessonId);

    // Fetch lesson_tasks
    const { data: lessonTasks } = await supabase
      .from('lesson_tasks')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('lesson_id', lessonId);

    // Combine the data
    const fullLesson = {
      ...lesson,
      lesson_books: lessonBooks || [],
      lesson_tasks: lessonTasks || []
    };

    return NextResponse.json(fullLesson);

  } catch (error) {
    console.error('Error in GET /api/lessons/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const lessonId = params.id;
    const body = await request.json();
    
    console.log('[API] Updating lesson:', lessonId);

    // Remove fields that shouldn't be updated directly
    const { id, created_at, updated_at, schedule, lesson_books, lesson_tasks, ...updateData } = body;

    // Update the lesson
    const { data: lesson, error } = await supabase
      .from('lessons')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    return NextResponse.json(lesson);

  } catch (error) {
    console.error('Error in PUT /api/lessons/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const lessonId = params.id;
    console.log('[API] Deleting lesson:', lessonId);

    // Delete the lesson (cascade will handle related records)
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/lessons/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}