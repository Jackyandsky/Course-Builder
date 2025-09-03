import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Fetch courses that should appear in menu (limit to 240 for 4 columns x 60 items)
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, public_slug, menu_order')
      .eq('show_on_menu', true)
      .eq('is_public', true)
      .order('menu_order', { ascending: true })
      .limit(240);

    if (coursesError) throw coursesError;

    // Fetch books that should appear in menu (limited to 8 for dropdown)
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, public_slug, menu_order')
      .eq('show_on_menu', true)
      .eq('is_public', true)
      .order('menu_order', { ascending: true })
      .limit(8);

    if (booksError) throw booksError;

    // Fetch content that should appear in menu (limited to 32 for dropdown - 8 per category)
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('id, name, public_slug, menu_order, category_id')
      .eq('show_on_menu', true)
      .order('menu_order', { ascending: true })
      .limit(32);

    if (contentError) throw contentError;

    // Get categories that have actual items - using RPC or direct queries
    // For book categories - get categories that have books
    const { data: bookStats } = await supabase
      .from('books')
      .select('category_id')
      .not('category_id', 'is', null);
    
    const bookCategoryIds = [...new Set(bookStats?.map(b => b.category_id) || [])];
    
    const { data: bookCategories, error: bookCategoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'book')
      .in('id', bookCategoryIds.length > 0 ? bookCategoryIds : ['00000000-0000-0000-0000-000000000000'])
      .order('name', { ascending: true })
      .limit(4);

    if (bookCategoriesError) throw bookCategoriesError;

    // For course categories - get ALL course categories (not just those with courses)
    const { data: courseCategories, error: courseCategoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'course')
      .order('name', { ascending: true })
      .limit(7);

    if (courseCategoriesError) throw courseCategoriesError;

    // For content categories - get categories that have content
    const { data: contentStats } = await supabase
      .from('content')
      .select('category_id')
      .not('category_id', 'is', null);
    
    const contentCategoryIds = [...new Set(contentStats?.map(c => c.category_id) || [])];
    
    const { data: contentCategories, error: contentCategoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'content')
      .in('id', contentCategoryIds.length > 0 ? contentCategoryIds : ['00000000-0000-0000-0000-000000000000'])
      .order('name', { ascending: true })
      .limit(4);

    if (contentCategoriesError) throw contentCategoriesError;

    // Group content by category if needed
    const contentByCategory = content?.reduce((acc: any, item) => {
      const categoryId = item.category_id || 'uncategorized';
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(item);
      return acc;
    }, {});

    return NextResponse.json({
      courses: courses || [],
      books: books || [],
      content: content || [],
      contentByCategory: contentByCategory || {},
      categories: {
        courses: courseCategories || [],
        books: bookCategories || [],
        content: contentCategories || []
      }
    });
  } catch (error) {
    console.error('Error fetching navigation menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch navigation menu' },
      { status: 500 }
    );
  }
}