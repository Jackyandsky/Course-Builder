import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissionId = params.id;
    const fileIndex = request.nextUrl.searchParams.get('fileIndex');

    // Fetch submission details
    const { data: submission, error } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (error || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if user owns this submission or is admin/teacher
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = submission.user_id === user.id;
    const isAdminOrTeacher = userProfile?.role === 'admin' || userProfile?.role === 'teacher';

    if (!isOwner && !isAdminOrTeacher) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get file information
    const files = submission.submission_data?.files || [];
    const fileIdx = fileIndex ? parseInt(fileIndex) : 0;

    if (!files[fileIdx]) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = files[fileIdx];
    
    // Get the file path - check both url and path properties
    const filePath = file.url || file.path;

    // If file path is a local path (starts with /uploads/)
    if (filePath && filePath.startsWith('/uploads/')) {
      // The file is served directly by Next.js from the public folder
      // Create the full URL for redirect
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const host = request.headers.get('host') || 'localhost:3000';
      const fullUrl = `${protocol}://${host}${filePath}`;
      
      // Redirect to the file URL (browser will handle the file based on content type)
      return NextResponse.redirect(fullUrl);
    }

    // Fallback for external URLs
    if (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
      return NextResponse.redirect(filePath);
    }

    return NextResponse.json({ error: 'File URL not available' }, { status: 404 });

  } catch (error) {
    console.error('Error downloading submission file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}