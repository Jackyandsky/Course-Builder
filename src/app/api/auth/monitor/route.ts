import { NextRequest, NextResponse } from 'next/server';
import { serverSessionCache, refreshRateLimiter } from '@/lib/auth/session-cache';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Get cache statistics
    const cacheStats = serverSessionCache.getStats();
    
    // Get rate limit status for current user
    const rateLimitStatus = refreshRateLimiter.getStatus(user.id);
    
    return NextResponse.json({
      cache: {
        ...cacheStats,
        info: 'Session cache stores authenticated sessions for 5 minutes to reduce token refresh calls',
      },
      rateLimit: {
        currentUser: rateLimitStatus,
        info: 'Rate limit: 3 refresh attempts per minute per user',
      },
      recommendations: [
        'If seeing 429 errors, the rate limiting is working to prevent Supabase API overload',
        'Cache entries automatically expire after 5 minutes',
        'Middleware now skips auth checks for static assets and API routes',
      ],
    });
  } catch (error) {
    console.error('Monitor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}