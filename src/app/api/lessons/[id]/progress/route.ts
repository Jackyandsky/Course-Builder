'use server';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

// Mark lesson as started/in-progress
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lessonId = params.id;
    const { courseId, enrollmentId } = await request.json();

    // Check if progress record already exists
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('lesson_id', lessonId)
      .single();

    if (existingProgress) {
      // Update existing record
      const { data, error } = await supabase
        .from('user_progress')
        .update({
          attempts: (existingProgress.attempts || 0) + 1,
          started_at: new Date().toISOString()
        })
        .eq('id', existingProgress.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // Create new progress record
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          user_id: session.user.id,
          lesson_id: lessonId,
          course_id: courseId,
          enrollment_id: enrollmentId,
          started_at: new Date().toISOString(),
          attempts: 1,
          is_completed: false
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error tracking lesson progress:', error);
    return NextResponse.json(
      { error: 'Failed to track lesson progress' },
      { status: 500 }
    );
  }
}

// Mark lesson as completed
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lessonId = params.id;
    const { score, timeSpent, assessmentData } = await request.json();

    // Update progress to completed
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        completed_at: new Date().toISOString(),
        is_completed: true,
        score,
        time_spent: timeSpent,
        assessment_data: assessmentData
      })
      .eq('user_id', session.user.id)
      .eq('lesson_id', lessonId)
      .select()
      .single();

    if (error) throw error;

    // Also update enrollment progress
    if (data?.enrollment_id) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('progress')
        .eq('id', data.enrollment_id)
        .single();

      if (enrollment) {
        const currentProgress = enrollment.progress || { completed_lessons: [] };
        if (!currentProgress.completed_lessons.includes(lessonId)) {
          currentProgress.completed_lessons.push(lessonId);
        }

        await supabase
          .from('enrollments')
          .update({ progress: currentProgress })
          .eq('id', data.enrollment_id);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error completing lesson:', error);
    return NextResponse.json(
      { error: 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}

// Get user's progress for a lesson
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lessonId = params.id;

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('lesson_id', lessonId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return NextResponse.json(data || null);
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson progress' },
      { status: 500 }
    );
  }
}