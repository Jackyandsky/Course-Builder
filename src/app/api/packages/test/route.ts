import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Test 1: Direct query without any filters
    const { data: allPackages, error: allError } = await supabase
      .from('packages')
      .select('*');
    
    // Test 2: Active packages only
    const { data: activePackages, error: activeError } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true);
    
    // Test 3: Check user authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    return NextResponse.json({
      allPackages: {
        count: allPackages?.length || 0,
        data: allPackages,
        error: allError
      },
      activePackages: {
        count: activePackages?.length || 0,
        data: activePackages,
        error: activeError
      },
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role
      } : null
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to test packages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}