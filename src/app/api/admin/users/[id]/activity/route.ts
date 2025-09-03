import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;

    // Fetch various activity types
    const activities = [];

    // 1. Fetch recent bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (bookings) {
      bookings.forEach(booking => {
        activities.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          icon: 'calendar',
          title: `Booked ${booking.metadata?.type || 'appointment'}`,
          description: `Scheduled for ${booking.booking_date} at ${booking.booking_time}`,
          timestamp: booking.created_at,
          metadata: {
            status: booking.status,
            teacher: booking.metadata?.teacher_name
          }
        });

        // Add status changes as separate activities
        if (booking.confirmed_at) {
          activities.push({
            id: `booking-confirm-${booking.id}`,
            type: 'booking_status',
            icon: 'check',
            title: 'Booking confirmed',
            description: `${booking.metadata?.type || 'Appointment'} confirmed`,
            timestamp: booking.confirmed_at,
            metadata: { status: 'confirmed' }
          });
        }
        if (booking.cancelled_at) {
          activities.push({
            id: `booking-cancel-${booking.id}`,
            type: 'booking_status',
            icon: 'x',
            title: 'Booking cancelled',
            description: booking.metadata?.cancelled_reason || 'Booking was cancelled',
            timestamp: booking.cancelled_at,
            metadata: { status: 'cancelled' }
          });
        }
      });
    }

    // 2. Fetch course enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          title,
          category
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })
      .limit(5);

    if (enrollments) {
      enrollments.forEach(enrollment => {
        activities.push({
          id: `enrollment-${enrollment.id}`,
          type: 'course_enrollment',
          icon: 'book',
          title: 'Enrolled in course',
          description: enrollment.courses?.title || 'Unknown course',
          timestamp: enrollment.enrolled_at,
          metadata: {
            status: enrollment.status,
            progress: enrollment.progress
          }
        });

        if (enrollment.completed_at) {
          activities.push({
            id: `enrollment-complete-${enrollment.id}`,
            type: 'course_completion',
            icon: 'award',
            title: 'Completed course',
            description: enrollment.courses?.title || 'Unknown course',
            timestamp: enrollment.completed_at,
            metadata: {
              final_score: enrollment.final_score
            }
          });
        }
      });
    }

    // 3. Fetch purchases
    const { data: purchases } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (purchases) {
      purchases.forEach(purchase => {
        activities.push({
          id: `purchase-${purchase.id}`,
          type: 'purchase',
          icon: 'shopping-cart',
          title: `Purchased ${purchase.item_type}`,
          description: purchase.item_name || 'Item purchased',
          timestamp: purchase.created_at,
          metadata: {
            price: purchase.price,
            status: purchase.status
          }
        });
      });
    }

    // 4. Fetch task submissions
    const { data: submissions } = await supabase
      .from('task_submissions')
      .select(`
        *,
        tasks (
          title
        )
      `)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(5);

    if (submissions) {
      submissions.forEach(submission => {
        activities.push({
          id: `submission-${submission.id}`,
          type: 'task_submission',
          icon: 'clipboard',
          title: 'Submitted task',
          description: submission.tasks?.title || 'Task submission',
          timestamp: submission.submitted_at,
          metadata: {
            status: submission.status,
            score: submission.score
          }
        });
      });
    }

    // 5. Fetch profile updates from audit log if available
    const { data: profileUpdates } = await supabase
      .from('user_profiles')
      .select('updated_at')
      .eq('id', userId)
      .single();

    if (profileUpdates?.updated_at) {
      activities.push({
        id: `profile-update-${userId}`,
        type: 'profile_update',
        icon: 'user',
        title: 'Profile updated',
        description: 'User information was updated',
        timestamp: profileUpdates.updated_at,
        metadata: {}
      });
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    // Limit to 20 most recent activities
    const recentActivities = activities.slice(0, 20);

    return NextResponse.json({ 
      activities: recentActivities,
      total: activities.length
    });
    
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}