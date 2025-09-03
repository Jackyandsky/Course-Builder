import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const currentProductId = searchParams.get('productId');
    const type = searchParams.get('type') as 'library' | 'store';
    const category = searchParams.get('category');

    if (!currentProductId || !type) {
      return NextResponse.json(
        { error: 'Product ID and type are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });
    let relatedProducts = [];

    if (type === 'library') {
      // For library, get books from the same category
      const { data: currentBook } = await supabase
        .from('books')
        .select('category_id')
        .eq('id', currentProductId)
        .single();

      if (currentBook && currentBook.category_id) {
        const { data } = await supabase
          .from('books')
          .select(`
            *,
            category:categories!category_id(
              id,
              name,
              type
            )
          `)
          .eq('category_id', currentBook.category_id)
          .neq('id', currentProductId)
          .eq('is_public', true)
          .limit(4);

        if (data) {
          relatedProducts = data.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author || 'Unknown Author',
            description: book.description?.substring(0, 200) + '...' || '',
            price: book.metadata?.price || 29.99,
            imageUrl: book.cover_image_url,
            category: book.category?.name === 'Virtual' ? 'Virtual Library' : book.category?.name || 'Virtual Library',
            type: 'library'
          }));
        }
      }
    } else {
      // For store, get products from the same category
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category)
        .single();

      if (categoryData) {
        const { data } = await supabase
          .from('content')
          .select(`
            *,
            category:categories!category_id(
              id,
              name,
              type
            )
          `)
          .eq('category_id', categoryData.id)
          .neq('id', currentProductId)
          .limit(4);

        if (data) {
          relatedProducts = data.map(product => ({
            id: product.id,
            title: product.name,
            author: product.metadata?.author || 'IGPS',
            description: product.content?.substring(0, 200) + '...' || '',
            price: product.metadata?.price || 29.99,
            imageUrl: product.metadata?.image_url,
            category: product.category?.name || 'Uncategorized',
            type: 'store'
          }));
        }
      }
    }

    return NextResponse.json(relatedProducts);
  } catch (error) {
    console.error('Error fetching related products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related products' },
      { status: 500 }
    );
  }
}