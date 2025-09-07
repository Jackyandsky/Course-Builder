import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/config/payment-config';
import Stripe from 'stripe';

const stripe = getStripe();

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Create Supabase admin client for webhook operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.order_id;
        const userId = session.metadata?.user_id;
        
        if (!orderId || !userId) {
          console.error('Missing order_id or user_id in session metadata');
          break;
        }

        // Update order status
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            payment_status: 'completed',
            stripe_payment_intent_id: session.payment_intent as string,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (orderError) {
          console.error('Error updating order:', orderError);
          break;
        }

        // Get order items to create user purchases
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        if (itemsError) {
          console.error('Error fetching order items:', itemsError);
          break;
        }

        // Create user purchases
        const purchaseItems = orderItems.map(item => ({
          user_id: userId,
          item_type: item.item_type,
          item_id: item.item_id,
          order_id: orderId,
          purchase_date: new Date().toISOString(),
          access_type: 'lifetime',
          is_active: true
        }));

        const { error: purchaseError } = await supabase
          .from('user_purchases')
          .upsert(purchaseItems, {
            onConflict: 'user_id,item_type,item_id',
            ignoreDuplicates: true
          });

        if (purchaseError) {
          console.error('Error creating user purchases:', purchaseError);
        }

        // Clear user's cart after successful purchase
        const { error: cartError } = await supabase
          .from('shopping_cart')
          .delete()
          .eq('user_id', userId);

        if (cartError) {
          console.error('Error clearing cart:', cartError);
        }

        // Create course enrollments for purchased courses
        const courseItems = orderItems.filter(item => item.item_type === 'course');
        if (courseItems.length > 0) {
          const enrollmentItems = courseItems.map(item => ({
            user_id: userId,
            course_id: item.item_id,
            enrolled_by: userId, // Self-enrolled via purchase
            enrolled_at: new Date().toISOString(),
            is_active: true,
            status: 'active',
            started_at: new Date().toISOString(),
            notes: `Auto-enrolled via webhook for order ${orderId}`,
            metadata: {
              order_id: orderId,
              purchase_method: 'stripe_webhook'
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
          }
        }


        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.order_id;
        
        if (orderId) {
          // Update order status to cancelled
          const { error } = await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              payment_status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

          if (error) {
            console.error('Error updating expired order:', error);
          }

          // Get the order to find user_id
          const { data: order } = await supabase
            .from('orders')
            .select('user_id, order_number')
            .eq('id', orderId)
            .single();

          // Deactivate any enrollments created from this expired order
          if (order) {
            const { error: enrollmentError } = await supabase
              .from('enrollments')
              .update({ 
                is_active: false,
                status: 'cancelled',
                notes: `Access revoked - Order ${order.order_number} expired`
              })
              .eq('user_id', order.user_id)
              .contains('metadata', { order_id: orderId });

            if (enrollmentError) {
              console.error('Error deactivating enrollments for expired order:', enrollmentError);
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Find order by payment intent ID
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (orderError || !order) {
          console.error('Order not found for failed payment:', paymentIntent.id);
          break;
        }

        // Update order status
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'failed',
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateError) {
          console.error('Error updating failed order:', updateError);
        }

        // Get full order details for enrollment deactivation
        const { data: fullOrder } = await supabase
          .from('orders')
          .select('user_id, order_number')
          .eq('id', order.id)
          .single();

        // Deactivate any enrollments created from this failed order
        if (fullOrder) {
          const { error: enrollmentError } = await supabase
            .from('enrollments')
            .update({ 
              is_active: false,
              status: 'cancelled',
              notes: `Access revoked - Order ${fullOrder.order_number} payment failed`
            })
            .eq('user_id', fullOrder.user_id)
            .contains('metadata', { order_id: order.id });

          if (enrollmentError) {
            console.error('Error deactivating enrollments for failed order:', enrollmentError);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // This is usually handled by checkout.session.completed
        // But we can add additional logic here if needed
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        // Handle subscription payment failures if you have subscriptions
        break;
      }

      default:

    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}