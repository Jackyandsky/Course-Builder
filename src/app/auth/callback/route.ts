import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect');
  
  // Use the configured app URL or the request origin
  // This ensures we always redirect to the correct domain
  const appUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '') // Remove trailing slash
    : requestUrl.origin;
  
  console.log('Auth callback - App URL:', appUrl);
  console.log('Auth callback - Request origin:', requestUrl.origin);
  
  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    try {
      // Exchange the code for a session
      const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/login', appUrl));
      }
      
      // Create user profile if it doesn't exist (fallback for missing trigger)
      if (sessionData.user) {
        const rawMetadata = sessionData.user.raw_user_meta_data || sessionData.user.user_metadata || {};
        // Extract the nested data if it exists
        const userData = rawMetadata.data || rawMetadata;
        
        console.log('Callback - User metadata:', JSON.stringify(rawMetadata, null, 2));
        console.log('Callback - Extracted user data:', JSON.stringify(userData, null, 2));
        
        try {
          // Use API route following development principles
          const response = await fetch(`${appUrl}/api/auth/create-profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: sessionData.user.id,
              metadata: {
                data: userData,  // Send the actual user data in the correct structure
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
          return NextResponse.redirect(new URL(decodedRedirect, appUrl));
        } else if (decodedRedirect.startsWith(appUrl)) {
          return NextResponse.redirect(decodedRedirect);
        } else {
          // Invalid redirect, go to default
          console.warn('Invalid redirect URL:', decodedRedirect);
          return NextResponse.redirect(new URL('/account', appUrl));
        }
      }
      
      // No redirect specified, go to account page
      return NextResponse.redirect(new URL('/account', appUrl));
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/login', appUrl));
    }
  }
  
  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/login', appUrl));
}