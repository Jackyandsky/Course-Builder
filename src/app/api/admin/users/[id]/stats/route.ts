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

    const userId = params.id;

    // Fetch enrollment statistics
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId);
    
    let enrollmentCount = 0;
    let completedCourses = 0;
    let averageScore = 0;

    if (enrollments) {
      enrollmentCount = enrollments.filter(e => e.status === 'active' || e.status === 'in_progress').length;
      completedCourses = enrollments.filter(e => e.status === 'completed').length;
      
      // Calculate average score from completed courses
      const scores = enrollments
        .filter(e => e.final_score !== null)
        .map(e => e.final_score);
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        averageScore = Math.round(avg);
      }
    }

    // Get last activity as proxy for last login
    const activities = [];

    // Check last booking
    const { data: lastBooking } = await supabase
      .from('bookings')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (lastBooking) {
      activities.push(new Date(lastBooking.created_at).getTime());
    }

    // Check last enrollment
    const { data: lastEnrollment } = await supabase
      .from('enrollments')
      .select('enrolled_at')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .single();
    
    if (lastEnrollment) {
      activities.push(new Date(lastEnrollment.enrolled_at).getTime());
    }

    // Check last purchase
    const { data: lastPurchase } = await supabase
      .from('user_purchases')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (lastPurchase) {
      activities.push(new Date(lastPurchase.created_at).getTime());
    }

    // Check profile update
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('updated_at')
      .eq('id', userId)
      .single();
    
    if (userProfile?.updated_at) {
      activities.push(new Date(userProfile.updated_at).getTime());
    }

    // Get the most recent activity as last login approximation
    let lastLogin = null;
    if (activities.length > 0) {
      const mostRecent = Math.max(...activities);
      lastLogin = new Date(mostRecent).toISOString();
    }

    return NextResponse.json({
      enrollmentCount,
      completedCourses,
      averageScore,
      lastLogin
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}