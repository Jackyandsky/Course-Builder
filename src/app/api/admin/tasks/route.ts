import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or teacher
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const priority = searchParams.get('priority') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    // Load tasks directly from database instead of using service layer to avoid HTTP calls
    let query = supabase
      .from('tasks')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Get total count for pagination (with same filters)
    let countQuery = supabase
      .from('tasks')
      .select('id', { count: 'exact' });

    if (categoryId) {
      countQuery = countQuery.eq('category_id', categoryId);
    }
    if (priority) {
      countQuery = countQuery.eq('priority', priority);
    }
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error('Tasks count error:', countError);
      return NextResponse.json({ error: 'Failed to count tasks: ' + countError.message }, { status: 500 });
    }

    // Apply pagination
    const { data: tasksData, error: tasksError } = await query
      .range(offset, offset + pageSize - 1);
    if (tasksError) {
      console.error('Tasks fetch error:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks: ' + tasksError.message }, { status: 500 });
    }
    
    // Load categories directly from database
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'task')
      .order('name');

    if (categoriesError) {
      console.error('Categories fetch error:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories: ' + categoriesError.message }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    return NextResponse.json({
      success: true,
      data: {
        tasks: tasksData || [],
        categories: categoriesData
      },
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages,
      }
    });

  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}