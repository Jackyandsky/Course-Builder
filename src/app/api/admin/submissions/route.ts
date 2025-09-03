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

    // Check if user is admin or teacher
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'teacher'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all submissions with related data including course and lesson info
    const { data: submissions, error } = await supabase
      .from('task_submissions')
      .select(`
        *,
        task:tasks!inner (
          id,
          title,
          points,
          media_required
        ),
        course_id,
        lesson_id
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }

    // Get user information, media counts, course and lesson info for each submission
    const submissionsWithDetails = await Promise.all(
      (submissions || []).map(async (submission) => {
        // Get user profile with email
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('full_name, email')
          .eq('id', submission.user_id)
          .single();

        // Get media files count
        const { data: mediaFiles } = await supabase
          .from('task_media')
          .select('id')
          .eq('task_id', submission.task_id)
          .eq('user_id', submission.user_id)
          .eq('is_active', true);

        // Get course info if course_id exists
        let courseInfo = null;
        if (submission.course_id) {
          const { data: course } = await supabase
            .from('courses')
            .select('id, title')
            .eq('id', submission.course_id)
            .single();
          courseInfo = course;
        }

        // Get lesson info if lesson_id exists
        let lessonInfo = null;
        if (submission.lesson_id) {
          const { data: lesson } = await supabase
            .from('lessons')
            .select('id, title, lesson_number, course_id')
            .eq('id', submission.lesson_id)
            .single();
          lessonInfo = lesson;
          
          // If we got lesson but not course, get course from lesson
          if (lessonInfo && lessonInfo.course_id && !courseInfo) {
            const { data: course } = await supabase
              .from('courses')
              .select('id, title')
              .eq('id', lessonInfo.course_id)
              .single();
            courseInfo = course;
            submission.course_id = lessonInfo.course_id;
          }
        }

        return {
          ...submission,
          media_count: mediaFiles?.length || 0,
          user: {
            id: submission.user_id,
            email: userProfile?.email || 'Unknown',
            user_profiles: {
              full_name: userProfile?.full_name
            }
          },
          course: courseInfo,
          lesson: lessonInfo
        };
      })
    );

    return NextResponse.json(submissionsWithDetails);

  } catch (error) {
    console.error('Error in submissions API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch submissions' 
    }, { status: 500 });
  }
}