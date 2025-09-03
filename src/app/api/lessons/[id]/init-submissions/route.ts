import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await request.json();

    // Get all tasks for this lesson
    const { data: tasks, error: tasksError } = await supabase
      .from('lesson_tasks')
      .select('task_id')
      .eq('lesson_id', params.id);

    if (tasksError) {
      console.error('Error fetching lesson tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No tasks for this lesson',
        submissions: []
      });
    }

    const createdSubmissions = [];
    const existingSubmissions = [];

    // For each task, check if submission exists, create if not
    for (const lessonTask of tasks) {
      // Check for existing submission
      const { data: existingSubmission } = await supabase
        .from('task_submissions')
        .select('id, status, task_id')
        .eq('task_id', lessonTask.task_id)
        .eq('user_id', user.id)
        .single();

      if (existingSubmission) {
        existingSubmissions.push(existingSubmission);
      } else {
        // Create draft submission
        const { data: newSubmission, error: createError } = await supabase
          .from('task_submissions')
          .insert({
            task_id: lessonTask.task_id,
            user_id: user.id,
            course_id: courseId,
            lesson_id: params.id,
            status: 'pending', // Draft status
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating submission:', createError);
        } else if (newSubmission) {
          createdSubmissions.push(newSubmission);
        }
      }
    }

    return NextResponse.json({
      success: true,
      created: createdSubmissions.length,
      existing: existingSubmissions.length,
      submissions: [...createdSubmissions, ...existingSubmissions]
    });

  } catch (error) {
    console.error('Error initializing submissions:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize submissions' 
    }, { status: 500 });
  }
}