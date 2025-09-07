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
    const { amount, reason, action } = body;
    
    // Determine if this is a refund or cancellation
    const isRefund = action === 'refund' || (!action && (amount || reason));
    const actionType = isRefund ? 'refund' : 'cancel';

    // Validate input
    if (!reason || reason.trim() === '') {
      const errorMsg = isRefund ? 'Refund reason is required' : 'Cancellation reason is required';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    console.log(`Processing ${actionType} for order ${params.id}: amount=${amount}, reason=${reason}`);

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Process refund/cancellation (integrate with payment provider)
    // This is a placeholder - you would integrate with Stripe/PayPal etc.
    const actionData = {
      order_id: params.id,
      amount: isRefund ? (amount || order.total_amount) : 0,
      reason,
      processed_by: user.id,
      processed_at: new Date().toISOString(),
      action_type: actionType
    };

    // Note: refunds table doesn't exist in current schema
    // For now, we'll just update the order status

    // Update order status (only update existing columns)
    const newStatus = isRefund ? 'refunded' : 'cancelled';
    const notesPrefix = isRefund ? 'REFUND' : 'CANCELLED';
    const notesSuffix = isRefund ? ` - Amount: $${amount || order.total_amount}` : '';
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        notes: `${notesPrefix}: ${reason}${notesSuffix}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    // Remove/deactivate enrollments created from this order
    const enrollmentNotes = `Access revoked - Order ${order.order_number} ${actionType}ed: ${reason}`;
    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .update({ 
        is_active: false,
        status: 'cancelled',
        notes: enrollmentNotes
      })
      .eq('user_id', order.user_id)
      .contains('metadata', { order_id: params.id });

    if (enrollmentError) {
      console.error(`Error deactivating enrollments for ${actionType}:`, enrollmentError);
      // Don't fail the action, but log the error
    } else {
      console.log(`Deactivated enrollments for ${actionType}ed order ${params.id}`);
    }

    console.log(`Successfully processed ${actionType} for order ${params.id}`);

    // Note: order_status_logs table doesn't exist in current schema

    return NextResponse.json({ success: true, action: actionData });

  } catch (error) {
    console.error('Error processing order action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}