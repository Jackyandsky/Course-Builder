import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const searchParams = request.nextUrl.searchParams;
    
    // Add timeout to prevent indefinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      // Get operation type
      const operation = searchParams.get('operation');
      
      if (operation === 'count') {
        // Get content count with filters
        const categoryId = searchParams.get('category_id');
        const categoryName = searchParams.get('category_name');
        const search = searchParams.get('search');
        
        let query = supabase
          .from('content')
          .select('*', { count: 'exact', head: true });
        
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        } else if (categoryName) {
          // First find the category by name
          const { data: categories } = await supabase
            .from('categories')
            .select('id')
            .eq('name', categoryName)
            .eq('type', 'content');
          
          if (categories && categories.length > 0) {
            query = query.eq('category_id', categories[0].id);
          }
        }
        
        if (search) {
          query = query.or(`name.ilike.%${search}%,content.ilike.%${search}%`);
        }
        
        const { count, error } = await query;
        
        clearTimeout(timeoutId);
        
        if (error) throw error;
        return NextResponse.json({ count: count || 0 });
      }
      
      if (operation === 'categories') {
        // Get proprietary product categories
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('type', 'content')
          .order('display_order', { ascending: true });
        
        clearTimeout(timeoutId);
        
        if (error) throw error;
        return NextResponse.json(data || []);
      }
      
      if (operation === 'stats') {
        // Get content statistics by category
        const { data: categories, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('type', 'content');
        
        if (catError) throw catError;
        
        const stats = await Promise.all(
          (categories || []).map(async (category) => {
            const { data, error } = await supabase
              .from('content')
              .select('id, is_public, status')
              .eq('category_id', category.id);
            
            if (error) throw error;
            
            return {
              category: category.name,
              category_id: category.id,
              total: data?.length || 0,
              public: data?.filter(c => c.is_public).length || 0,
              private: data?.filter(c => !c.is_public).length || 0,
              active: data?.filter(c => c.status === 'active').length || 0,
              draft: data?.filter(c => c.status === 'draft').length || 0,
              archived: data?.filter(c => c.status === 'archived').length || 0,
            };
          })
        );
        
        clearTimeout(timeoutId);
        
        return NextResponse.json(stats);
      }
      
      if (operation === 'check_duplicate') {
        // Check if content name already exists
        const name = searchParams.get('name');
        const excludeId = searchParams.get('exclude_id');
        
        if (!name) {
          return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        
        let query = supabase
          .from('content')
          .select('id')
          .eq('name', name)
          .limit(1);
        
        if (excludeId) {
          query = query.neq('id', excludeId);
        }
        
        const { data, error } = await query;
        
        clearTimeout(timeoutId);
        
        if (error) throw error;
        return NextResponse.json({ exists: (data && data.length > 0) });
      }
      
      // Default: Get content with filters
      let query = supabase
        .from('content')
        .select(`
          *,
          category:categories!category_id(
            id,
            name,
            color,
            icon
          ),
          content_books(
            book_id,
            is_primary,
            book:books(
              id,
              title
            )
          )
        `);
      
      // Apply filters
      const search = searchParams.get('search');
      const categoryId = searchParams.get('category_id');
      const categoryName = searchParams.get('category_name');
      const parentCategoryId = searchParams.get('parent_category_id');
      const bookId = searchParams.get('book_id');
      const sortField = searchParams.get('sortField') || 'name';
      const sortOrder = searchParams.get('sortOrder') || 'asc';
      const limit = parseInt(searchParams.get('limit') || '36');
      const offset = parseInt(searchParams.get('offset') || '0');
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,content.ilike.%${search}%`);
      }
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      if (categoryName) {
        // First find the category by name
        const { data: categories } = await supabase
          .from('categories')
          .select('id')
          .eq('name', categoryName)
          .eq('type', 'content');
        
        if (categories && categories.length > 0) {
          query = query.eq('category_id', categories[0].id);
        }
      }
      
      if (parentCategoryId) {
        query = query.eq('parent_category_id', parentCategoryId);
      }
      
      if (bookId) {
        // Get content linked to a specific book
        const { data: contentBooks } = await supabase
          .from('content_books')
          .select('content_id')
          .eq('book_id', bookId);
        
        if (contentBooks && contentBooks.length > 0) {
          const contentIds = contentBooks.map(cb => cb.content_id);
          query = query.in('id', contentIds);
        }
      }
      
      // Apply sorting
      if (sortField === 'name') {
        query = query.order('name', { ascending: sortOrder === 'asc' });
      } else if (sortField === 'created_at') {
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      } else if (sortField === 'updated_at') {
        query = query.order('updated_at', { ascending: sortOrder === 'asc' });
      } else if (sortField === 'status') {
        query = query.order('status', { ascending: sortOrder === 'asc' });
      }
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      
      const { data, error } = await query;
      
      clearTimeout(timeoutId);
      
      if (error) throw error;
      
      return NextResponse.json(data || []);
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Error in GET /api/admin/content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('content')
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
    console.error('Error in POST /api/admin/content:', error);
    return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('content')
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
    console.error('Error in PUT /api/admin/content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/content:', error);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}