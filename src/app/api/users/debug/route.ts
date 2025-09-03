import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false,
        error: userError?.message || 'No user logged in' 
      });
    }
    
    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Try to fetch all users
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Check RLS status
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('current_setting', { setting_name: 'row_security' })
      .single();
    
    return NextResponse.json({
      current_user: {
        id: user.id,
        email: user.email,
        profile: profile,
        profile_error: profileError?.message
      },
      all_profiles: {
        count: allProfiles?.length || 0,
        data: allProfiles,
        error: allProfilesError?.message
      },
      rls_enabled: rlsStatus,
      rls_error: rlsError?.message,
      // Test query with different approaches
      test_queries: await testQueries(supabase)
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

async function testQueries(supabase: any) {
  const results: any = {};
  
  // Test 1: Direct query
  const { data: test1, error: error1 } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, role')
    .limit(5);
  
  results.direct_query = {
    count: test1?.length || 0,
    error: error1?.message,
    data: test1
  };
  
  // Test 2: Query with auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: test2, error: error2 } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'student')
      .limit(5);
    
    results.student_query = {
      count: test2?.length || 0,
      error: error2?.message,
      data: test2
    };
  }
  
  return results;
}