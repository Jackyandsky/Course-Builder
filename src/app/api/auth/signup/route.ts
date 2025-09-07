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
    
    // Get the origin from the request
    const origin = request.nextUrl.origin;
    
    // Build the email redirect URL that preserves the original redirect
    let emailRedirectTo = origin;
    if (redirectTo) {
      // Encode the redirect parameter to pass it through the email verification
      emailRedirectTo = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
    } else {
      // Default redirect to login page after verification
      emailRedirectTo = `${origin}/auth/callback`;
    }
    
    // Ensure full_name is properly set for display in auth
    const processedMetadata = metadata || {};
    if (processedMetadata.first_name && processedMetadata.last_name && !processedMetadata.full_name) {
      processedMetadata.full_name = `${processedMetadata.first_name} ${processedMetadata.last_name}`.trim();
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: processedMetadata,
        emailRedirectTo: emailRedirectTo,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
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