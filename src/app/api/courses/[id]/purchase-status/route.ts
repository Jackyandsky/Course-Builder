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
      return NextResponse.json({ purchased: false });
    }

    const courseId = params.id;

    // Check in user_purchases table
    const { data: existingPurchase } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', 'course')
      .eq('item_id', courseId)
      .eq('status', 'active')
      .single();

    if (existingPurchase) {
      return NextResponse.json({ purchased: true });
    }

    // Also check in completed orders
    const { data: completedOrders } = await supabase
      .from('orders')
      .select(`
        id,
        order_items!inner (
          item_type,
          item_id
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('order_items.item_type', 'course')
      .eq('order_items.item_id', courseId);

    const purchased = completedOrders && completedOrders.length > 0;

    return NextResponse.json({ purchased });
  } catch (error) {
    console.error('Error checking purchase status:', error);
    return NextResponse.json({ purchased: false });
  }
}