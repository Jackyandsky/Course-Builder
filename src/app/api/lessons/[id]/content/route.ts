'use server';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current session - but be more lenient
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // For public content, we might allow access without auth
    // For now, still require auth but return better error
    if (sessionError || !session) {
      // Return 401 with retry hint
      return NextResponse.json({ 
        error: 'Authentication required',
        retry: true 
      }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store', // Don't cache auth errors
        }
      });
    }

    const lessonId = params.id;

    // Fetch lesson details
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (lessonError) {
      console.error('Error fetching lesson:', lessonError);
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Fetch course info
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', lessonData.course_id)
      .single();

    // Fetch navigation lessons (previous and next)
    let previousLesson = null;
    let nextLesson = null;

    if (lessonData.schedule_id) {
      const { data: allLessons, error: navError } = await supabase
        .from('lessons')
        .select('id, title, lesson_number')
        .eq('schedule_id', lessonData.schedule_id)
        .order('lesson_number', { ascending: true });

      if (!navError && allLessons) {
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        if (currentIndex > 0) {
          previousLesson = allLessons[currentIndex - 1];
        }
        if (currentIndex < allLessons.length - 1) {
          nextLesson = allLessons[currentIndex + 1];
        }
      }
    }

    // Fetch tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('lesson_tasks')
      .select(`
        task_id,
        position,
        is_required,
        tasks (
          id,
          title,
          description,
          points,
          media_required,
          allowed_media_types,
          max_file_size_mb,
          max_files_count,
          submission_type,
          text_submission_enabled,
          text_submission_instructions
        )
      `)
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true });

    const tasks = tasksData?.map(lt => ({
      ...lt.tasks,
      is_required: lt.is_required
    })) || [];

    // Fetch task submissions for the current user
    const taskIds = tasks.map(t => t.id);
    const { data: submissions } = await supabase
      .from('task_submissions')
      .select('id, task_id, status, submission_text, submission_data, submitted_at')
      .in('task_id', taskIds)
      .eq('user_id', session.user.id);

    // Add submission data to tasks
    const tasksWithSubmissions = tasks.map(task => {
      const submission = submissions?.find(s => s.task_id === task.id);
      return {
        ...task,
        submission: submission || null,
        is_completed: submission?.status === 'submitted' || submission?.status === 'approved'
      };
    });

    // Fetch books
    const { data: booksData, error: booksError } = await supabase
      .from('lesson_books')
      .select(`
        book_id,
        pages,
        is_required,
        notes,
        books (
          id,
          title,
          author
        )
      `)
      .eq('lesson_id', lessonId);

    const books = booksData?.map(lb => ({
      ...lb.books,
      pages: lb.pages,
      is_required: lb.is_required,
      notes: lb.notes
    })) || [];

    // Fetch vocabulary
    const { data: vocabData, error: vocabError } = await supabase
      .from('lesson_vocabulary')
      .select(`
        vocabulary_id,
        position,
        vocabulary (
          id,
          word,
          definition,
          example_sentence,
          language
        )
      `)
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true });

    const vocabulary = vocabData?.map(lv => ({
      id: lv.vocabulary.id,
      word: lv.vocabulary.word,
      definition: lv.vocabulary.definition,
      example: lv.vocabulary.example_sentence,
      language: lv.vocabulary.language
    })) || [];

    // DO NOT mark lesson as completed globally - this is now handled per-user via user_progress table

    return NextResponse.json({
      lesson: lessonData,
      course: courseData,
      previousLesson,
      nextLesson,
      tasks: tasksWithSubmissions,
      books,
      vocabulary
    });

  } catch (error) {
    console.error('Error fetching lesson content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}