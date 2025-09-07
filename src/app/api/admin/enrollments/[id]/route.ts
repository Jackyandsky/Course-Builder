import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;
    
    const { supabase } = auth;
    const { id } = params;
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          id,
          title,
          difficulty,
          duration_hours
        ),
        schedules (
          id,
          name,
          start_date,
          end_date
        )
      `)
      .eq('id', id)
      .single();

    if (error || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Fetch user profiles (main user and enrolled_by)
    const userIds = [enrollment.user_id];
    if (enrollment.enrolled_by) {
      userIds.push(enrollment.enrolled_by);
    }

    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .in('id', userIds);

    const userMap = new Map();
    userProfiles?.forEach(user => {
      userMap.set(user.id, user);
    });

    // Calculate real progress - use user_id and course_id since enrollment_id is null
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('lesson_id, is_completed')
      .eq('user_id', enrollment.user_id)
      .eq('course_id', enrollment.course_id)
      .eq('is_completed', true);

    const completedLessons = progressData?.length || 0;

    // Get total lessons count
    let totalLessons = 0;
    if (enrollment.schedule_id) {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('schedule_id', enrollment.schedule_id);
      totalLessons = lessons?.length || 0;
    }

    const calculatedProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Determine resource info
    const enrolledByUser = userMap.get(enrollment.enrolled_by);
    const resourceInfo = enrollment.enrolled_by === enrollment.user_id 
      ? { type: 'self-enrolled', source: 'User purchased' }
      : { type: 'admin-assigned', source: `Assigned by ${enrolledByUser?.full_name || 'Admin'}` };

    // Transform enrollment with all required data
    const transformedEnrollment = {
      id: enrollment.id,
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      schedule_id: enrollment.schedule_id,
      enrollment_date: enrollment.enrolled_at,
      status: enrollment.status || 'active',
      progress: calculatedProgress,
      completed_lessons: completedLessons,
      total_lessons: totalLessons,
      completion_date: enrollment.completed_at,
      resource: resourceInfo,
      enrolled_by: enrolledByUser || null,
      user: userMap.get(enrollment.user_id) || { 
        id: enrollment.user_id,
        full_name: 'Unknown User',
        email: '',
        role: 'student'
      },
      course: enrollment.courses || { 
        id: enrollment.course_id,
        title: 'Unknown Course',
        difficulty: 'unknown',
        duration_hours: 0
      },
      schedule: enrollment.schedules || null
    };

    return NextResponse.json({ enrollment: transformedEnrollment });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;
    
    const { supabase } = auth;
    const { id } = params;
    const body = await request.json();
    const updates: any = {};
    
    // Only allow updating specific fields
    const allowedFields = ['status', 'schedule_id'];
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }
    
    // Handle progress updates
    if ('progress' in body) {
      updates.progress = {
        completion_percentage: body.progress,
        current_lesson: null,
        completed_lessons: []
      };
    }
    
    // If status is being set to completed, set completion date
    if (updates.status === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.progress = {
        completion_percentage: 100,
        current_lesson: null,
        completed_lessons: []
      };
    }
    
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating enrollment:', error);
      return NextResponse.json(
        { error: 'Failed to update enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error('Error in update enrollment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;
    
    const { supabase } = auth;
    const { id } = params;
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting enrollment:', error);
      return NextResponse.json(
        { error: 'Failed to delete enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete enrollment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}