import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or teacher
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const verified = searchParams.get('verified') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the query (simplified to avoid complex joins that might fail)
    let query = supabase
      .from('user_profiles')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,full_name.ilike.%${search}%`
      );
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (verified === 'true') {
      query = query.not('verified_at', 'is', null);
    } else if (verified === 'false') {
      query = query.is('verified_at', null);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Users query error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,full_name.ilike.%${search}%`
      );
    }
    if (role) {
      countQuery = countQuery.eq('role', role);
    }
    if (verified === 'true') {
      countQuery = countQuery.not('verified_at', 'is', null);
    } else if (verified === 'false') {
      countQuery = countQuery.is('verified_at', null);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      }
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}