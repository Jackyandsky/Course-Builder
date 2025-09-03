'use server';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');

    // Define store categories
    const storeCategories = ['Decoders', 'Complete Study Packages', 'Standardizers', 'LEX'];
    
    // Get category IDs first
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name')
      .in('name', categoryParam ? [categoryParam] : storeCategories);
    
    if (!categoriesData || categoriesData.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const categoryIds = categoriesData.map(cat => cat.id);
    
    // Get content from these categories
    const { data: contentData, error } = await supabase
      .from('content')
      .select(`
        id,
        title,
        description,
        author,
        category_id,
        price,
        cover_image_url,
        categories!inner(name)
      `)
      .in('category_id', categoryIds)
      .eq('is_public', true);

    if (error) {
      console.error('Error fetching content:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Transform the data
    const transformedProducts = contentData?.map(item => ({
      id: item.id,
      title: item.title || 'Untitled',
      author: item.author || 'Unknown Author',
      description: item.description || 'No description available',
      price: item.price || 0,
      imageUrl: item.cover_image_url,
      category: item.categories?.name || 'Uncategorized',
      type: 'content'
    })) || [];

    return NextResponse.json({ products: transformedProducts });

  } catch (error) {
    console.error('Error in store products API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}