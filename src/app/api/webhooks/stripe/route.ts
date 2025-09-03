import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/config';
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
  const supabase = createClient(process.env.SUPABASE_SERVICE_ROLE_KEY!);

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
          item_title: item.item_title,
          purchase_price: item.price,
          order_id: orderId,
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
        }

        // Clear user's cart after successful purchase
        const { error: cartError } = await supabase
          .from('shopping_cart')
          .delete()
          .eq('user_id', userId);

        if (cartError) {
          console.error('Error clearing cart:', cartError);
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