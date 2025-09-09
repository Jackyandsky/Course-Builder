import { NextRequest, NextResponse } from 'next/server';
import { getMiddlewareSupabaseClient, supabase } from '@/lib/supabase/middleware-helper';
import { withLoggingSingle } from '@/lib/logger/api-route-wrapper';

export const GET = withLoggingSingle(async (request: NextRequest) => {
  try {
    // Test singleton behavior
    const client1 = getMiddlewareSupabaseClient();
    const client2 = getMiddlewareSupabaseClient();
    const client3 = supabase;
    
    // On the server, these will be different instances (expected behavior)
    // On the client, they should be the same instance
    const isSameInstance12 = client1 === client2;
    const isSameInstance13 = client1 === client3;
    const isSameInstance23 = client2 === client3;
    
    // Test auth functionality
    const { data: session1 } = await client1.auth.getSession();
    const { data: session2 } = await client2.auth.getSession();
    
    // Test database query
    const { count: userCount } = await client1
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      environment: typeof window === 'undefined' ? 'server' : 'client',
      singleton: {
        isSameInstance12,
        isSameInstance13,
        isSameInstance23,
        note: 'On server-side, instances will be different (expected). On client-side, they should be the same.'
      },
      auth: {
        hasSession1: !!session1.session,
        hasSession2: !!session2.session,
        sessionsMatch: session1.session?.user?.id === session2.session?.user?.id
      },
      database: {
        userCount: userCount || 0
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});