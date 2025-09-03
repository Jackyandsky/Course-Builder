import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/courses/[id]/enrollment - Get course details with enrollment and lessons
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

    const courseId = params.id;

    // Fetch course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        category:categories(name)
      `)
      .eq('id', courseId)
      .single();

    if (courseError) {
      console.error('Error fetching course:', courseError);
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Fetch enrollment for this user and course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        schedule:schedules(
          id,
          name,
          description,
          start_date,
          end_date,
          location,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError) {
      console.error('Error fetching enrollment:', enrollmentError);
      return NextResponse.json({ 
        course,
        enrollment: null,
        lessons: [],
        message: 'Not enrolled in this course' 
      });
    }

    // Fetch lessons if enrollment has a schedule
    let lessons = [];
    if (enrollment?.schedule_id) {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('schedule_id', enrollment.schedule_id)
        .order('lesson_number', { ascending: true });

      if (!lessonsError && lessonsData) {
        // Fetch counts for each lesson
        lessons = await Promise.all(
          lessonsData.map(async (lesson) => {
            // Fetch task count
            const { count: taskCount } = await supabase
              .from('lesson_tasks')
              .select('*', { count: 'exact', head: true })
              .eq('lesson_id', lesson.id);

            // Fetch book count
            const { count: bookCount } = await supabase
              .from('lesson_books')
              .select('*', { count: 'exact', head: true })
              .eq('lesson_id', lesson.id);

            // Fetch vocabulary count
            const { count: vocabCount } = await supabase
              .from('lesson_vocabulary')
              .select('*', { count: 'exact', head: true })
              .eq('lesson_id', lesson.id);

            // Check user progress for this lesson
            const { data: userProgress } = await supabase
              .from('user_progress')
              .select('is_completed')
              .eq('user_id', user.id)
              .eq('lesson_id', lesson.id)
              .single();

            return {
              ...lesson,
              tasks_count: taskCount || 0,
              books_count: bookCount || 0,
              vocabulary_count: vocabCount || 0,
              is_taken: userProgress?.is_completed || false
            };
          })
        );
      }
    } else if (enrollment) {
      // If no schedule_id in enrollment, try to get the first active schedule for the course
      console.warn('Enrollment has no schedule_id, fetching first active schedule');
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!scheduleError && scheduleData) {
        // Update enrollment with schedule info
        enrollment.schedule = scheduleData;
        enrollment.schedule_id = scheduleData.id;

        // Fetch lessons for this schedule
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('schedule_id', scheduleData.id)
          .order('lesson_number', { ascending: true });

        if (!lessonsError && lessonsData) {
          lessons = await Promise.all(
            lessonsData.map(async (lesson) => {
              const { count: taskCount } = await supabase
                .from('lesson_tasks')
                .select('*', { count: 'exact', head: true })
                .eq('lesson_id', lesson.id);

              const { count: bookCount } = await supabase
                .from('lesson_books')
                .select('*', { count: 'exact', head: true })
                .eq('lesson_id', lesson.id);

              const { count: vocabCount } = await supabase
                .from('lesson_vocabulary')
                .select('*', { count: 'exact', head: true })
                .eq('lesson_id', lesson.id);

              // Check user progress for this lesson
              const { data: userProgress } = await supabase
                .from('user_progress')
                .select('is_completed')
                .eq('user_id', user.id)
                .eq('lesson_id', lesson.id)
                .single();

              return {
                ...lesson,
                tasks_count: taskCount || 0,
                books_count: bookCount || 0,
                vocabulary_count: vocabCount || 0,
                is_taken: userProgress?.is_completed || false
              };
            })
          );
        }
      }
    }

    return NextResponse.json({
      course,
      enrollment,
      lessons
    });

  } catch (error) {
    console.error('Error in GET course enrollment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}