import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { userId, metadata } = await request.json();
    
    if (!userId || !metadata) {
      return NextResponse.json({ error: 'Missing userId or metadata' }, { status: 400 });
    }

    // Create route handler client for regular operations
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Create admin client for auth operations
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

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('id', userId)
      .single();

    console.log('Creating user profile for user:', userId);
    console.log('Received metadata:', JSON.stringify(metadata, null, 2));
    
    // Handle nested metadata structure - the actual data might be in metadata.data
    const actualData = metadata.data || metadata;
    console.log('Actual data to use:', JSON.stringify(actualData, null, 2));
    
    // Ensure full_name is properly constructed from the correct data
    let fullName = actualData.full_name;
    if (!fullName && (actualData.first_name || actualData.last_name)) {
      fullName = `${actualData.first_name || ''} ${actualData.last_name || ''}`.trim();
    }
    
    // DON'T use email as fallback - if we don't have first/last names, leave full_name empty
    // This prevents "user" showing up when email is user@example.com
    if (!fullName) {
      console.log('No full_name could be constructed from first_name/last_name - leaving empty');
    }
    
    console.log('Final constructed full_name:', fullName);
    
    // Update auth user display name using admin client
    if (fullName) {
      try {
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              ...actualData,
              display_name: fullName,
              name: fullName,
              full_name: fullName
            }
          }
        );
        
        if (updateError) {
          console.log('Note: Could not update auth display name:', updateError.message);
        } else {
          console.log('Successfully updated auth display name for user:', userId);
        }
      } catch (err) {
        console.log('Error updating auth user metadata:', err);
      }
    }
    
    // Create or update user profile
    const profileData = {
      email: metadata.email,
      first_name: actualData.first_name || null,  // Ensure null instead of undefined
      last_name: actualData.last_name || null,    // Ensure null instead of undefined
      full_name: fullName || null,                // Ensure null instead of undefined
      role: actualData.role || 'student',
      needs_verification: actualData.role && !['student', 'parent'].includes(actualData.role),
      verified_at: actualData.role && ['student', 'parent'].includes(actualData.role) ? new Date().toISOString() : null,
      metadata: actualData
    };
    
    console.log('Profile data being saved:', JSON.stringify(profileData, null, 2));

    let profileError;
    if (existingProfile) {
      // Update existing profile
      console.log('Updating existing user profile');
      const { error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', userId);
      profileError = error;
    } else {
      // Insert new profile
      console.log('Creating new user profile');
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          ...profileData
        });
      profileError = error;
    }
    
    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    console.log('User profile created successfully');
    return NextResponse.json({ message: 'Profile created successfully' });

  } catch (error) {
    console.error('Error in create-profile API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}