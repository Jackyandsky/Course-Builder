import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { CourseService } from '@/lib/services/course.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const courseId = params.id;
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    // Use the service layer to get the course
    const courseService = new CourseService(supabase);
    const { data, error } = await courseService.getById(courseId);

    if (error || !data) {
      console.error('Error fetching course:', error);
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course is public
    if (!data.is_public) {
      return NextResponse.json({ error: 'Course is not publicly available' }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in course detail API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}