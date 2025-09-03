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

    // Execute all queries in parallel for better performance
    const [
      enrollmentsResult,
      purchasesResult,
      submissionsResult,
      ordersResult
    ] = await Promise.allSettled([
      // Fetch user enrollments with minimal course data
      supabase
        .from('enrollments')
        .select('id, status, course_id')
        .eq('user_id', userId)
        .in('status', ['active', 'pending', 'completed']),
      
      // Fetch user purchases
      supabase
        .from('user_purchases')
        .select('id, item_type')
        .eq('user_id', userId)
        .eq('is_active', true),
      
      // Fetch task submissions count only
      supabase
        .from('task_submissions')
        .select('id, status', { count: 'exact' })
        .eq('user_id', userId),
      
      // Fetch orders with aggregated total
      supabase
        .from('orders')
        .select('total_amount, status')
        .eq('user_id', userId)
        .eq('status', 'completed')
    ]);

    // Process results with error handling
    const enrollments = enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value.data : [];
    const purchases = purchasesResult.status === 'fulfilled' ? purchasesResult.value.data : [];
    const submissions = submissionsResult.status === 'fulfilled' ? submissionsResult.value.data : [];
    const orders = ordersResult.status === 'fulfilled' ? ordersResult.value.data : [];

    // Calculate stats efficiently
    const enrollmentsByStatus = enrollments?.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const purchasesByType = purchases?.reduce((acc, p) => {
      acc[p.item_type] = (acc[p.item_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const submissionsByStatus = submissions?.reduce((acc, s) => {
      const status = s.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const totalSpent = orders?.reduce((sum, order) => 
      sum + (parseFloat(order.total_amount) || 0), 0) || 0;

    const stats = {
      courses: (enrollmentsByStatus.active || 0) + 
               (enrollmentsByStatus.pending || 0) + 
               (enrollmentsByStatus.completed || 0) +
               (purchasesByType.course || 0),
      orders: orders?.length || 0,
      totalSpent,
      content: (purchasesByType.book || 0) + (purchasesByType.content || 0),
      completedCourses: enrollmentsByStatus.completed || 0,
      inProgressCourses: enrollmentsByStatus.active || 0,
      totalSubmissions: submissions?.length || 0,
      completedSubmissions: (submissionsByStatus.approved || 0) + 
                           (submissionsByStatus.completed || 0) + 
                           (submissionsByStatus.reviewed || 0)
    };

    // Add cache headers for client-side caching
    const response = NextResponse.json({ stats });
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error('Error fetching account stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}