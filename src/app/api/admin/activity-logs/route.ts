import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters for pagination and filtering
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const activityType = searchParams.get('type'); // 'login', 'logout', or null for all
    const userId = searchParams.get('userId');

    // Build query
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        user:user_profiles!activity_logs_user_id_fkey (
          id,
          email,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (activityType) {
      query = query.eq('activity_type', activityType);
    } else {
      // Only show login/logout activities
      query = query.in('activity_type', ['login', 'logout']);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: activities, error, count } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format the response
    const formattedActivities = activities?.map(activity => ({
      id: activity.id,
      userId: activity.user_id,
      userEmail: activity.user?.email || activity.user_email || 'Unknown',
      userName: activity.user?.full_name || activity.user?.email || 'Unknown User',
      userRole: activity.user?.role || 'user',
      type: activity.activity_type,
      title: activity.entity_name || activity.activity_type,
      description: activity.description + (activity.ip_address ? ` (IP: ${activity.ip_address})` : ''),
      ipAddress: activity.ip_address,
      userAgent: activity.user_agent,
      metadata: activity.metadata,
      createdAt: activity.created_at
    })) || [];

    return NextResponse.json({
      activities: formattedActivities,
      total: count,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error in admin activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}