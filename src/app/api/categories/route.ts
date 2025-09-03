import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parent_id');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const skipCounts = searchParams.get('skipCounts') === 'true'; // New param to skip expensive counts
    
    let query = supabase
      .from('categories')
      .select('*')
      .order('name');

    // Filter by parent_id
    if (parentId === 'null' || parentId === null) {
      query = query.is('parent_id', null);
    } else if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    // Filter by type
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Skip expensive counts if requested (for faster sidebar loading)
    if (skipCounts) {
      const simplifiedData = (data || []).map(cat => ({
        ...cat,
        itemCount: 0,
        childCount: 0,
        level: parentId === 'null' || parentId === null ? 0 : 1
      }));
      
      return NextResponse.json(simplifiedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // For root categories, count children and items
    if (parentId === 'null' || parentId === null) {
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (cat) => {
          // Count direct children
          const { count: childCount } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', cat.id);

          // Count items based on category type
          const tables: { [key: string]: string } = {
            course: 'courses',
            book: 'books',
            vocabulary: 'vocabulary_groups',
            objective: 'objectives',
            method: 'methods',
            task: 'tasks',
            content: 'content'
          };

          let itemCount = 0;
          if (tables[cat.type]) {
            // For categories with subcategories, count items in both parent and children
            const { data: subCategories } = await supabase
              .from('categories')
              .select('id')
              .eq('parent_id', cat.id);
            
            const categoryIds = [cat.id, ...(subCategories?.map(sub => sub.id) || [])];
            
            const { count } = await supabase
              .from(tables[cat.type])
              .select('*', { count: 'exact', head: true })
              .in('category_id', categoryIds);
            itemCount = count || 0;
          }

          return { 
            ...cat, 
            itemCount,
            childCount: childCount || 0,
            level: 0
          };
        })
      );

      return NextResponse.json(categoriesWithCount, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    } else {
      // For subcategories, fetch their children and count items
      const categoriesWithChildren = await Promise.all(
        (data || []).map(async (cat) => {
          const { data: children } = await supabase
            .from('categories')
            .select('*')
            .eq('parent_id', cat.id)
            .order('name');

          // Count items for this category
          const tables: { [key: string]: string } = {
            course: 'courses',
            book: 'books',
            vocabulary: 'vocabulary_groups',
            objective: 'objectives',
            method: 'methods',
            task: 'tasks',
            content: 'content'
          };

          let itemCount = 0;
          if (tables[cat.type]) {
            const { count } = await supabase
              .from(tables[cat.type])
              .select('*', { count: 'exact', head: true })
              .eq('category_id', cat.id);
            itemCount = count || 0;
          }

          return {
            ...cat,
            children: children || [],
            level: 1,
            itemCount
          };
        })
      );

      return NextResponse.json(categoriesWithChildren, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }
  } catch (error: any) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    const { name, description, type, parent_id, color, icon } = body;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        description,
        type,
        parent_id,
        color,
        icon,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    const { id, name, description, type, parent_id, color, icon } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categories')
      .update({
        name,
        description,
        type,
        parent_id,
        color,
        icon,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID required' }, { status: 400 });
    }

    // Check if category has children
    const { count } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}