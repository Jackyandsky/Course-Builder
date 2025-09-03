import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getStripeAsync } from '@/lib/config/payment-config';
import type { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = await getStripeAsync();

    // Validate items and get product details
    const validatedItems = [];
    for (const item of items) {
      const { item_type, item_id, quantity, price, currency } = item;
      
      if (!item_type || !item_id || !quantity || quantity < 1) {
        return NextResponse.json({ error: 'Invalid item data' }, { status: 400 });
      }

      // Verify item exists and get details
      let productData = null;
      let tableName = '';
      
      switch (item_type) {
        case 'course':
          tableName = 'courses';
          break;
        case 'book':
          tableName = 'books';
          break;
        case 'content':
          tableName = 'content';
          break;
        default:
          return NextResponse.json({ error: `Invalid item_type: ${item_type}` }, { status: 400 });
      }

      // Different tables have different column names
      let selectColumns = '';
      if (tableName === 'content') {
        selectColumns = 'id, name, price, currency';
      } else if (tableName === 'courses') {
        selectColumns = 'id, title, price, currency, is_free';
      } else if (tableName === 'books') {
        selectColumns = 'id, title, price, currency, is_free';
      }

      const { data: product, error } = await supabase
        .from(tableName)
        .select(selectColumns)
        .eq('id', item_id)
        .single();

      if (error || !product) {
        return NextResponse.json({ error: `Product not found: ${item_id}` }, { status: 404 });
      }

      // Get the product name/title
      const productName = product.title || product.name || 'Unnamed Product';
      
      // Security check: verify price matches (convert to number for comparison)
      const productPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      const itemPrice = typeof price === 'string' ? parseFloat(price) : price;
      
      if (Math.abs(productPrice - itemPrice) > 0.01) { // Allow for small floating point differences
        return NextResponse.json({ 
          error: `Price mismatch for ${productName}` 
        }, { status: 400 });
      }

      // Skip free items
      if ((product.is_free !== undefined && product.is_free) || productPrice === 0) {
        continue;
      }

      validatedItems.push({
        ...item,
        title: productName,
        verified_price: productPrice,
        verified_currency: product.currency || 'CAD'
      });
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: 'No paid items in cart' }, { status: 400 });
    }

    // Create order record
    const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const subtotal = validatedItems.reduce((sum, item) => sum + (item.verified_price * item.quantity), 0);
    const taxRate = 0.13; // 13% HST - this should come from settings
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = subtotal + taxAmount;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'stripe',
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        currency: 'CAD'
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const orderItems = validatedItems.map(item => ({
      order_id: order.id,
      item_type: item.item_type,
      item_id: item.item_id,
      item_title: item.title,
      quantity: item.quantity,
      price: item.verified_price,
      total: item.verified_price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // Create Stripe checkout session
    const lineItems = validatedItems.map(item => ({
      price_data: {
        currency: item.verified_currency.toLowerCase(),
        product_data: {
          name: item.title,
          description: `${item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)} - ${item.title}`,
          metadata: {
            item_type: item.item_type,
            item_id: item.item_id,
            order_id: order.id
          }
        },
        unit_amount: Math.round(item.verified_price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add tax line item
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Tax (HST)',
            description: 'Harmonized Sales Tax'
          },
          unit_amount: Math.round(taxAmount * 100)
        },
        quantity: 1
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/cart`,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        order_number: orderNumber
      },
      payment_method_types: [
        'card',           // Credit/Debit cards - automatically includes Apple Pay & Google Pay
        'klarna'          // Klarna (Buy now, pay later)
      ],
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          user_id: user.id,
          order_number: orderNumber
        }
      },
      automatic_tax: {
        enabled: false // We're handling tax manually
      }
    });

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({ 
      url: session.url,
      session_id: session.id,
      order_id: order.id
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    
    // Return more specific error message for debugging
    const errorMessage = error?.message || 'Failed to create checkout session';
    const errorDetails = {
      error: errorMessage,
      type: error?.type || 'unknown',
      code: error?.code || 'unknown'
    };
    
    // Check if it's a Stripe-specific error
    if (error?.type === 'StripeInvalidRequestError' || error?.statusCode === 400) {
      return NextResponse.json(errorDetails, { status: 400 });
    }
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}