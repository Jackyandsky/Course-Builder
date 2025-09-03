import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // First, get all unique book_ids that have essays
    const { data: essayBooks, error: essayError } = await supabase
      .from('essay_content')
      .select('book_id')
      .eq('content_type', 'essay')
      .not('book_id', 'is', null);
    
    if (essayError) {
      console.error('Error fetching essay book IDs:', essayError);
      return NextResponse.json({ error: 'Failed to fetch essay books' }, { status: 500 });
    }
    
    // Get unique book IDs
    const uniqueBookIds = [...new Set(essayBooks?.map(e => e.book_id) || [])];
    
    if (uniqueBookIds.length === 0) {
      // No essays with book_ids, return empty array
      return NextResponse.json([]);
    }
    
    // Fetch the actual book details for these IDs
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, author, isbn, publication_year, description, cover_image_url')
      .in('id', uniqueBookIds)
      .order('title', { ascending: true });
    
    if (booksError) {
      console.error('Error fetching books:', booksError);
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
    }
    
    // Add essay count for each book
    const booksWithCount = await Promise.all(
      (books || []).map(async (book) => {
        const { count, error } = await supabase
          .from('essay_content')
          .select('*', { count: 'exact', head: true })
          .eq('content_type', 'essay')
          .eq('book_id', book.id);
        
        return {
          ...book,
          essay_count: count || 0
        };
      })
    );
    
    return NextResponse.json(booksWithCount);
  } catch (error) {
    console.error('Error in GET /api/books/with-essays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}