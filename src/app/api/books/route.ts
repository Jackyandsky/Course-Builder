import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    
    // Build query
    let query = supabase
      .from('books')
      .select('id, title, author, isbn, publication_year, description, cover_image_url')
      .order('title', { ascending: true })
      .limit(limit);
    
    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching books:', error);
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/books:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint to create a new book
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.author) {
      return NextResponse.json({ error: 'Title and author are required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('books')
      .insert({
        title: body.title,
        author: body.author,
        isbn: body.isbn,
        publication_year: body.publication_year,
        description: body.description,
        cover_image_url: body.cover_image_url,
        user_id: user.id,
        metadata: body.metadata || {}
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating book:', error);
      return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/books:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}