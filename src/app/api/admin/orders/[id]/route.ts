import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated
    // Admin route access is already controlled by middleware
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          item_type,
          item_id,
          item_title,
          quantity,
          price,
          total
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch user profile
    if (order) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, phone, created_at')
        .eq('id', order.user_id)
        .single();

      order.user = profile || { 
        id: order.user_id, 
        email: 'Unknown', 
        full_name: 'Unknown User' 
      };

      // Note: order_status_logs table doesn't exist in the schema
      // We'll set it as empty for now
      order.order_status_logs = [];
    }

    return NextResponse.json(order);

  } catch (error) {
    console.error('Error in order details API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Process refund
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated
    // Admin route access is already controlled by middleware
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, reason } = body;

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Process refund (integrate with payment provider)
    // This is a placeholder - you would integrate with Stripe/PayPal etc.
    const refundData = {
      order_id: params.id,
      amount: amount || order.total_amount,
      reason,
      processed_by: user.id,
      processed_at: new Date().toISOString()
    };

    // Note: refunds table doesn't exist in current schema
    // For now, we'll just update the order status

    // Update order status
    await supabase
      .from('orders')
      .update({ 
        status: 'refunded',
        refund_amount: amount || order.total_amount,
        refund_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    // Note: order_status_logs table doesn't exist in current schema

    return NextResponse.json({ success: true, refund: refundData });

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}