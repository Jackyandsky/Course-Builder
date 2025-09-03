import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has premium subscription
    // For now, we'll check if they have a premium flag in user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();
    
    return NextResponse.json({ 
      isPremium: profile?.is_premium || false,
      subscriptionType: profile?.is_premium ? 'premium' : 'free',
      expiresAt: null // Can be extended later for subscription expiry
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      isPremium: false,
      subscriptionType: 'free',
      expiresAt: null
    }, { status: 500 });
  }
}