import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

// DELETE endpoint to reset/clear a task submission
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

    const taskId = params.id;

    // Find the existing submission
    const { data: submission, error: fetchError } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Delete files from filesystem if they exist
    if (submission.submission_data?.files) {
      for (const file of submission.submission_data.files) {
        if (file.path && existsSync(file.path)) {
          try {
            await unlink(file.path);

          } catch (err) {
            console.error('Failed to delete file:', file.path, err);
          }
        }
      }
    }

    // Delete the submission record entirely
    const { error: deleteError } = await supabase
      .from('task_submissions')
      .delete()
      .eq('id', submission.id);

    if (deleteError) {
      console.error('Error deleting submission:', deleteError);
      return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully',
      submission: null
    });

  } catch (error) {
    console.error('Error in DELETE submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to fetch submission status
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

    const taskId = params.id;

    // Find the submission
    const { data: submission, error } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching submission:', error);
      return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
    }

    return NextResponse.json({
      submission: submission || null
    });

  } catch (error) {
    console.error('Error in GET submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}