import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function PATCH(
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

    const body = await request.json();
    const { quantity } = body;

    // Validate input
    if (quantity === undefined || quantity < 0) {
      return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 });
    }

    const { id } = params;

    // If quantity is 0, delete the item
    if (quantity === 0) {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting cart item:', error);
        return NextResponse.json({ error: 'Failed to remove item from cart' }, { status: 500 });
      }

      return NextResponse.json({ success: true, deleted: true });
    }

    // Update item quantity
    const { data, error } = await supabase
      .from('shopping_cart')
      .update({ quantity })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating cart item:', error);
      return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in cart PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const { id } = params;

    // Delete cart item
    const { error } = await supabase
      .from('shopping_cart')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting cart item:', error);
      return NextResponse.json({ error: 'Failed to remove item from cart' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cart DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}