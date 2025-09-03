import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// GET course tasks
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Fetch course tasks with task details
    const { data, error } = await supabase
      .from('course_tasks')
      .select(`
        id,
        position,
        task:tasks (
          id,
          title,
          description,
          difficulty,
          duration_minutes,
          submission_type,
          tags,
          category:categories (
            id,
            name,
            color,
            icon
          )
        )
      `)
      .eq('course_id', params.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching course tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch course tasks' }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/courses/[id]/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add task to course
export async function POST(
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

    const body = await request.json();
    const { taskIds } = body;

    if (!taskIds || !Array.isArray(taskIds)) {
      return NextResponse.json({ error: 'Task IDs array is required' }, { status: 400 });
    }

    // Get the current max position
    const { data: existingTasks } = await supabase
      .from('course_tasks')
      .select('position')
      .eq('course_id', params.id)
      .order('position', { ascending: false })
      .limit(1);

    const startPosition = existingTasks && existingTasks.length > 0 
      ? (existingTasks[0].position || 0) + 1 
      : 0;

    // Add tasks to course
    const inserts = taskIds.map((taskId: string, index: number) => ({
      course_id: params.id,
      task_id: taskId,
      position: startPosition + index
    }));

    const { data, error } = await supabase
      .from('course_tasks')
      .insert(inserts)
      .select();

    if (error) {
      console.error('Error adding tasks to course:', error);
      return NextResponse.json({ error: 'Failed to add tasks to course' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/courses/[id]/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove task from course
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

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Remove task from course
    const { error } = await supabase
      .from('course_tasks')
      .delete()
      .match({ course_id: params.id, task_id: taskId });

    if (error) {
      console.error('Error removing task from course:', error);
      return NextResponse.json({ error: 'Failed to remove task from course' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/courses/[id]/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update task position in course
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

    const body = await request.json();
    const { taskOrders } = body;

    if (!taskOrders || !Array.isArray(taskOrders)) {
      return NextResponse.json({ error: 'Task orders array is required' }, { status: 400 });
    }

    // Update positions
    const updates = taskOrders.map(({ taskId, position }: any) =>
      supabase
        .from('course_tasks')
        .update({ position })
        .match({ course_id: params.id, task_id: taskId })
    );

    const results = await Promise.all(updates);
    
    // Check if any update failed
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error updating task positions:', errors);
      return NextResponse.json({ error: 'Failed to update task positions' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/courses/[id]/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}