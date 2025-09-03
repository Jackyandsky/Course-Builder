import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/lib/supabase/tasks';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const taskWithBelongings = await taskService.getTaskWithBelongings(params.id);
    

    return NextResponse.json(taskWithBelongings);
  } catch (error) {
    console.error('API: Error fetching task with belongings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}