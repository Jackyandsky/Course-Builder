import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// GET lesson tasks
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Fetch lesson tasks with task details
    const { data, error } = await supabase
      .from('lesson_tasks')
      .select(`
        id,
        position,
        task:tasks (
          id,
          title,
          description,
          difficulty,
          time_estimate,
          submission_type,
          tags,
          priority,
          points,
          category:categories (
            id,
            name,
            color,
            icon
          )
        )
      `)
      .eq('lesson_id', params.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching lesson tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch lesson tasks' }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/lessons/[id]/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add task to lesson
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
    const { taskId, position } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Get the current max position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
      const { data: existingTasks } = await supabase
        .from('lesson_tasks')
        .select('position')
        .eq('lesson_id', params.id)
        .order('position', { ascending: false })
        .limit(1);

      finalPosition = existingTasks && existingTasks.length > 0 
        ? (existingTasks[0].position || 0) + 1 
        : 0;
    }

    // Add task to lesson
    const { data, error } = await supabase
      .from('lesson_tasks')
      .insert({
        lesson_id: params.id,
        task_id: taskId,
        position: finalPosition
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding task to lesson:', error);
      return NextResponse.json({ error: 'Failed to add task to lesson' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/lessons/[id]/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove task from lesson  
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
    const relationId = searchParams.get('relationId');

    if (!relationId) {
      return NextResponse.json({ error: 'Relation ID is required' }, { status: 400 });
    }

    // Remove task from lesson by relation ID
    const { error } = await supabase
      .from('lesson_tasks')
      .delete()
      .eq('id', relationId);

    if (error) {
      console.error('Error removing task from lesson:', error);
      return NextResponse.json({ error: 'Failed to remove task from lesson' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/lessons/[id]/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update task position in lesson
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
        .from('lesson_tasks')
        .update({ position })
        .match({ lesson_id: params.id, task_id: taskId })
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
    console.error('Error in PUT /api/lessons/[id]/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}