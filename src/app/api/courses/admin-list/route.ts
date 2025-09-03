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
    const search = searchParams.get('search');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '12');
    const offset = (page - 1) * perPage;

    console.log(`[AdminCoursesList] Loading page ${page} with ${perPage} items per page`);
    const startTime = Date.now();

    // Optimized query - minimal fields for list view
    let query = supabase
      .from('courses')
      .select(`
        id,
        title,
        short_description,
        status,
        difficulty,
        duration_hours,
        thumbnail_url,
        tags,
        created_at,
        updated_at,
        category:categories(id, name, color, icon),
        course_books(id)
      `)
      .order('updated_at', { ascending: false }); // Show most recently updated first

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,short_description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('courses')
      .select('id', { count: 'exact' });

    // Apply pagination
    const { data: courses, error } = await query
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    const endTime = Date.now();
    console.log(`[AdminCoursesList] Loaded ${courses?.length || 0} courses in ${endTime - startTime}ms`);

    // Get stats efficiently in parallel
    const statsPromise = supabase
      .from('courses')
      .select('status')
      .then(({ data }) => {
        const stats = {
          total: data?.length || 0,
          draft: data?.filter(c => c.status === 'draft').length || 0,
          published: data?.filter(c => c.status === 'published').length || 0,
          archived: data?.filter(c => c.status === 'archived').length || 0,
        };
        return stats;
      });

    const stats = await statsPromise;

    const totalPages = Math.ceil((count || 0) / perPage);

    return NextResponse.json({
      data: courses || [],
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
    console.error('Error in GET /api/courses/admin-list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}