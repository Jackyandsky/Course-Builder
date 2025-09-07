import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { email, metadata, redirectTo } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the origin from the request
    const origin = request.nextUrl.origin;
    
    // Build the email redirect URL that preserves the original redirect
    let emailRedirectTo = origin;
    if (redirectTo) {
      // Encode the redirect parameter to pass it through the magic link
      emailRedirectTo = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
    } else {
      // Default redirect to account page after magic link login
      emailRedirectTo = `${origin}/auth/callback`;
    }
    
    // Send magic link
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        data: metadata || {},
        shouldCreateUser: true, // Create user if doesn't exist
      },
    });

    if (error) {
      console.error('Magic link error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
      email,
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}