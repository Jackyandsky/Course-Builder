import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { id } = params;
    
    // Add timeout to prevent indefinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          category:categories!category_id(
            id,
            name,
            color,
            icon,
            parent_id,
            description
          ),
          parent_category:categories!parent_category_id(
            id,
            name,
            color,
            icon,
            description
          ),
          book:books(
            id,
            title,
            author,
            content_type,
            description,
            publication_year,
            publisher,
            total_pages,
            category:categories(id, name, color, icon)
          ),
          content_books(
            id,
            book_id,
            is_primary,
            notes,
            position,
            book:books(
              id,
              title,
              author,
              content_type,
              description,
              publication_year,
              publisher,
              total_pages,
              category:categories(id, name, color, icon)
            )
          )
        `)
        .eq('id', id)
        .single();
      
      clearTimeout(timeoutId);
      
      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }
        throw error;
      }
      
      return NextResponse.json(data);
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Error in GET /api/admin/content/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}