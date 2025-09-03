import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// GET course books
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Fetch course books with book details
    const { data, error } = await supabase
      .from('course_books')
      .select(`
        *,
        book:books (
          id,
          title,
          author,
          isbn,
          publisher,
          publication_year,
          cover_image_url,
          content_type,
          file_url,
          category_id,
          category:categories (
            id,
            name,
            color,
            icon
          )
        )
      `)
      .eq('course_id', params.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching course books:', error);
      return NextResponse.json({ error: 'Failed to fetch course books' }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/courses/[id]/books:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add book to course
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookId, isRequired, notes, position } = body;

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // Add book to course
    const { data, error } = await supabase
      .from('course_books')
      .insert({
        course_id: params.id,
        book_id: bookId,
        is_required: isRequired ?? false,
        notes: notes,
        position: position ?? 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding book to course:', error);
      return NextResponse.json({ error: 'Failed to add book to course' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/courses/[id]/books:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove book from course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // Remove book from course
    const { error } = await supabase
      .from('course_books')
      .delete()
      .match({ course_id: params.id, book_id: bookId });

    if (error) {
      console.error('Error removing book from course:', error);
      return NextResponse.json({ error: 'Failed to remove book from course' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/courses/[id]/books:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update book in course
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookId, isRequired, notes, position } = body;

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // Update book in course
    const { data, error } = await supabase
      .from('course_books')
      .update({
        is_required: isRequired,
        notes: notes,
        position: position
      })
      .match({ course_id: params.id, book_id: bookId })
      .select()
      .single();

    if (error) {
      console.error('Error updating book in course:', error);
      return NextResponse.json({ error: 'Failed to update book in course' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/courses/[id]/books:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}