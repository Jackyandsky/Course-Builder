'use server';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or teacher
    const { data: currentUserProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!currentUserProfile || (currentUserProfile.role !== 'admin' && currentUserProfile.role !== 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch the requested user profile
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If first_name and last_name are null but full_name exists, parse them
    if (userProfile && userProfile.full_name && (!userProfile.first_name || !userProfile.last_name)) {
      const nameParts = userProfile.full_name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        userProfile.first_name = userProfile.first_name || nameParts[0];
        userProfile.last_name = userProfile.last_name || nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        userProfile.first_name = userProfile.first_name || nameParts[0];
        userProfile.last_name = userProfile.last_name || '';
      }
    }

    return NextResponse.json({ userProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or teacher
    const { data: currentUserProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!currentUserProfile || (currentUserProfile.role !== 'admin' && currentUserProfile.role !== 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rawUpdates = await request.json();

    // Filter out fields that shouldn't be updated
    const allowedFields = [
      'first_name', 'last_name', 'full_name', 'email', 'phone', 'grade_level', 
      'date_of_birth', 'parent_id', 'parent_email', 'role', 'avatar_url', 
      'metadata', 'social_media', 'available_for_booking', 'verified_at', 
      'needs_verification', 'verified_by'
    ];

    const updates: any = {};
    for (const [key, value] of Object.entries(rawUpdates)) {
      if (allowedFields.includes(key)) {
        updates[key] = value;
      }
    }

    // Update full_name based on first_name and last_name
    if (updates.first_name || updates.last_name) {
      updates.full_name = `${updates.first_name || ''} ${updates.last_name || ''}`.trim();
    }

    console.log('Filtered update payload:', JSON.stringify(updates, null, 2));

    // Use upsert approach to handle the user profile
    // This will update if exists, otherwise we'll get a proper error
    const { data: updatedRows, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', params.id)
      .select();

    if (error) {
      console.error('Database error during update:', error, 'User ID:', params.id);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Check if any rows were actually updated
    if (!updatedRows || updatedRows.length === 0) {
      console.error('User profile not found during update:', params.id);
      console.log('Update payload:', JSON.stringify(updates, null, 2));
      
      // Try to fetch the user to see if it exists
      const { data: checkUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('id', params.id)
        .single();
      
      if (checkError) {
        console.error('User definitely does not exist:', checkError);
        return NextResponse.json({ 
          error: 'User profile not found',
          details: 'This user may have been deleted or never existed'
        }, { status: 404 });
      }
      
      console.error('User exists but update failed - possible constraint issue');
      return NextResponse.json({ 
        error: 'Update failed - user exists but changes could not be applied',
        details: 'This may be due to database constraints or validation errors'
      }, { status: 400 });
    }

    console.log('Successfully updated user profile:', params.id);
    return NextResponse.json({ userProfile: updatedRows[0] });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}