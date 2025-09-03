import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const schedule_id = searchParams.get('schedule_id');
    const status = searchParams.get('status');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const offset = (page - 1) * perPage;

    console.log(`[AdminLessonsList] Loading page ${page} with ${perPage} items per page`);
    console.log(`[AdminLessonsList] Filters - search: "${search}", schedule_id: "${schedule_id}", status: "${status}"`);
    const startTime = Date.now();

    // Query with all necessary relationships for tabs
    let query = supabase
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
        created_at,
        updated_at,
        schedule_id,
        schedule:schedules(id, name, course_id, course:courses(id, title))
      `)
      .order('date', { ascending: false })
      .order('start_time', { ascending: true });

    // Apply filters
    if (search) {
      console.log(`[AdminLessonsList] Applying search filter: "${search}"`);
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }
    
    if (schedule_id) {
      console.log(`[AdminLessonsList] Applying schedule_id filter: "${schedule_id}"`);
      query = query.eq('schedule_id', schedule_id);
    }
    
    if (status) {
      console.log(`[AdminLessonsList] Applying status filter: "${status}"`);
      query = query.eq('status', status);
    }

    // Get total count for pagination (with same filters)
    let countQuery = supabase
      .from('lessons')
      .select('id', { count: 'exact' });

    // Apply the same filters to count query
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }
    
    if (schedule_id) {
      countQuery = countQuery.eq('schedule_id', schedule_id);
    }
    
    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    // Apply pagination
    const { data: lessons, error } = await query
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    // Debug logging for filtering results
    console.log(`[AdminLessonsList] Query returned ${lessons?.length || 0} lessons`);
    if (schedule_id && lessons?.length) {
      console.log(`[AdminLessonsList] First few lesson schedule_ids:`, lessons.slice(0, 3).map(l => ({ 
        title: l.title, 
        schedule_id: l.schedule_id,
        schedule_name: l.schedule?.name 
      })));
    }

    // Fetch lesson_books and lesson_tasks for all lessons with batching to avoid URL limits
    if (lessons && lessons.length > 0) {
      const lessonIds = lessons.map(l => l.id);
      
      // Helper function to batch queries to avoid URL length limits
      const batchQuery = async (tableName: string, selectClause: string, ids: string[], batchSize = 50, filterColumn = 'lesson_id') => {
        const results = [];
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          const { data } = await supabase
            .from(tableName)
            .select(selectClause)
            .in(filterColumn, batch);
          if (data) results.push(...data);
        }
        return results;
      };
      
      // Fetch lesson_books in batches
      const lessonBooks = await batchQuery('lesson_books', 'id,lesson_id,pages_from,pages_to,notes,book:books(id,title,author,isbn,cover_image_url)', lessonIds);
      
      // Fetch lesson_tasks in batches
      const lessonTasks = await batchQuery('lesson_tasks', 'id,lesson_id,is_homework,due_date,duration_override,task_id', lessonIds);
      
      // Get unique task IDs and fetch task details
      const taskIds = [...new Set(lessonTasks?.map(lt => lt.task_id).filter(Boolean) || [])];
      
      let taskDetailsMap = new Map();
      if (taskIds.length > 0) {
        const taskDetails = await batchQuery('tasks', 'id,title,description,duration_minutes', taskIds, 50, 'id');
        taskDetails?.forEach(task => {
          taskDetailsMap.set(task.id, task);
        });
      }
      
      // Debug logging
      console.log(`[DEBUG] lessonIds count: ${lessonIds.length}`);
      console.log(`[DEBUG] lessonTasks found: ${lessonTasks?.length || 0}`);
      console.log(`[DEBUG] taskIds found: ${taskIds.length}`, taskIds.slice(0, 3));
      console.log(`[DEBUG] taskDetails found: ${taskDetailsMap.size}`);
      if (taskDetailsMap.size > 0) {
        const firstTask = Array.from(taskDetailsMap.values())[0];
        console.log(`[DEBUG] Sample task:`, firstTask);
      }
      
      // Map the books and tasks to their respective lessons
      const lessonBooksMap = new Map();
      const lessonTasksMap = new Map();
      
      lessonBooks?.forEach(lb => {
        if (!lessonBooksMap.has(lb.lesson_id)) {
          lessonBooksMap.set(lb.lesson_id, []);
        }
        lessonBooksMap.get(lb.lesson_id).push(lb);
      });
      
      lessonTasks?.forEach(lt => {
        if (!lessonTasksMap.has(lt.lesson_id)) {
          lessonTasksMap.set(lt.lesson_id, []);
        }
        // Attach task details to lesson_task
        const taskDetails = taskDetailsMap.get(lt.task_id);
        const enrichedLessonTask = {
          ...lt,
          task: taskDetails || null
        };
        lessonTasksMap.get(lt.lesson_id).push(enrichedLessonTask);
      });
      
      // Add books and tasks to lessons
      lessons.forEach(lesson => {
        lesson.lesson_books = lessonBooksMap.get(lesson.id) || [];
        lesson.lesson_tasks = lessonTasksMap.get(lesson.id) || [];
      });
    }

    const endTime = Date.now();
    console.log(`[AdminLessonsList] Loaded ${lessons?.length || 0} lessons in ${endTime - startTime}ms`);

    // Get stats efficiently
    const stats = {
      total: count || 0,
      scheduled: lessons?.filter(l => l.status === 'scheduled').length || 0,
      completed: lessons?.filter(l => l.status === 'completed').length || 0,
      draft: lessons?.filter(l => l.status === 'draft').length || 0,
    };

    const totalPages = Math.ceil((count || 0) / perPage);

    return NextResponse.json({
      data: lessons || [],
      pagination: {
        page,
        perPage,
        total: count || 0,
        totalPages,
      },
      stats,
      loadTime: endTime - startTime
    });

  } catch (error) {
    console.error('Error in GET /api/lessons/admin-list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}