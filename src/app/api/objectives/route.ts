import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// GET all objectives with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const tags = searchParams.getAll('tags');
    
    let query = supabase
      .from('objectives')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching objectives:', error);
      return NextResponse.json({ error: 'Failed to fetch objectives' }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/objectives:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new objective
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category_id, tags } = body;

    const { data, error } = await supabase
      .from('objectives')
      .insert({
        title,
        description,
        category_id,
        tags,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating objective:', error);
      return NextResponse.json({ error: 'Failed to create objective' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/objectives:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}