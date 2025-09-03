import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get session without forcing refresh - Supabase will handle token refresh automatically
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      // Don't log every auth error to reduce noise
      if (error.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
        console.error('Auth error:', error.message);
      }
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