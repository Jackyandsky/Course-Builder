import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

// Helper function to format activity descriptions
function formatActivityDescription(activity: any): string {
  const typeDescriptions: Record<string, string> = {
    'login': 'Logged in',
    'logout': 'Logged out',
    'course_created': `Created course${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'course_updated': `Updated course${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'course_deleted': `Deleted course${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'course_enrolled': `Enrolled in course${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'course_completed': `Completed course${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'lesson_created': `Created lesson${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'lesson_updated': `Updated lesson${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'lesson_completed': `Completed lesson${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'task_submitted': `Submitted task${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'task_reviewed': `Reviewed task${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'order_placed': `Placed order${activity.entity_name ? ' #' + activity.entity_name : ''}`,
    'order_completed': `Completed order${activity.entity_name ? ' #' + activity.entity_name : ''}`,
    'content_created': `Created content${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'content_updated': `Updated content${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'content_accessed': `Accessed content${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'book_added': `Added book${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'book_updated': `Updated book${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'user_registered': `New user registered${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'user_updated': `Updated user${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'file_uploaded': `Uploaded file${activity.entity_name ? ': ' + activity.entity_name : ''}`,
    'file_deleted': `Deleted file${activity.entity_name ? ': ' + activity.entity_name : ''}`
  };
  
  return typeDescriptions[activity.activity_type] || activity.activity_type;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[Dashboard API] Request started');
  
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    console.log('[Dashboard API] Checking session...');
    const sessionStart = Date.now();
    const { data: { session } } = await supabase.auth.getSession();
    console.log(`[Dashboard API] Session check took ${Date.now() - sessionStart}ms`);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', retry: true },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store', // Don't cache auth errors
          }
        }
      );
    }

    // Check if user is admin or teacher  
    console.log('[Dashboard API] Checking user profile...');
    const profileStart = Date.now();
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    console.log(`[Dashboard API] Profile check took ${Date.now() - profileStart}ms`);

    if (userProfile?.role !== 'admin' && userProfile?.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Load dashboard stats and recent activity - optimized with fewer parallel queries
    console.log('[Dashboard API] Loading stats and activity...');
    const statsStart = Date.now();
    
    const [
      basicCountsResult,
      recentActivityResult
    ] = await Promise.all([
      // Get basic counts in a single RPC call for better performance
      supabase.rpc('get_dashboard_stats'),
      
      // Get recent activity - simplified without join first
      supabase
        .from('activity_logs')
        .select('*')
        .in('activity_type', [
          'login', 'logout', 'course_created', 'course_updated', 'course_enrolled',
          'lesson_created', 'lesson_completed', 'task_submitted', 'task_reviewed',
          'order_placed', 'order_completed', 'content_created', 'content_updated',
          'content_accessed', 'book_added', 'user_registered', 'file_uploaded',
          'booking_created', 'booking_deleted', 'booking_status_changed'
        ])
        .order('created_at', { ascending: false })
        .limit(15)
    ]);
    
    console.log(`[Dashboard API] Stats and activity loading took ${Date.now() - statsStart}ms`);

    // Fallback to individual queries if the RPC doesn't exist
    let stats;
    if (basicCountsResult.error) {
      console.log('RPC get_dashboard_stats not available, using individual queries');
      const [
        usersResult,
        coursesResult,
        booksResult,
        proprietaryStatsResult,
        vocabularyStatsResult,
        enrollmentsStatsResult
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.rpc('get_proprietary_stats'),
        supabase.rpc('get_vocabulary_stats'),
        supabase.rpc('get_enrollments_stats')
      ]);

      stats = {
        totalUsers: usersResult.count || 0,
        activeCourses: coursesResult.count || 0,
        libraryItems: booksResult.count || 0,
        proprietaryProducts: proprietaryStatsResult.data || { total: 0, content: 0, categories: 0 },
        vocabulary: vocabularyStatsResult.data || { total: 0, groups: 0 },
        enrollments: enrollmentsStatsResult.data || { total: 0 }
      };
    } else {
      stats = basicCountsResult.data;
    }
    
    // Format recent activity for display
    const recentActivity = (recentActivityResult.data || []).map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      entityType: activity.entity_type,
      entityId: activity.entity_id,
      entityName: activity.entity_name,
      description: formatActivityDescription(activity) + (activity.ip_address ? ` (IP: ${activity.ip_address})` : ''),
      userEmail: activity.user_email || 'Unknown',
      createdAt: activity.created_at,
      metadata: activity.metadata
    }));

    console.log(`[Dashboard API] Total request took ${Date.now() - startTime}ms`);
    
    return NextResponse.json({ 
      stats,
      recentActivity,
      user: {
        id: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    console.log(`[Dashboard API] Error after ${Date.now() - startTime}ms`);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}