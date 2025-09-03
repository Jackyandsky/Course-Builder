import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or teacher
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { user_ids, course_ids, group_id } = body;

    if (!user_ids || !course_ids || user_ids.length === 0 || course_ids.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use the bulk enroll function
    const { data, error } = await supabase.rpc('bulk_enroll_users', {
      p_user_ids: user_ids,
      p_course_ids: course_ids,
      p_enrolled_by: user.id,
      p_group_id: group_id || null
    });

    if (error) {
      console.error('Enrollment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      count: data,
      message: `Successfully enrolled ${data} users in courses` 
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const course_id = searchParams.get('course_id');
    const user_id = searchParams.get('user_id');

    let query = supabase
      .from('enrollments')
      .select(`
        *,
        user:user_profiles!user_id(*),
        course:courses!course_id(*),
        group:user_groups!group_id(*)
      `);

    if (course_id) {
      query = query.eq('course_id', course_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query.order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}