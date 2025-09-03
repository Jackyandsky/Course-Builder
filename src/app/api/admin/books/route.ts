import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Simple in-memory cache for stats (5 minute TTL)
let statsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const searchParams = request.nextUrl.searchParams;
    
    // Shorter timeout for better UX
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      // Get operation type
      const operation = searchParams.get('operation');
      
      if (operation === 'stats') {
        // Check cache first
        if (statsCache && (Date.now() - statsCache.timestamp) < CACHE_TTL) {
          clearTimeout(timeoutId);
          return NextResponse.json(statsCache.data);
        }
        
        // Optimized stats query using aggregation
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_book_stats_optimized');
        
        if (statsError) {
          // Fallback to original method
          const { count: totalCount } = await supabase
            .from('books')
            .select('*', { count: 'exact', head: true });
          
          const { data } = await supabase
            .from('books')
            .select('content_type');
          
          const stats = {
            total: totalCount || 0,
            text: data?.filter(b => b.content_type === 'text').length || 0,
            video: data?.filter(b => b.content_type === 'video').length || 0,
            audio: data?.filter(b => b.content_type === 'audio').length || 0,
            pdf: data?.filter(b => b.content_type === 'pdf').length || 0,
            image: data?.filter(b => b.content_type === 'image').length || 0,
            interactive: data?.filter(b => b.content_type === 'interactive').length || 0,
          };
          
          // Cache the result
          statsCache = { data: stats, timestamp: Date.now() };
          clearTimeout(timeoutId);
          return NextResponse.json(stats);
        }
        
        // Cache and return optimized result
        statsCache = { data: statsData, timestamp: Date.now() };
        clearTimeout(timeoutId);
        return NextResponse.json(statsData);
      }
      
      if (operation === 'authors') {
        // Get unique authors
        const { data } = await supabase
          .from('books')
          .select('author')
          .not('author', 'is', null);
        
        const authorsSet = new Set(data?.map(book => book.author).filter(Boolean));
        const authors = Array.from(authorsSet).sort();
        
        clearTimeout(timeoutId);
        return NextResponse.json(authors);
      }
      
      if (operation === 'languages') {
        // Get unique languages
        const { data } = await supabase
          .from('books')
          .select('language');
        
        const languagesSet = new Set(data?.map(book => book.language).filter(Boolean));
        const languages = Array.from(languagesSet).sort();
        
        clearTimeout(timeoutId);
        return NextResponse.json(languages);
      }
      
      // Default: Get books with filters
      const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '24'), 100); // Cap at 100
      const page = parseInt(searchParams.get('page') || '1');
      const offset = (page - 1) * pageSize;
      
      // Check if we need categories (only for detailed views)
      const includeCategory = searchParams.get('includeCategory') !== 'false';
      
      // Build optimized query - only join categories if needed
      let countQuery = supabase
        .from('books')
        .select('*', { count: 'exact', head: true });
      
      let selectFields = `
        id, title, author, isbn, publisher, publication_year,
        description, content_type, file_url, cover_image_url,
        total_pages, language, is_public, price, currency,
        discount_percentage, sale_price, is_free, created_at, updated_at
      `;
      
      if (includeCategory) {
        selectFields += `, category:categories(id, name, color, icon)`;
      }
      
      let dataQuery = supabase
        .from('books')
        .select(selectFields)
        .order('title', { ascending: true })
        .range(offset, offset + pageSize - 1);
      
      // Apply filters
      const search = searchParams.get('search');
      const author = searchParams.get('author');
      const categoryId = searchParams.get('categoryId');
      const contentType = searchParams.get('contentType');
      const language = searchParams.get('language');
      const publicationYear = searchParams.get('publicationYear');
      const isPublic = searchParams.get('isPublic');
      
      // Missing field filters
      const missingDescription = searchParams.get('missingDescription') === 'true';
      const missingAuthor = searchParams.get('missingAuthor') === 'true';
      const missingCover = searchParams.get('missingCover') === 'true';
      const missingPublisher = searchParams.get('missingPublisher') === 'true';
      const missingYear = searchParams.get('missingYear') === 'true';
      const missingISBN = searchParams.get('missingISBN') === 'true';
      const missingLanguage = searchParams.get('missingLanguage') === 'true';
      
      // Apply filters to both queries - optimized for performance
      const applyFilters = (query: any) => {
        // Most selective filters first for better performance
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }
        if (contentType) {
          query = query.eq('content_type', contentType);
        }
        if (language) {
          query = query.eq('language', language);
        }
        if (publicationYear) {
          query = query.eq('publication_year', parseInt(publicationYear));
        }
        if (isPublic !== null) {
          query = query.eq('is_public', isPublic === 'true');
        }
        if (author) {
          // Use exact match first, then partial for better index usage
          query = query.ilike('author', `%${author}%`);
        }
        
        // Text search last (most expensive)
        if (search) {
          query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,description.ilike.%${search}%`);
        }
        
        // Missing field filters - grouped for efficiency
        const missingFilters = [];
        if (missingDescription) missingFilters.push('description.is.null,description.eq.""');
        if (missingAuthor) missingFilters.push('author.is.null,author.eq."",author.eq.nan');
        if (missingCover) missingFilters.push('cover_image_url.is.null,cover_image_url.eq.""');
        if (missingPublisher) missingFilters.push('publisher.is.null,publisher.eq.""');
        if (missingYear) missingFilters.push('publication_year.is.null');
        if (missingISBN) missingFilters.push('isbn.is.null,isbn.eq.""');
        if (missingLanguage) missingFilters.push('language.is.null,language.eq.""');
        
        // Apply missing filters if any
        if (missingFilters.length > 0) {
          query = query.or(missingFilters.join(','));
        }
        
        return query;
      };
      
      countQuery = applyFilters(countQuery);
      dataQuery = applyFilters(dataQuery);
      
      const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([
        countQuery,
        dataQuery
      ]);
      
      clearTimeout(timeoutId);
      
      if (countError) throw countError;
      if (dataError) throw dataError;
      
      return NextResponse.json({
        books: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
        pageSize
      });
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Error in GET /api/admin/books:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('books')
      .insert({
        ...body,
        user_id: body.user_id || 'shared',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/books:', error);
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('books')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/books:', error);
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/books:', error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}