import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 500; // Increased default limit
    const status = searchParams.get('status');
    const difficulty = searchParams.get('difficulty');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    
    // Build query with relationships for complete course data
    let query = supabase
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
        schedules(
          id,
          name,
          start_date,
          recurrence_type
        )
      `)
      .eq('is_public', true);
    
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
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,short_description.ilike.%${search}%`);
    }
    
    // Apply limit
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching public courses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process data to add book count and sort by it
    const processedData = (data || []).map(course => ({
      ...course,
      book_count: course.course_books?.length || 0
    }));

    // Sort by book count (descending) first, then by title (ascending) for courses with same book count
    processedData.sort((a, b) => {
      const bookDiff = b.book_count - a.book_count;
      if (bookDiff !== 0) return bookDiff;
      return a.title.localeCompare(b.title);
    });

    // Return with cache headers for better performance
    return NextResponse.json(processedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error in public courses API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}