import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/enrollments/current - Get current user's enrollments
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
          tags,
          category:categories(name)
        ),
        schedule:schedules(
          id,
          name,
          start_date,
          end_date,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate real progress based on completed lessons
    let enhancedEnrollments = enrollments || [];
    
    if (enrollments && enrollments.length > 0) {
      const courseIds = enrollments.map(e => e.course_id);
      const scheduleIds = enrollments.map(e => e.schedule_id).filter(Boolean);
      
      // Get user's completed lessons
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id, course_id, is_completed')
        .eq('user_id', user.id)
        .in('course_id', courseIds)
        .eq('is_completed', true);

      // Get total lessons count for each schedule
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, schedule_id, course_id')
        .in('schedule_id', scheduleIds);

      // Create maps for progress calculation
      const completedLessonsMap = new Map();
      const totalLessonsMap = new Map();
      
      // Build completed lessons map by course_id
      progressData?.forEach(progress => {
        if (!completedLessonsMap.has(progress.course_id)) {
          completedLessonsMap.set(progress.course_id, 0);
        }
        completedLessonsMap.set(progress.course_id, completedLessonsMap.get(progress.course_id) + 1);
      });
      
      // Build total lessons map by schedule_id
      lessonsData?.forEach(lesson => {
        if (!totalLessonsMap.has(lesson.schedule_id)) {
          totalLessonsMap.set(lesson.schedule_id, 0);
        }
        totalLessonsMap.set(lesson.schedule_id, totalLessonsMap.get(lesson.schedule_id) + 1);
      });

      // Add progress information to each enrollment
      enhancedEnrollments = enrollments.map(enrollment => {
        const completedCount = completedLessonsMap.get(enrollment.course_id) || 0;
        const totalCount = totalLessonsMap.get(enrollment.schedule_id) || 0;
        const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        return {
          ...enrollment,
          progress: {
            completed_lessons: completedCount,
            total_lessons: totalCount,
            completion_percentage: completionPercentage
          }
        };
      });
    }

    // Calculate simple statistics
    const stats = {
      total: enhancedEnrollments?.length || 0,
      totalHours: enhancedEnrollments?.reduce((total, e) => {
        return total + (e.course?.duration_hours || 0);
      }, 0) || 0
    };

    return NextResponse.json({
      enrollments: enhancedEnrollments || [],
      stats
    });

  } catch (error) {
    console.error('Error in GET enrollments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}