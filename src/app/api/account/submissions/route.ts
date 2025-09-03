import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const courseId = searchParams.get('courseId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // First get total count for pagination
    let countQuery = supabase
      .from('task_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Apply filters to count query
    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count: totalCount } = await countQuery;

    // Fetch submissions with related data
    let query = supabase
      .from('task_submissions')
      .select(`
        *,
        tasks!inner (
          id,
          title,
          description,
          points,
          media_required,
          allowed_media_types,
          max_file_size_mb,
          max_files_count
        ),
        lessons!left (
          id,
          title,
          lesson_number,
          courses!inner (
            id,
            title
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (courseId) {
      query = query.eq('lessons.course_id', courseId);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const transformedSubmissions = submissions?.map(submission => {
      const files = submission.submission_data?.files || [];
      const lesson = submission.lessons;
      const course = lesson?.courses;
      const task = submission.tasks;

      return {
        id: submission.id,
        title: task?.title || 'Untitled Task',
        assignment: task?.description || '',
        course: course?.title || 'Unknown Course',
        courseId: course?.id,
        lessonId: lesson?.id,
        lessonTitle: lesson?.title,
        lessonNumber: lesson?.lesson_number,
        type: task?.media_required ? 'project' : 'assignment',
        status: submission.status,
        submitted_at: submission.submitted_at,
        created_at: submission.created_at,
        updated_at: submission.updated_at,
        reviewed_at: submission.reviewed_at,
        score: submission.score,
        max_points: task?.points,
        review_notes: submission.review_notes,
        response_file_url: submission.response_file_url,
        files: files,
        file_count: files.length,
        total_size: files.reduce((sum: number, file: any) => sum + (file.size || 0), 0),
        task_id: submission.task_id,
        media_required: task?.media_required,
        submission_text: submission.submission_text
      };
    }) || [];

    // Apply text search if provided
    let filteredSubmissions = transformedSubmissions;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSubmissions = transformedSubmissions.filter(sub => 
        sub.title.toLowerCase().includes(searchLower) ||
        sub.assignment.toLowerCase().includes(searchLower) ||
        sub.course.toLowerCase().includes(searchLower) ||
        sub.lessonTitle?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate stats
    const stats = {
      total: filteredSubmissions.length,
      pending: filteredSubmissions.filter(s => s.status === 'pending').length,
      submitted: filteredSubmissions.filter(s => s.status === 'submitted').length,
      approved: filteredSubmissions.filter(s => s.status === 'approved').length,
      rejected: filteredSubmissions.filter(s => s.status === 'rejected').length,
      revision_requested: filteredSubmissions.filter(s => s.status === 'revision_requested').length,
      avgScore: filteredSubmissions.filter(s => s.score && s.max_points).length > 0
        ? Math.round(
            filteredSubmissions
              .filter(s => s.score && s.max_points)
              .reduce((sum, s) => sum + (s.score! / s.max_points! * 100), 0) /
            filteredSubmissions.filter(s => s.score && s.max_points).length
          )
        : null
    };

    // Add cache headers for better performance
    const response = NextResponse.json({
      submissions: filteredSubmissions,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });

    // Set cache headers - cache for 30 seconds
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error('Error in submissions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint to create a new submission
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, submission_text, lesson_id, course_id } = body;

    if (!task_id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Check if submission already exists
    const { data: existing } = await supabase
      .from('task_submissions')
      .select('id')
      .eq('task_id', task_id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Update existing submission
      const { data, error } = await supabase
        .from('task_submissions')
        .update({
          submission_text,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
      }

      return NextResponse.json(data);
    } else {
      // Create new submission
      const { data, error } = await supabase
        .from('task_submissions')
        .insert({
          task_id,
          user_id: user.id,
          lesson_id,
          course_id,
          submission_text,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error in submission creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}