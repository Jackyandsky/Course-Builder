import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Try to query the functions available
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('pronamespace', 2200) // public schema
      .like('proname', 'invite_user%');
    
    // Also check if we can see the actual function in information_schema
    const { data: routines, error: routinesError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .like('routine_name', 'invite_user%');
    
    return NextResponse.json({
      functions,
      functionsError: functionsError?.message,
      routines,
      routinesError: routinesError?.message,
      // Try to call invite_user with test data
      test_call: await testInviteUser(supabase)
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

async function testInviteUser(supabase: any) {
  try {
    const { data, error } = await supabase.rpc('invite_user', {
      p_email: `test.${Date.now()}@example.com`,
      p_full_name: 'Test User',
      p_role: 'teacher',
      p_grade_level: null,
      p_phone: null,
      p_parent_email: null,
      p_group_ids: null
    });
    
    return { data, error: error?.message };
  } catch (err: any) {
    return { error: err.message };
  }
}