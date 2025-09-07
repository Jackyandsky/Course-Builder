import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect');
  
  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    try {
      // Exchange the code for a session
      const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/login', requestUrl.origin));
      }
      
      // Create user profile if it doesn't exist (fallback for missing trigger)
      if (sessionData.user) {
        const metadata = sessionData.user.raw_user_meta_data || sessionData.user.user_metadata || {};
        
        try {
          // Use API route following development principles
          const response = await fetch(`${requestUrl.origin}/api/auth/create-profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: sessionData.user.id,
              metadata: {
                ...metadata,
                email: sessionData.user.email
              }
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error creating user profile via API:', errorData);
          } else {
            console.log('User profile creation handled successfully via API');
          }
        } catch (error) {
          console.error('Error calling create-profile API:', error);
        }
      }
      
      // Successfully authenticated - check if we have a redirect URL
      if (redirect) {
        // Decode and validate the redirect URL
        const decodedRedirect = decodeURIComponent(redirect);
        
        // Security check: ensure redirect is to our own domain
        if (decodedRedirect.startsWith('/')) {
          return NextResponse.redirect(new URL(decodedRedirect, requestUrl.origin));
        } else if (decodedRedirect.startsWith(requestUrl.origin)) {
          return NextResponse.redirect(decodedRedirect);
        } else {
          // Invalid redirect, go to default
          console.warn('Invalid redirect URL:', decodedRedirect);
          return NextResponse.redirect(new URL('/account', requestUrl.origin));
        }
      }
      
      // No redirect specified, go to account page
      return NextResponse.redirect(new URL('/account', requestUrl.origin));
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/login', requestUrl.origin));
    }
  }
  
  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}