import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;
    
    const { supabase } = auth;
  
    // Fetch enrollments with real progress calculation
    const { data: enrollmentsRaw, error: enrollmentsError } = await supabase.rpc('get_enrollments_with_progress');

    let enrollments;
    
    if (enrollmentsError || !enrollmentsRaw) {

      // Fallback: First fetch enrollments with course and schedule details
      const { data: basicEnrollments, error } = await supabase
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
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('Error fetching enrollments:', error);
        return NextResponse.json(
          { error: 'Failed to fetch enrollments' },
          { status: 500 }
        );
      }

      enrollments = basicEnrollments;
    } else {
      enrollments = enrollmentsRaw;
    }

    // Now fetch user profiles and enrolled_by profiles
    const userIds = [...new Set(enrollments?.map(e => e.user_id) || [])];
    const enrolledByIds = [...new Set(enrollments?.map(e => e.enrolled_by).filter(id => id) || [])];
    const allUserIds = [...new Set([...userIds, ...enrolledByIds])];

    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .in('id', allUserIds);

    // Create a map of user profiles
    const userMap = new Map();
    userProfiles?.forEach(user => {
      userMap.set(user.id, user);
    });

    // Calculate real progress for each enrollment using user_id and course_id
    const userCourseMap = new Map();
    enrollments?.forEach(e => {
      const key = `${e.user_id}-${e.course_id}`;
      userCourseMap.set(key, e.id);
    });
    
    const courseIds = [...new Set(enrollments?.map(e => e.course_id) || [])];
    
    const { data: progressData } = await supabase
      .from('user_progress')
      .select(`
        user_id,
        lesson_id,
        is_completed,
        course_id
      `)
      .in('user_id', userIds)
      .in('course_id', courseIds)
      .eq('is_completed', true);

    // Create progress map by user_id and course_id
    const progressMap = new Map();
    progressData?.forEach(prog => {
      const key = `${prog.user_id}-${prog.course_id}`;
      if (!progressMap.has(key)) {
        progressMap.set(key, new Set());
      }
      progressMap.get(key).add(prog.lesson_id);
    });

    // Get total lessons count for each schedule
    const scheduleIds = [...new Set(enrollments?.map(e => e.schedule_id).filter(id => id) || [])];
    const { data: lessonsCount } = await supabase
      .from('lessons')
      .select('schedule_id, id')
      .in('schedule_id', scheduleIds);

    // Create lessons count map
    const lessonsCountMap = new Map();
    lessonsCount?.forEach(lesson => {
      if (!lessonsCountMap.has(lesson.schedule_id)) {
        lessonsCountMap.set(lesson.schedule_id, 0);
      }
      lessonsCountMap.set(lesson.schedule_id, lessonsCountMap.get(lesson.schedule_id) + 1);
    });

    // Transform the data to match the expected format
    const transformedEnrollments = enrollments?.map(enrollment => {
      const progressKey = `${enrollment.user_id}-${enrollment.course_id}`;
      const completedLessons = progressMap.get(progressKey)?.size || 0;
      const totalLessons = lessonsCountMap.get(enrollment.schedule_id) || 0;
      const calculatedProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      
      const enrolledByUser = userMap.get(enrollment.enrolled_by);
      const resourceInfo = enrollment.enrolled_by === enrollment.user_id 
        ? { type: 'self-enrolled', source: 'User purchased' }
        : { type: 'admin-assigned', source: `Assigned by ${enrolledByUser?.full_name || 'Admin'}` };

      return {
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
        course: enrollment.courses || enrollment.course,
        schedule: enrollment.schedules || enrollment.schedule
      };
    }) || [];

    return NextResponse.json({ 
      enrollments: transformedEnrollments,
      total: transformedEnrollments.length 
    });
  } catch (error) {
    console.error('Error in enrollments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;
    
    const { supabase } = auth;
  
    const body = await request.json();
    const { user_id, course_id, schedule_id } = body;

    if (!user_id || !course_id) {
      return NextResponse.json(
        { error: 'User ID and Course ID are required' },
        { status: 400 }
      );
    }

    // Check if enrollment already exists
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user_id)
      .eq('course_id', course_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Enrollment already exists for this user and course' },
        { status: 409 }
      );
    }

    // Create new enrollment
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert({
        user_id,
        course_id,
        schedule_id,
        enrolled_at: new Date().toISOString(),
        enrolled_by: auth.user.id,
        status: 'active',
        is_active: true,
        progress: {
          current_lesson: null,
          completed_lessons: [],
          completion_percentage: 0
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating enrollment:', error);
      return NextResponse.json(
        { error: 'Failed to create enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error('Error in create enrollment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}