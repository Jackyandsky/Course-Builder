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

    const contentId = params.id;

    // First check if user has purchased this content
    const { data: purchase, error: purchaseError } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', contentId)
      .eq('item_type', 'content')
      .eq('is_active', true)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: 'You do not have access to this content' },
        { status: 403 }
      );
    }

    // Fetch the content details
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select(`
        *,
        categories!content_category_id_fkey (
          id,
          name,
          description
        )
      `)
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Combine content with purchase info
    const responseData = {
      ...content,
      purchase: {
        purchased_at: purchase.purchased_at || purchase.created_at,
        is_active: purchase.is_active,
        access_type: purchase.access_type || 'lifetime'
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in content detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}