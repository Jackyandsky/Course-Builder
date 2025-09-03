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
    const category_id = searchParams.get('category_id');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const offset = (page - 1) * perPage;

    console.log(`[AdminMethodsList] Loading page ${page} with ${perPage} items per page`);
    const startTime = Date.now();

    // Optimized query - minimal fields for list view
    let query = supabase
      .from('methods')
      .select(`
        id,
        name,
        description,
        duration_minutes,
        tags,
        created_at,
        updated_at,
        category:categories(id, name, color, icon)
      `)
      .order('updated_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('methods')
      .select('id', { count: 'exact' });

    // Apply pagination
    const { data: methods, error } = await query
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    const endTime = Date.now();
    console.log(`[AdminMethodsList] Loaded ${methods?.length || 0} methods in ${endTime - startTime}ms`);

    // Get stats efficiently
    const stats = {
      total: count || 0,
      with_duration: methods?.filter(m => m.duration_minutes).length || 0,
      with_tags: methods?.filter(m => m.tags && m.tags.length > 0).length || 0,
    };

    const totalPages = Math.ceil((count || 0) / perPage);

    return NextResponse.json({
      data: methods || [],
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
    console.error('Error in GET /api/methods/admin-list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}