import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Fetch courses that should appear on homepage
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, short_description, description, thumbnail_url, public_slug, homepage_order, price, is_free')
      .eq('show_on_homepage', true)
      .eq('is_public', true)
      .order('homepage_order', { ascending: true })
      .limit(8);

    if (coursesError) throw coursesError;

    // Fetch books that should appear on homepage
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, author, description, cover_image_url, public_slug, homepage_order, price, is_free')
      .eq('show_on_homepage', true)
      .eq('is_public', true)
      .order('homepage_order', { ascending: true })
      .limit(8);

    if (booksError) throw booksError;

    // Fetch content that should appear on homepage
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('id, name, content, public_slug, homepage_order, featured, price, is_free')
      .eq('show_on_homepage', true)
      .eq('is_public', true)
      .order('homepage_order', { ascending: true })
      .limit(8);

    if (contentError) throw contentError;

    return NextResponse.json({
      courses: courses || [],
      books: books || [],
      content: content || []
    });
  } catch (error) {
    console.error('Error fetching homepage items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage items' },
      { status: 500 }
    );
  }
}