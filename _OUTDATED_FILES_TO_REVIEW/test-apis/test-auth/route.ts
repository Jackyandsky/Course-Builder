import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No user logged in' 
      });
    }
    
    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      return NextResponse.json({ 
        authenticated: true,
        user_id: user.id,
        email: user.email,
        profile: null,
        profile_error: profileError.message 
      });
    }
    
    // Test if can create user (call RPC function)
    const testEmail = `test.${Date.now()}@example.com`;
    const { data: rpcData, error: rpcError } = await supabase.rpc('invite_user', {
      p_email: testEmail,
      p_full_name: 'Test User',
      p_role: 'teacher',
      p_grade_level: null,
      p_phone: null,
      p_parent_email: null,
      p_group_ids: null
    });
    
    return NextResponse.json({
      authenticated: true,
      user_id: user.id,
      email: user.email,
      profile: profile,
      can_create_users: !rpcError,
      test_creation: rpcError ? { error: rpcError.message } : { success: rpcData }
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}