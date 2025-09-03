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
    const is_active = searchParams.get('is_active');
    const course_ids = searchParams.get('course_ids');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const offset = (page - 1) * perPage;

    console.log(`[AdminSchedulesList] Loading page ${page} with ${perPage} items per page`);
    if (course_ids) {
      console.log(`[AdminSchedulesList] Filtering by courses: ${course_ids}`);
    }
    const startTime = Date.now();

    // Optimized query - minimal fields for list view
    let query = supabase
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
        max_students,
        created_at,
        updated_at,
        course_id,
        course:courses(id, title),
        lessons(count)
      `)
      .order('updated_at', { ascending: false }); // Show most recently updated first

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }
    
    if (is_active !== null && is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }
    
    // Filter by course IDs if provided
    if (course_ids) {
      const courseIdArray = course_ids.split(',').filter(id => id.trim());
      if (courseIdArray.length > 0) {
        query = query.in('course_id', courseIdArray);
      }
    }

    // Get total count for pagination with same filters
    let countQuery = supabase
      .from('schedules')
      .select('id', { count: 'exact', head: true });
    
    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }
    
    if (is_active !== null && is_active !== undefined) {
      countQuery = countQuery.eq('is_active', is_active === 'true');
    }
    
    if (course_ids) {
      const courseIdArray = course_ids.split(',').filter(id => id.trim());
      if (courseIdArray.length > 0) {
        countQuery = countQuery.in('course_id', courseIdArray);
      }
    }
    
    const { count } = await countQuery;

    // Apply pagination
    const { data: schedules, error } = await query
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    const endTime = Date.now();
    console.log(`[AdminSchedulesList] Loaded ${schedules?.length || 0} schedules in ${endTime - startTime}ms`);

    // Get stats efficiently
    const stats = {
      total: count || 0,
      active: schedules?.filter(s => s.is_active).length || 0,
      inactive: schedules?.filter(s => !s.is_active).length || 0,
    };

    const totalPages = Math.ceil((count || 0) / perPage);

    return NextResponse.json({
      data: schedules || [],
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
    console.error('Error in GET /api/schedules/admin-list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}