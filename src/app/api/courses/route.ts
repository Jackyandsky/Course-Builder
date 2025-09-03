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
    const status = searchParams.get('status');
    const difficulty = searchParams.get('difficulty');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const isPublic = searchParams.get('isPublic');
    const isAdmin = searchParams.get('isAdmin') === 'true';
    const isSimple = searchParams.get('simple') === 'true'; // New parameter for simple mode
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '12');
    const offset = (page - 1) * perPage;

    // Build query - simplified for selectors or full for display
    let query;
    
    if (isSimple) {
      // Simple mode: only fetch id and title for dropdown selectors
      query = supabase
        .from('courses')
        .select('id, title')
        .order('title', { ascending: true });
    } else {
      // Full mode: get all fields including relationships
      query = supabase
        .from('courses')
        .select(`
          *,
          category:categories(id, name, color, icon),
          course_books(
            id,
            book_id,
            is_required,
            book:books(id, title, author)
          ),
          course_objectives(
            id,
            objective_id,
            objective:objectives(id, title)
          ),
          course_methods(
            id,
            method_id,
            method:methods(id, name, description)
          ),
          course_tasks(
            id,
            task_id,
            task:tasks(id, title)
          ),
          schedules(
            id,
            name,
            start_date,
            recurrence_type
          )
        `)
        .order('title', { ascending: true });
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    if (isPublic !== null && isPublic !== undefined) {
      query = query.eq('is_public', isPublic === 'true');
    }
    
    // For admin panel, show all courses regardless of public status
    // For public pages, only show public published courses
    if (!isAdmin) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      if (!profile || !['admin', 'teacher'].includes(profile.role)) {
        query = query.eq('is_public', true).eq('status', 'published');
      }
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Get total count for pagination info
    const countQuery = supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });
    
    // Apply same filters to count query
    if (status) countQuery.eq('status', status);
    if (difficulty) countQuery.eq('difficulty', difficulty);
    if (categoryId) countQuery.eq('category_id', categoryId);
    if (isPublic !== null && isPublic !== undefined) {
      countQuery.eq('is_public', isPublic === 'true');
    }
    if (!isAdmin) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      if (!profile || !['admin', 'teacher'].includes(profile.role)) {
        countQuery.eq('is_public', true).eq('status', 'published');
      }
    }
    if (search) {
      countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { count } = await countQuery;

    // Apply pagination to main query (skip for simple mode - dropdowns need all items)
    if (!isSimple) {
      query = query.range(offset, offset + perPage - 1);
    }

    const { data: courses, error } = await query;


    if (error) {
      console.error('API: Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats from filtered results if admin request
    let stats = null;
    if (isAdmin) {
      // Get all filtered courses just for status counts
      const statsQuery = supabase
        .from('courses')
        .select('status');
      
      // Apply same filters for stats
      if (categoryId) statsQuery.eq('category_id', categoryId);
      if (isPublic !== null && isPublic !== undefined) {
        statsQuery.eq('is_public', isPublic === 'true');
      }
      if (search) {
        statsQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      const { data: allFilteredCourses } = await statsQuery;
      
      if (allFilteredCourses) {
        stats = {
          total: allFilteredCourses.length,
          draft: allFilteredCourses.filter(c => c.status === 'draft').length,
          published: allFilteredCourses.filter(c => c.status === 'published').length,
          archived: allFilteredCourses.filter(c => c.status === 'archived').length,
        };
      }
    }

    // Return paginated response with metadata
    return NextResponse.json({
      courses: courses || [],
      pagination: {
        page,
        perPage,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / perPage)
      },
      stats
    });

  } catch (error) {
    console.error('Error in GET courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or teacher
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      short_description,
      category,
      status = 'draft',
      difficulty = 'beginner',
      instructor_name,
      duration_hours,
      level,
      cover_image_url,
      is_public = false
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create course
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        title,
        description,
        short_description,
        category,
        status,
        difficulty,
        instructor_name: instructor_name || profile.full_name || user.email,
        duration_hours,
        level,
        cover_image_url,
        is_public,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      course,
      message: 'Course created successfully'
    });

  } catch (error) {
    console.error('Error in POST courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}