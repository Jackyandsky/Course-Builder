import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get submission with all related data
    const { data: submission, error } = await supabase
      .from('task_submissions')
      .select(`
        *,
        task:tasks!inner (
          id,
          title,
          description,
          points,
          media_required,
          allowed_media_types,
          max_file_size_mb,
          max_files_count
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', submission.user_id)
      .single();

    // Get media files from submission_data or task_media table
    let mediaFiles = [];
    
    // First check if files are in submission_data (new approach)
    if (submission.submission_data?.files && submission.submission_data.files.length > 0) {
      mediaFiles = submission.submission_data.files;
    } else {
      // Fallback to task_media table (old approach)
      const { data: taskMediaFiles } = await supabase
        .from('task_media')
        .select('*')
        .eq('task_id', submission.task_id)
        .eq('user_id', submission.user_id)
        .eq('is_active', true)
        .order('upload_date', { ascending: false });
      
      if (taskMediaFiles) {
        mediaFiles = taskMediaFiles.map(file => ({
          name: file.file_name,
          url: file.file_url,
          size: file.file_size,
          type: file.file_type
        }));
      }
    }

    return NextResponse.json({
      ...submission,
      user: {
        id: submission.user_id,
        email: userProfile?.email || 'Unknown',
        user_profiles: {
          full_name: userProfile?.full_name
        }
      },
      media_files: mediaFiles
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch submission' 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or teacher
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'teacher'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle both JSON and FormData
    let status: string;
    let score: number;
    let review_notes: string;
    let response_file_url: string | null = null;

    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData with file upload
      const formData = await request.formData();
      status = formData.get('status') as string;
      score = parseInt(formData.get('score') as string || '0');
      review_notes = formData.get('review_notes') as string || '';
      
      // Handle file upload if present
      const responseFile = formData.get('response_file') as File | null;
      if (responseFile && responseFile.size > 0) {
        try {
          // Generate unique filename
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(7);
          const fileExt = responseFile.name.split('.').pop();
          const safeFileName = `response_${params.id}_${timestamp}_${randomString}.${fileExt}`;
          

          // Create directory structure: public/uploads/submissions/responses/
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'submissions', 'responses');
          
          // Ensure directory exists
          if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });

          }
          
          // Save file to local filesystem
          const filePath = path.join(uploadDir, safeFileName);
          const arrayBuffer = await responseFile.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          await writeFile(filePath, buffer);

          // Create relative URL for accessing the file
          response_file_url = `/uploads/submissions/responses/${safeFileName}`;

        } catch (fileError) {
          console.error('File processing/saving error:', fileError);
          // Continue without file but log the error
        }
      }
    } else {
      // Handle regular JSON
      const body = await request.json();
      status = body.status;
      score = body.score;
      review_notes = body.review_notes;
    }

    // Prepare update data
    const updateData: any = {
      status,
      score,
      review_notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      updated_at: new Date().toISOString()
    };

    // Add response file URL if available
    if (response_file_url) {
      updateData.response_file_url = response_file_url;
    }

    // Update submission
    const { data, error } = await supabase
      .from('task_submissions')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ 
      error: 'Failed to update submission' 
    }, { status: 500 });
  }
}