'use server';

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

    const userId = session.user.id;

    // Fetch recent enrollments
    const { data: recentEnrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*, course:courses(title)')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })
      .limit(5);

    // Fetch recent orders
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch recent purchases
    const { data: recentPurchases, error: purchasesError } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false })
      .limit(5);

    // Fetch recent login/logout activities from activity_logs
    const { data: recentActivities, error: activitiesError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .in('activity_type', ['login', 'logout'])
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent bookings
    const { data: recentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Ignore table not found errors
    if (enrollmentsError && enrollmentsError.code !== 'PGRST116') throw enrollmentsError;
    if (ordersError && ordersError.code !== 'PGRST116') throw ordersError;
    if (purchasesError && purchasesError.code !== 'PGRST116') throw purchasesError;

    if (bookingsError && bookingsError.code !== 'PGRST116') throw bookingsError;

    // Create combined activity feed
    const activities = [];

    // Add real login/logout activities from database
    recentActivities?.forEach(activity => {
      activities.push({
        id: activity.id,
        type: activity.activity_type,
        title: activity.activity_type === 'login' ? 'User Login' : 'User Logout',
        description: activity.description + (activity.ip_address ? ` (IP: ${activity.ip_address})` : ''),
        date: activity.created_at,
        icon: activity.activity_type === 'login' ? 'LogIn' : 'LogOut',
        color: activity.activity_type === 'login' ? 'text-green-600' : 'text-red-600'
      });
    });

    // Add enrollment activities
    recentEnrollments?.forEach(enrollment => {
      activities.push({
        id: `enrollment-${enrollment.id}`,
        type: 'course_start',
        title: 'Course Enrollment',
        description: `Enrolled in ${enrollment.course?.title || 'Unknown Course'}`,
        date: enrollment.enrolled_at,
        icon: 'BookOpen',
        color: 'text-blue-600'
      });
    });

    // Add order activities
    recentOrders?.forEach(order => {
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        title: 'Order Placed',
        description: `Order #${order.order_number || order.id.slice(0, 8)} - $${order.total_amount}`,
        date: order.created_at,
        icon: 'ShoppingCart',
        color: 'text-green-600'
      });
    });

    // Add purchase activities
    recentPurchases?.forEach(purchase => {
      activities.push({
        id: `purchase-${purchase.id}`,
        type: 'content_access',
        title: 'Content Access',
        description: `Accessed ${purchase.item_name || purchase.item_type}`,
        date: purchase.purchased_at,
        icon: 'FileText',
        color: 'text-purple-600'
      });
    });

    // Add booking activities
    recentBookings?.forEach(booking => {
      const bookingType = booking.metadata?.type || 'appointment';
      const teacherName = booking.metadata?.teacher_name;
      const grade = booking.metadata?.grade;
      
      let title = 'Appointment Booked';
      let description = '';
      
      switch (bookingType) {
        case 'diagnosis':
          title = 'Diagnostic Assessment Booked';
          description = `Diagnostic assessment${grade ? ` for Grade ${grade}` : ''}${teacherName ? ` with ${teacherName}` : ''}`;
          break;
        case 'progress_review':
          title = 'Progress Review Booked';
          description = `Progress review${grade ? ` for Grade ${grade}` : ''}${teacherName ? ` with ${teacherName}` : ''}`;
          break;
        case 'tutoring':
          title = 'Tutoring Session Booked';
          description = `Tutoring session${teacherName ? ` with ${teacherName}` : ''}`;
          break;
        case 'consultation':
          title = 'Consultation Booked';
          description = `Consultation${teacherName ? ` with ${teacherName}` : ''}`;
          break;
        default:
          description = `${bookingType}${teacherName ? ` with ${teacherName}` : ''}`;
      }
      
      // Add booking date and time to description
      if (booking.booking_date && booking.booking_time) {
        const bookingDate = new Date(booking.booking_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        description += ` on ${bookingDate} at ${booking.booking_time}`;
      }
      
      // Add status to description if not confirmed
      if (booking.status !== 'confirmed') {
        description += ` (${booking.status})`;
      }

      activities.push({
        id: `booking-${booking.id}`,
        type: 'booking',
        title: title,
        description: description,
        date: booking.created_at,
        icon: 'Calendar',
        color: booking.status === 'confirmed' ? 'text-blue-600' : 
               booking.status === 'completed' ? 'text-green-600' :
               booking.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
      });
    });

    // Sort by date and limit to 10 most recent
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return NextResponse.json({ activities: sortedActivities });

  } catch (error) {
    console.error('Error fetching account activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}