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

    const updates = await request.json();

    // Update full_name based on first_name and last_name
    if (updates.first_name || updates.last_name) {
      updates.full_name = `${updates.first_name || ''} ${updates.last_name || ''}`.trim();
    }

    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ userProfile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}