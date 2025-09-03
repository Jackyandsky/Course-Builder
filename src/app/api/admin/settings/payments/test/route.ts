import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { mode, key } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Test Stripe connection
    try {
      const stripe = new Stripe(key, {
        apiVersion: '2023-10-16',
      });

      // Try to retrieve account details
      const account = await stripe.accounts.retrieve();

      return NextResponse.json({
        success: true,
        account: {
          id: account.id,
          business_profile: account.business_profile,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          default_currency: account.default_currency,
        },
        mode,
      });
    } catch (stripeError: any) {
      return NextResponse.json(
        { 
          error: 'Invalid Stripe API key',
          details: stripeError.message 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error testing Stripe connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}