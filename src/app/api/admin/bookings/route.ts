import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

// GET - Fetch all bookings for admin
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const upcoming = searchParams.get('upcoming') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Build query to fetch all bookings with user information
    let query = supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        teacher_id,
        booking_date,
        booking_time,
        status,
        metadata,
        created_at,
        updated_at,
        confirmed_at,
        completed_at,
        cancelled_at
      `);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (type) {
      // Filter by metadata type
      query = query.eq('metadata->>type', type);
    }
    
    if (upcoming) {
      query = query.gte('booking_date', new Date().toISOString().split('T')[0])
        .in('status', ['pending', 'confirmed']);
    }

    // Apply limit if specified
    if (limit) {
      query = query.limit(limit);
    }

    // Order by booking date and time (most recent first)
    query = query.order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });

    const { data: bookings, error: bookingsError } = await query;

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    // Get user information for each booking
    if (bookings && bookings.length > 0) {
      const userIds = [...new Set(bookings.map(b => b.user_id))];
      
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching user profiles:', usersError);
        // Continue without user info rather than failing
      }

      // Combine booking data with user info
      const bookingsWithUserInfo = bookings.map(booking => ({
        ...booking,
        user_email: users?.find(u => u.id === booking.user_id)?.email || null,
        user_name: users?.find(u => u.id === booking.user_id)?.full_name || null,
      }));

      return NextResponse.json({ 
        bookings: bookingsWithUserInfo,
        count: bookingsWithUserInfo.length
      });
    }

    return NextResponse.json({ 
      bookings: bookings || [],
      count: bookings?.length || 0
    });
    
  } catch (error) {
    console.error('Error in admin bookings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}