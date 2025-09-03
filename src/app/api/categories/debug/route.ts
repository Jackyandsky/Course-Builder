import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get all content categories with their hierarchy
    const { data: contentCategories, error: contentError } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'content')
      .order('parent_id', { nullsFirst: true })
      .order('name');

    if (contentError) {
      return NextResponse.json({ error: contentError.message }, { status: 500 });
    }

    // Build hierarchy
    const rootCategories = contentCategories?.filter(c => !c.parent_id) || [];
    const categoriesWithChildren = rootCategories.map(root => {
      const children = contentCategories?.filter(c => c.parent_id === root.id) || [];
      const childrenWithSubchildren = children.map(child => {
        const subchildren = contentCategories?.filter(c => c.parent_id === child.id) || [];
        return { ...child, children: subchildren };
      });
      return { ...root, children: childrenWithSubchildren };
    });

    // Get counts for content items
    const { count: totalContentItems } = await supabase
      .from('content')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      totalCategories: contentCategories?.length || 0,
      rootCategories: rootCategories.length,
      hierarchy: categoriesWithChildren,
      totalContentItems,
      allCategories: contentCategories
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}