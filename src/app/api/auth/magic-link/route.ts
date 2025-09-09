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
    
    // Use the configured app URL if available, otherwise use request origin
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    // Remove trailing slash to prevent double slashes
    const appUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Build the email redirect URL that preserves the original redirect
    let emailRedirectTo = `${appUrl}/auth/callback`;
    if (redirectTo) {
      // Encode the redirect parameter to pass it through the magic link
      emailRedirectTo = `${appUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
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