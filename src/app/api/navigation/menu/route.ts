import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

// Cache the menu data for 5 minutes
let menuCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (menuCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(menuCache);
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Run all queries in parallel for better performance
    const [
      coursesResult,
      booksResult,
      contentResult,
      bookCategoriesResult,
      courseCategoriesResult,
      contentCategoriesResult
    ] = await Promise.all([
      // Fetch courses that should appear in menu
      supabase
        .from('courses')
        .select('id, title, public_slug, menu_order')
        .eq('show_on_menu', true)
        .eq('is_public', true)
        .order('menu_order', { ascending: true })
        .limit(240),
      
      // Fetch books that should appear in menu
      supabase
        .from('books')
        .select('id, title, public_slug, menu_order')
        .eq('show_on_menu', true)
        .eq('is_public', true)
        .order('menu_order', { ascending: true })
        .limit(8),
      
      // Fetch content that should appear in menu
      supabase
        .from('content')
        .select('id, name, public_slug, menu_order, category_id')
        .eq('show_on_menu', true)
        .order('menu_order', { ascending: true })
        .limit(32),
      
      // Get book categories that have items
      supabase
        .from('categories')
        .select('id, name')
        .eq('type', 'book')
        .order('name', { ascending: true })
        .limit(4),
      
      // Get ALL course categories
      supabase
        .from('categories')
        .select('id, name')
        .eq('type', 'course')
        .order('name', { ascending: true })
        .limit(7),
      
      // Get content categories
      supabase
        .from('categories')
        .select('id, name')
        .eq('type', 'content')
        .order('name', { ascending: true })
        .limit(4)
    ]);

    // Check for errors
    if (coursesResult.error) throw coursesResult.error;
    if (booksResult.error) throw booksResult.error;
    if (contentResult.error) throw contentResult.error;
    if (bookCategoriesResult.error) throw bookCategoriesResult.error;
    if (courseCategoriesResult.error) throw courseCategoriesResult.error;
    if (contentCategoriesResult.error) throw contentCategoriesResult.error;

    // Group content by category if needed
    const contentByCategory = contentResult.data?.reduce((acc: any, item) => {
      const categoryId = item.category_id || 'uncategorized';
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(item);
      return acc;
    }, {}) || {};

    // Prepare response data
    const responseData = {
      courses: coursesResult.data || [],
      books: booksResult.data || [],
      content: contentResult.data || [],
      contentByCategory,
      categories: {
        courses: courseCategoriesResult.data || [],
        books: bookCategoriesResult.data || [],
        content: contentCategoriesResult.data || []
      }
    };

    // Update cache
    menuCache = responseData;
    cacheTimestamp = now;

    // Set cache headers for CDN/browser caching
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error) {
    console.error('Error fetching navigation menu:', error);
    
    // Return cached data if available, even if stale
    if (menuCache) {
      return NextResponse.json(menuCache, {
        headers: {
          'X-Cache-Status': 'stale',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch navigation menu' },
      { status: 500 }
    );
  }
}

// Optional: Add a POST endpoint to clear the cache when menu items are updated
export async function POST(request: NextRequest) {
  try {
    // Check for admin auth if needed
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Clear the cache
    menuCache = null;
    cacheTimestamp = 0;
    
    return NextResponse.json({ message: 'Menu cache cleared successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear menu cache' },
      { status: 500 }
    );
  }
}