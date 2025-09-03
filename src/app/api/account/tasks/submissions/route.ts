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

    // Get user's submissions with task details
    const { data: submissions, error } = await supabase
      .from('task_submissions')
      .select(`
        *,
        tasks!inner (
          id,
          title,
          description,
          points,
          media_required
        )
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }

    // Get media counts for each submission
    const submissionsWithMedia = await Promise.all(
      (submissions || []).map(async (submission) => {
        const { data: mediaFiles } = await supabase
          .from('task_media')
          .select('id')
          .eq('task_id', submission.task_id)
          .eq('user_id', user.id)
          .eq('is_active', true);

        return {
          ...submission,
          task: submission.tasks,
          media_count: mediaFiles?.length || 0
        };
      })
    );

    return NextResponse.json(submissionsWithMedia);

  } catch (error) {
    console.error('Error in user submissions API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch submissions' 
    }, { status: 500 });
  }
}