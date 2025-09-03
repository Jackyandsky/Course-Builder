import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/enrollments/[userId] - Get all enrollments for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - admin, teacher, or the user themselves
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const canView = profile?.role === 'admin' || 
                   profile?.role === 'teacher' || 
                   user.id === params.userId;

    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch enrollments with course details and schedule directly from enrollments table
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(
          id,
          title,
          description,
          short_description,
          duration_hours,
          difficulty,
          thumbnail_url,
          status,
          category_id,
          is_public,
          tags
        ),
        schedule:schedules(
          id,
          name,
          start_date,
          end_date,
          is_active
        )
      `)
      .eq('user_id', params.userId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // No need to process enrollments - schedule is already included via foreign key
    const processedEnrollments = enrollments || [];

    // Calculate simple statistics
    const stats = {
      total: processedEnrollments.length,
      totalHours: processedEnrollments.reduce((total, e) => {
        return total + (e.course?.duration_hours || 0);
      }, 0)
    };

    return NextResponse.json({
      enrollments: processedEnrollments,
      stats
    });

  } catch (error) {
    console.error('Error in GET enrollments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/enrollments/[userId] - Enroll user in a course
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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
    const { course_id, schedule_id } = body;

    if (!course_id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    if (!schedule_id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', params.userId)
      .eq('course_id', course_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User is already enrolled in this course' }, { status: 400 });
    }

    // Create core enrollment with schedule_id
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: params.userId,
        course_id,
        schedule_id, // Save schedule_id directly in enrollments table
        enrolled_at: new Date().toISOString(),
        enrolled_by: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Enrollment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: params.userId,
        action: 'course_enrolled',
        details: {
          course_id,
          schedule_id,
          enrolled_by: user.id
        }
      });

    return NextResponse.json({ 
      success: true,
      enrollment,
      message: 'Successfully enrolled user in course'
    });

  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/enrollments/[userId] - Update enrollment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { enrollment_id, notes } = body;

    if (!enrollment_id) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    // Simple update - just notes for now
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .update({
        notes: notes || null
      })
      .eq('id', enrollment_id)
      .eq('user_id', params.userId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: params.userId,
        action: 'enrollment_updated',
        details: {
          enrollment_id,
          updated_by: user.id
        }
      });

    return NextResponse.json({ 
      success: true,
      enrollment,
      message: 'Enrollment updated successfully'
    });

  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/enrollments/[userId] - Unenroll user from course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can unenroll users' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const enrollment_id = searchParams.get('enrollment_id');

    if (!enrollment_id) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    // Delete enrollment
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollment_id)
      .eq('user_id', params.userId);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: params.userId,
        action: 'course_unenrolled',
        details: {
          enrollment_id,
          unenrolled_by: user.id
        }
      });

    return NextResponse.json({ 
      success: true,
      message: 'User unenrolled successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}