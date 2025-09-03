import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookId = params.id;

    // First check if user has purchased this book
    const { data: purchase, error: purchaseError } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', bookId)
      .eq('item_type', 'book')
      .eq('is_active', true)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: 'You do not have access to this book' },
        { status: 403 }
      );
    }

    // Fetch the book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Combine book with purchase info
    const responseData = {
      ...book,
      purchase: {
        purchased_at: purchase.purchased_at || purchase.created_at,
        is_active: purchase.is_active,
        access_type: purchase.access_type || 'lifetime',
        purchase_price: purchase.purchase_price
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in book detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}