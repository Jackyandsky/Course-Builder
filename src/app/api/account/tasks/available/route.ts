import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return all tasks
    // In the future, you might want to filter based on:
    // - User's enrolled courses
    // - User's assigned lessons
    // - User's groups/teams
    
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        points,
        media_required,
        allowed_media_types,
        max_file_size_mb,
        max_files_count,
        priority,
        tags
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return NextResponse.json(tasks || []);

  } catch (error) {
    console.error('Error in available tasks API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch available tasks' 
    }, { status: 500 });
  }
}