import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// GET complete course data - all sections in one request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const courseId = params.id;
    
    console.log(`[CourseComplete] Loading all data for course ${courseId}`);
    const startTime = Date.now();
    
    // First get schedule IDs for this course
    const { data: schedules } = await supabase
      .from('schedules')
      .select('id')
      .eq('course_id', courseId);
    
    const scheduleIds = schedules?.map(s => s.id) || [];
    
    // Load ALL course data in parallel
    const [
      courseData,
      objectivesData,
      methodsData,
      booksData,
      vocabularyData,
      tasksData,
      schedulesData,
      lessonsData
    ] = await Promise.all([
      // Course basic info
      supabase
        .from('courses')
        .select(`
          *,
          category:categories(id, name, color, icon)
        `)
        .eq('id', courseId)
        .single(),
      
      // Course objectives
      supabase
        .from('course_objectives')
        .select(`
          id,
          position,
          objective:objectives (
            id,
            title,
            description,
            tags,
            category:categories (
              id,
              name,
              color,
              icon
            )
          )
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true }),
      
      // Course methods
      supabase
        .from('course_methods')
        .select(`
          id,
          position,
          method:methods (
            id,
            name,
            description,
            tags,
            category:categories (
              id,
              name,
              color,
              icon
            )
          )
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true }),
      
      // Course books
      supabase
        .from('course_books')
        .select(`
          id,
          position,
          book:books (
            id,
            title,
            author,
            cover_image_url
          )
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true }),
      
      // Course vocabulary
      supabase
        .from('course_vocabulary_groups')
        .select(`
          id,
          position,
          vocabulary_group:vocabulary_groups (
            id,
            name,
            description
          )
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true }),
      
      // Course tasks
      supabase
        .from('course_tasks')
        .select(`
          id,
          position,
          task:tasks (
            id,
            title,
            description
          )
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true }),
      
      // Course schedules
      supabase
        .from('schedules')
        .select(`
          id,
          name,
          description,
          start_date,
          end_date,
          is_active,
          default_start_time,
          default_duration_minutes,
          location,
          max_students
        `)
        .eq('course_id', courseId)
        .order('start_date', { ascending: true }),
      
      // Course lessons (sessions) for all schedules
      scheduleIds.length > 0 ? supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          lesson_number,
          date,
          start_time,
          end_time,
          duration_minutes,
          status,
          location,
          schedule_id,
          schedule:schedules(id, name)
        `)
        .in('schedule_id', scheduleIds)
        .order('date', { ascending: true })
        .order('lesson_number', { ascending: true }) : Promise.resolve({ data: [], error: null })
    ]);
    
    const endTime = Date.now();
    console.log(`[CourseComplete] Loaded all data in ${endTime - startTime}ms`);
    
    // Check for errors
    const errors = [
      courseData.error,
      objectivesData.error,
      methodsData.error,
      booksData.error,
      vocabularyData.error,
      tasksData.error,
      schedulesData.error,
      lessonsData.error
    ].filter(Boolean);
    
    if (errors.length > 0) {
      console.error('Errors loading course data:', errors);
      return NextResponse.json({ error: 'Failed to load complete course data', errors }, { status: 400 });
    }
    
    // Structure the response
    const completeData = {
      course: courseData.data,
      objectives: objectivesData.data || [],
      methods: methodsData.data || [],
      books: booksData.data || [],
      vocabulary: vocabularyData.data || [],
      tasks: tasksData.data || [],
      schedules: schedulesData.data || [],
      lessons: lessonsData.data || [],
      loadedAt: new Date().toISOString(),
      loadTime: endTime - startTime
    };
    
    // Add cache-busting headers to ensure fresh data
    const response = NextResponse.json(completeData);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error in GET /api/courses/[id]/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}