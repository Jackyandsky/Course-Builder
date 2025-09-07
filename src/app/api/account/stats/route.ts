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

    // Fetch user enrollments (assigned courses) - only active ones count
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*, course:courses(*)')
      .eq('user_id', userId)
      .eq('is_active', true)  // Only count active enrollments
      .in('status', ['active', 'pending']);

    if (enrollmentsError) throw enrollmentsError;

    // Fetch user purchases (courses, books and content)
    const { data: purchases, error: purchasesError } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Ignore table not found errors for purchases
    if (purchasesError && purchasesError.code !== 'PGRST116') throw purchasesError;
    
    // Fetch task submissions for the user
    const { data: submissions, error: submissionsError } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('user_id', userId);

    // Ignore table not found errors for submissions
    if (submissionsError && submissionsError.code !== 'PGRST116') throw submissionsError;

    // Fetch orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount, status')
      .eq('user_id', userId);

    // Ignore table not found errors for orders
    if (ordersError && ordersError.code !== 'PGRST116') throw ordersError;

    // Calculate stats - only count active enrollments (which represent accessible courses)
    // Enrollments are created when courses are purchased, so we don't double-count
    const totalCourseCount = enrollments?.length || 0;
    
    // Calculate library items (books + content)
    const bookCount = purchases?.filter(p => p.item_type === 'book').length || 0;
    const contentCount = purchases?.filter(p => p.item_type === 'content').length || 0;
    const libraryCount = bookCount + contentCount;
    
    const totalSpent = orders?.reduce((sum, order) => {
      return order.status === 'completed' ? sum + (parseFloat(order.total_amount) || 0) : sum;
    }, 0) || 0;

    // Calculate submissions count
    const totalSubmissions = submissions?.length || 0;
    const completedSubmissions = submissions?.filter(s => 
      s.status === 'approved' || s.status === 'completed' || s.status === 'reviewed'
    ).length || 0;
    
    // Calculate course progress from active enrollments only
    const completedCourses = enrollments?.filter(e => e.status === 'completed').length || 0;
    const inProgressCourses = enrollments?.filter(e => e.status === 'active').length || 0;

    const stats = {
      courses: totalCourseCount,  // Only active enrollments (valid/accessible courses)
      orders: orders?.length || 0,
      totalSpent,
      content: libraryCount,  // Total library items (books + content)
      completedCourses,  // Completed courses from active enrollments
      inProgressCourses,  // In-progress courses from active enrollments
      totalSubmissions,  // Total task submissions
      completedSubmissions  // Completed/approved submissions
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching account stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}