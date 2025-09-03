import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Check if the current user is authenticated
 * Returns 401 with retry flag if not authenticated
 */
export async function requireAuth() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required', retry: true },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store', // Don't cache auth errors
          }
        }
      ),
      session: null,
      user: null,
      supabase
    };
  }
  
  return {
    error: null,
    session,
    user: session.user,
    supabase
  };
}

/**
 * Check if the current user has admin or teacher role
 * Returns 401 if not authenticated, 403 if not authorized
 */
export async function requireAdminAuth() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required', retry: true },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store',
          }
        }
      ),
      session: null,
      user: null,
      userProfile: null,
      supabase
    };
  }
  
  // Check if user is admin or teacher
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (userProfile?.role !== 'admin' && userProfile?.role !== 'teacher') {
    return {
      error: NextResponse.json(
        { error: 'Admin or teacher access required' },
        { status: 403 }
      ),
      session,
      user: session.user,
      userProfile,
      supabase
    };
  }
  
  return {
    error: null,
    session,
    user: session.user,
    userProfile,
    supabase
  };
}

/**
 * Check if the current user is authenticated but don't block
 * Useful for endpoints that have different behavior for authenticated vs non-authenticated users
 */
export async function getOptionalAuth() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      session: null,
      user: null,
      userProfile: null,
      supabase
    };
  }
  
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  return {
    session,
    user: session.user,
    userProfile,
    supabase
  };
}