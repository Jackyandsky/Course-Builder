import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { email, password, metadata, redirectTo } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Use the configured app URL if available, otherwise use request origin
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    // Remove trailing slash to prevent double slashes
    const appUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // ALWAYS redirect to /auth/callback for email verification
    // The callback will handle the final redirect to /account or custom location
    let emailRedirectTo = `${appUrl}/auth/callback`;
    if (redirectTo) {
      // Encode the redirect parameter to pass it through the email verification
      emailRedirectTo = `${appUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
    }
    
    // Ensure full_name is properly set for display in auth
    const processedMetadata = metadata || {};
    if (processedMetadata.first_name && processedMetadata.last_name && !processedMetadata.full_name) {
      processedMetadata.full_name = `${processedMetadata.first_name} ${processedMetadata.last_name}`.trim();
    }

    console.log('Signup attempt for:', email);
    console.log('Email redirect URL:', emailRedirectTo);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: processedMetadata,
        emailRedirectTo: emailRedirectTo,
      },
    });
    
    console.log('Signup response:', { 
      success: !error, 
      userId: data?.user?.id,
      sessionExists: !!data?.session,
      emailConfirmed: data?.user?.email_confirmed_at 
    });

    if (error) {
      // Provide more specific error messages
      let errorMessage = error.message;
      let errorCode = error.code || '';
      
      // Map Supabase error codes to user-friendly messages
      if (errorCode === 'email_address_invalid' || errorMessage.includes('email_address_invalid')) {
        errorMessage = 'Please enter a valid email address';
      } else if (errorCode === 'user_already_exists' || errorMessage.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please try signing in instead.';
      } else if (errorCode === 'weak_password' || errorMessage.includes('least 6 characters')) {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (errorMessage.includes('Invalid login')) {
        errorMessage = 'Invalid email or password';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account before signing in';
      }
      
      return NextResponse.json(
        { 
          error: {
            message: errorMessage,
            code: errorCode
          }
        },
        { status: 400 }
      );
    }

    // Update auth metadata immediately after signup for better display name handling
    if (data.user && processedMetadata.full_name) {
      try {
        // Create admin client for updating auth metadata
        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        const { error: updateError } = await adminClient.auth.admin.updateUserById(
          data.user.id,
          {
            user_metadata: {
              ...processedMetadata,
              display_name: processedMetadata.full_name,
              name: processedMetadata.full_name,
              full_name: processedMetadata.full_name
            },
            // Also update the raw_user_meta_data for immediate display
            raw_user_meta_data: {
              ...processedMetadata,
              display_name: processedMetadata.full_name,
              name: processedMetadata.full_name,
              full_name: processedMetadata.full_name
            }
          }
        );
        
        if (updateError) {
          console.log('Note: Could not update auth display name during signup:', updateError.message);
        } else {
          console.log('Successfully updated auth display name during signup');
        }
      } catch (err) {
        console.log('Error updating auth user metadata during signup:', err);
      }
    }

    // Create user profile if user is immediately confirmed (no email verification required)
    if (data.user && data.session) {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();
      
      if (!existingProfile) {
        console.log('Creating user profile for immediately confirmed user:', data.user.id);
        
        const userMetadata = data.user.raw_user_meta_data || data.user.user_metadata || processedMetadata || {};
        
        // Ensure full_name is properly constructed
        let fullName = userMetadata.full_name;
        if (!fullName && (userMetadata.first_name || userMetadata.last_name)) {
          fullName = `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim();
        }
        
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: userMetadata.first_name,
            last_name: userMetadata.last_name,
            full_name: fullName,
            role: userMetadata.role || 'student',
            needs_verification: userMetadata.role && !['student', 'parent'].includes(userMetadata.role),
            verified_at: userMetadata.role && ['student', 'parent'].includes(userMetadata.role) ? new Date().toISOString() : null,
            metadata: userMetadata
          });
        
        if (profileError) {
          console.error('Error creating user profile during signup:', profileError);
        } else {
          console.log('User profile created successfully during signup');
        }
      }
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}