import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getStripe } from '@/lib/config/payment-config';
import type { Database } from '@/types/database';

// Simple in-memory cache to prevent duplicate Stripe API calls
const sessionCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { session_id, order_id } = body;

    if (!session_id || !order_id) {
      return NextResponse.json({ error: 'Missing session_id or order_id' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `${session_id}_${order_id}`;
    const cached = sessionCache.get(cacheKey);
    const now = Date.now();
    
    let session;
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // Use cached session data
      session = cached.data;
    } else {
      // Initialize Stripe and retrieve the checkout session
      const stripe = getStripe();
      session = await stripe.checkout.sessions.retrieve(session_id);
      
      // Cache the session data
      sessionCache.set(cacheKey, { data: session, timestamp: now });
      
      // Clean up old cache entries
      for (const [key, value] of sessionCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          sessionCache.delete(key);
        }
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 404 });
    }

    // Verify the session belongs to this user and order
    if (session.metadata?.order_id !== order_id || session.metadata?.user_id !== user.id) {
      return NextResponse.json({ error: 'Session verification failed' }, { status: 403 });
    }

    // Get order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          item_type,
          item_id,
          item_title,
          quantity,
          price,
          total
        )
      `)
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status based on payment status
    let orderStatus = order.status;
    let paymentStatus = order.payment_status;

    if (session.payment_status === 'paid') {
      orderStatus = 'completed';
      paymentStatus = 'completed';
      
      // Create user purchases for successful payments
      const purchaseItems = order.order_items.map((item: any) => ({
        user_id: user.id,
        item_type: item.item_type,
        item_id: item.item_id,
        item_title: item.item_title,
        purchase_price: item.price,
        order_id: order.id,
        purchased_at: new Date().toISOString()
      }));

      const { error: purchaseError } = await supabase
        .from('user_purchases')
        .upsert(purchaseItems, {
          onConflict: 'user_id,item_type,item_id',
          ignoreDuplicates: true
        });

      if (purchaseError) {
        console.error('Error creating user purchases:', purchaseError);
        // Don't fail the entire request for this
      }

      // Clear user's cart after successful purchase
      const { error: cartError } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', user.id);

      if (cartError) {
        console.error('Error clearing cart:', cartError);
        // Don't fail the entire request for this
      }

      // Create course enrollments for purchased courses
      const courseItems = order.order_items.filter((item: any) => item.item_type === 'course');
      if (courseItems.length > 0) {
        const enrollmentItems = courseItems.map((item: any) => ({
          user_id: user.id,
          course_id: item.item_id,
          enrolled_by: user.id, // Self-enrolled via purchase
          enrolled_at: new Date().toISOString(),
          is_active: true,
          status: 'active',
          started_at: new Date().toISOString(),
          notes: `Auto-enrolled via order ${order.order_number}`,
          metadata: {
            order_id: order.id,
            purchase_method: 'stripe_checkout'
          }
        }));

        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .upsert(enrollmentItems, {
            onConflict: 'user_id,course_id',
            ignoreDuplicates: true
          });

        if (enrollmentError) {
          console.error('Error creating course enrollments:', enrollmentError);
          // Don't fail the entire request for this
        }
      }
    } else if (session.payment_status === 'unpaid') {
      orderStatus = 'cancelled';
      paymentStatus = 'failed';
    }

    // Update order status if it changed
    if (orderStatus !== order.status || paymentStatus !== order.payment_status) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: orderStatus,
          payment_status: paymentStatus,
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
      }

      // Update the order object for response
      order.status = orderStatus;
      order.payment_status = paymentStatus;
    }

    return NextResponse.json({
      session: {
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_email
      },
      order: order
    });

  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}