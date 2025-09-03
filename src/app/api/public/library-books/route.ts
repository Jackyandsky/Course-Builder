import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client - use service role key if available, otherwise use anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('No Supabase key found. Please set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseAdmin = supabaseKey ? createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '24');
    const offset = (page - 1) * pageSize;

    // Build query with count
    let countQuery = supabaseAdmin
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    let dataQuery = supabaseAdmin
      .from('books')
      .select('*')
      .eq('is_public', true);

    // Apply search filter
    if (search) {
      const searchFilter = `title.ilike.%${search}%,author.ilike.%${search}%,description.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    // Apply category filter if needed
    if (category && category !== 'All') {
      // You can add category filtering logic here if needed
    }

    // Get total count
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error counting books:', countError);
      return NextResponse.json(
        { error: 'Failed to count books', details: countError.message },
        { status: 500 }
      );
    }

    // Get paginated data
    const { data, error } = await dataQuery
      .order('title')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching books:', error);
      return NextResponse.json(
        { error: 'Failed to fetch books', details: error.message },
        { status: 500 }
      );
    }


    const transformedBooks = data?.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author || 'Unknown Author',
      description: book.description ? 
        (book.description.length > 200 ? book.description.substring(0, 200) + '...' : book.description) 
        : 'No description available',
      price: book.price || 19.99,
      currency: book.currency || 'CAD',
      discount_percentage: book.discount_percentage,
      sale_price: book.sale_price,
      is_free: book.is_free || false,
      imageUrl: book.cover_image_url || undefined,
      category: 'Virtual Library',
      type: 'library'
    })) || [];

    return NextResponse.json({
      books: transformedBooks,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
      pageSize
    });
  } catch (error) {
    console.error('Error in library-books API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}