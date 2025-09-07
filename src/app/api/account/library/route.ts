import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user purchases from the user_purchases table - exclude courses and packages
    // Courses should only appear in /account/courses, packages determine membership level
    const { data: purchases, error: purchasesError } = await supabase
      .from('user_purchases')
      .select(`
        *,
        order:orders(
          id,
          order_number,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true) // Only show active purchases
      .neq('item_type', 'course') // Exclude courses - they belong in /account/courses
      .neq('item_type', 'package') // Exclude packages - they determine membership level only
      .order('purchased_at', { ascending: false });

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
    }

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({
        purchases: [],
        total: 0
      });
    }

    // Group purchases by type to fetch in bulk - only books and content now
    const bookIds = purchases.filter(p => p.item_type === 'book').map(p => p.item_id);
    const contentIds = purchases.filter(p => p.item_type === 'content').map(p => p.item_id);

    // Fetch all items in bulk for better performance
    let books = [];
    let contents = [];

    if (bookIds.length > 0) {
      const { data: booksData } = await supabase
        .from('books')
        .select('id, title, description, author, cover_image_url, file_url, content_type, price, currency')
        .in('id', bookIds);
      books = booksData || [];
    }

    if (contentIds.length > 0) {
      const { data: contentsData } = await supabase
        .from('content')
        .select(`
          id, 
          name, 
          content, 
          category_id,
          categories!content_category_id_fkey (
            id,
            name,
            description
          )
        `)
        .in('id', contentIds);
      // Map name to title for consistency
      contents = (contentsData || []).map(item => ({
        ...item,
        title: item.name,
        description: item.categories?.description || null
      }));
    }

    // Create a map for quick lookup - only books and content
    const itemsMap = {
      book: new Map(books.map(item => [item.id, item])),
      content: new Map(contents.map(item => [item.id, item]))
    };

    // Combine purchases with their item details
    const libraryItems = purchases.map(purchase => {
      let itemData = null;
      
      if (purchase.item_type && itemsMap[purchase.item_type]) {
        itemData = itemsMap[purchase.item_type].get(purchase.item_id);
      }

      // Use the item_title from purchase if item data is not found
      if (!itemData && purchase.item_title) {
        itemData = {
          id: purchase.item_id,
          title: purchase.item_title,
          description: null,
          price: purchase.purchase_price
        };
      }

      return {
        ...purchase,
        item: itemData,
        // Ensure we use the correct date field
        purchase_date: purchase.purchased_at || purchase.purchase_date || purchase.created_at
      };
    });

    // Sort by purchase date (newest first)
    libraryItems.sort((a, b) => {
      const dateA = new Date(a.purchase_date || 0).getTime();
      const dateB = new Date(b.purchase_date || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      purchases: libraryItems,
      total: libraryItems.length
    });

  } catch (error) {
    console.error('Error in library API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}