import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    

    const isAdmin = request.nextUrl.searchParams.get('isAdmin') === 'true';
    
    // Build base query for counting
    let baseQuery = supabase.from('courses').select('status', { count: 'exact' });
    
    // For non-admin users, only count public published courses
    if (!isAdmin && user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['admin', 'teacher'].includes(profile.role)) {
        baseQuery = baseQuery.eq('is_public', true);
      }
    }
    
    // Get all courses with just status field for counting
    const { data: courses, error, count } = await baseQuery;
    
    if (error) {
      console.error('API: Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Calculate stats from the fetched courses
    const stats = {
      total: count || 0,
      draft: courses?.filter(c => c.status === 'draft').length || 0,
      published: courses?.filter(c => c.status === 'published').length || 0,
      archived: courses?.filter(c => c.status === 'archived').length || 0,
    };
    

    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Error in GET course stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}