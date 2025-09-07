import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';
import { serverSessionCache, refreshRateLimiter } from '@/lib/auth/session-cache';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // First, try to get user without refreshing to check cache
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check cache first
      const cachedSession = serverSessionCache.get(user.id);
      if (cachedSession) {
        console.log('[Session API] Using cached session for user:', user.email);
        
        // Fetch user profile from cache or database
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id, email, role, full_name, verified_at')
          .eq('id', user.id)
          .single();
        
        const response = NextResponse.json({
          user,
          session: {
            access_token: cachedSession.access_token,
            expires_at: cachedSession.expires_at,
            expires_in: cachedSession.expires_in,
          },
          userProfile,
          timestamp: Date.now(),
          cached: true,
        });
        
        response.headers.set('Cache-Control', 'private, max-age=60');
        return response;
      }
      
      // Check rate limit before attempting refresh
      if (!refreshRateLimiter.canRefresh(user.id)) {
        console.warn('[Session API] Rate limited for user:', user.email);
        // Return current user data without session refresh
        return NextResponse.json({
          user,
          session: null,
          userProfile: null,
          rateLimited: true,
        }, { status: 429 });
      }
    }
    
    // Try to get session, but handle invalid refresh tokens gracefully
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      // Handle invalid refresh token specifically
      if (error.message === 'Invalid Refresh Token: Refresh Token Not Found' || 
          error.message.includes('Invalid Refresh Token') ||
          error.message.includes('Refresh Token Not Found')) {
        
        // Clear the invalid session from cache if user exists
        if (user) {
          serverSessionCache.delete(user.id);
          refreshRateLimiter.reset(user.id);
        }
        
        // Return empty session instead of error to prevent retry loops
        console.log('[Session API] Invalid refresh token cleared, returning empty session');
        return NextResponse.json(
          { 
            user: null, 
            session: null, 
            userProfile: null,
            refreshTokenInvalid: true 
          },
          { status: 200 } // Return 200 to prevent client retry
        );
      }
      
      // Log other auth errors
      console.error('Auth error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { user: null, session: null, userProfile: null },
        { status: 200 }
      );
    }
    
    // Cache the new session
    serverSessionCache.set(session.user.id, session);

    // Fetch user profile with minimal fields to reduce payload
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id, email, role, full_name, verified_at')
      .eq('id', session.user.id)
      .single();

    // Add cache headers to reduce repeated requests
    const response = NextResponse.json({
      user: session.user,
      session: {
        access_token: session.access_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
      },
      userProfile,
      // Add timestamp for client-side cache validation
      timestamp: Date.now(),
      fromCache: false,
    });

    // Cache for 60 seconds to reduce repeated checks (increased from 30)
    response.headers.set('Cache-Control', 'private, max-age=60');
    
    return response;
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}