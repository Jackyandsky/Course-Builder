import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both JSON and FormData
    const contentType = request.headers.get('content-type');
    let submission_text: string | null = null;
    let course_id: string | null = null;
    let lesson_id: string | null = null;
    let files: File[] = [];

    if (contentType?.includes('application/json')) {
      // Handle JSON body (for text-only submissions)
      const body = await request.json();
      submission_text = body.submission_text || null;
      course_id = body.course_id || null;
      lesson_id = body.lesson_id || null;
    } else {
      // Handle FormData for file uploads
      const formData = await request.formData();
      submission_text = formData.get('submissionText') as string | null;
      course_id = formData.get('courseId') as string | null;
      lesson_id = formData.get('lessonId') as string | null;
      files = formData.getAll('files') as File[];
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', params.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check for already uploaded media files
    const { data: existingMedia } = await supabase
      .from('task_media')
      .select('*')
      .eq('task_id', params.id)
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Validate submission based on task requirements
    const hasText = submission_text && submission_text.trim().length > 0;
    const hasFiles = files && files.length > 0;
    const hasUploadedMedia = existingMedia && existingMedia.length > 0;
    
    // Check submission type requirements
    if (task.submission_type === 'text_only' && !hasText) {
      return NextResponse.json({ 
        error: 'Text response is required for this task' 
      }, { status: 400 });
    }
    
    if (task.submission_type === 'media_only' && !hasFiles && !hasUploadedMedia) {
      return NextResponse.json({ 
        error: 'File upload is required for this task' 
      }, { status: 400 });
    }
    
    if (task.submission_type === 'both') {
      if (!hasText) {
        return NextResponse.json({ 
          error: 'Text response is required for this task' 
        }, { status: 400 });
      }
      if (task.media_required && !hasFiles && !hasUploadedMedia) {
        return NextResponse.json({ 
          error: 'File upload is required for this task' 
        }, { status: 400 });
      }
    }
    
    // For 'either' type - allow empty submissions (just marking as complete)
    // No validation needed - users can optionally provide text or files

    // Handle file uploads if present - store locally
    let uploadedFiles = [];
    if (hasFiles) {
      for (const file of files) {
        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        const maxSizeMB = task.max_file_size_mb || 200;
        if (fileSizeMB > maxSizeMB) {
          return NextResponse.json({ 
            error: `File ${file.name} exceeds ${maxSizeMB}MB limit` 
          }, { status: 400 });
        }

        // Check file type
        const fileCategory = getFileCategory(file.type);
        const allowedTypes = task.allowed_media_types || ['image', 'video', 'audio', 'document'];
        if (!allowedTypes.includes(fileCategory)) {
          return NextResponse.json({ 
            error: `File type ${file.type} not allowed` 
          }, { status: 400 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileExt = file.name.split('.').pop();
        const safeFileName = `${timestamp}-${randomString}.${fileExt}`;
        
        // Create directory structure: public/uploads/tasks/{userId}/{taskId}/
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tasks', user.id, params.id);
        
        // Ensure directory exists
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }
        
        // Save file to local filesystem
        const filePath = path.join(uploadDir, safeFileName);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        try {
          await writeFile(filePath, buffer);
        } catch (writeError) {
          console.error('File write error:', writeError);
          return NextResponse.json({ 
            error: `Failed to save ${file.name}` 
          }, { status: 500 });
        }

        // Create relative URL for accessing the file
        const fileUrl = `/uploads/tasks/${user.id}/${params.id}/${safeFileName}`;

        uploadedFiles.push({
          name: file.name,
          url: fileUrl,
          size: file.size,
          type: file.type,
          category: fileCategory,
          path: filePath
        });

        // Save file record to task_media table
        await supabase
          .from('task_media')
          .insert({
            task_id: params.id,
            user_id: user.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: fileUrl,
            file_path: filePath,
            is_active: true
          });
      }
    }

    // Check for existing submission
    const { data: existingSubmission } = await supabase
      .from('task_submissions')
      .select('id, status')
      .eq('task_id', params.id)
      .eq('user_id', user.id)
      .single();

    let submission;

    if (existingSubmission) {
      // Update existing submission
      // Allow resubmission if status is 'pending' or 'revision_requested'
      if (existingSubmission.status !== 'pending' && existingSubmission.status !== 'revision_requested') {
        return NextResponse.json({ 
          error: 'Cannot modify this submission. Current status: ' + existingSubmission.status 
        }, { status: 400 });
      }

      // Track revision count
      const currentRevisionCount = existingSubmission.status === 'revision_requested' 
        ? (await supabase
            .from('task_submissions')
            .select('submission_data')
            .eq('id', existingSubmission.id)
            .single()).data?.submission_data?.revision_count || 0
        : 0;

      // Include existing media files in submission data
      const allFiles = [...uploadedFiles];
      if (hasUploadedMedia) {
        existingMedia.forEach(media => {
          allFiles.push({
            name: media.file_name,
            path: media.file_path,
            url: media.file_path, // Add url field for compatibility
            size: media.file_size,
            type: media.file_type,
            category: media.file_type // Add category for file icon display
          });
        });
      }

      const { data, error } = await supabase
        .from('task_submissions')
        .update({
          status: 'submitted',
          submission_text: hasText ? submission_text : null,
          submission_data: {
            files: allFiles,
            media_count: allFiles.length,
            submitted_via: 'web',
            revision_count: currentRevisionCount + (existingSubmission.status === 'revision_requested' ? 1 : 0),
            last_revised_at: existingSubmission.status === 'revision_requested' ? new Date().toISOString() : null
          },
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubmission.id)
        .select()
        .single();

      if (error) throw error;
      submission = data;
    } else {
      // Include existing media files in submission data
      const allFiles = [...uploadedFiles];
      if (hasUploadedMedia) {
        existingMedia.forEach(media => {
          allFiles.push({
            name: media.file_name,
            path: media.file_path,
            url: media.file_path, // Add url field for compatibility
            size: media.file_size,
            type: media.file_type,
            category: media.file_type // Add category for file icon display
          });
        });
      }

      // Create new submission
      const { data, error } = await supabase
        .from('task_submissions')
        .insert({
          task_id: params.id,
          user_id: user.id,
          course_id,
          lesson_id,
          status: 'submitted',
          submission_text: hasText ? submission_text : null,
          submission_data: {
            files: allFiles,
            media_count: allFiles.length,
            submitted_via: 'web'
          },
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      submission = data;
    }

    return NextResponse.json({
      success: true,
      submission
    });

  } catch (error) {
    console.error('Task submission error:', error);
    return NextResponse.json({ 
      error: 'Failed to submit task' 
    }, { status: 500 });
  }
}

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

// GET endpoint to check submission status
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

    // Get query params for optional course/lesson context
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    // Get submission status with review details
    // Note: We need to handle the relationship manually since reviewed_by references auth.users
    // but we want user_profiles data
    let { data: submission, error } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('task_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    // If no submission exists, create a draft/pending one
    if (!submission) {
      const { data: newSubmission, error: createError } = await supabase
        .from('task_submissions')
        .insert({
          task_id: params.id,
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          status: 'pending', // Draft status
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating draft submission:', createError);
      } else {
        submission = newSubmission;
      }
    }

    // Get reviewer profile if submission has been reviewed
    let reviewerProfile = null;
    if (submission?.reviewed_by) {
      const { data: reviewer } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', submission.reviewed_by)
        .single();
      reviewerProfile = reviewer;
    }

    // Get uploaded media count
    const { data: mediaFiles } = await supabase
      .from('task_media')
      .select('id')
      .eq('task_id', params.id)
      .eq('user_id', user.id)
      .eq('is_active', true);

    return NextResponse.json({
      submission: submission || null,
      media_count: mediaFiles?.length || 0,
      can_submit: !submission || submission.status === 'pending' || submission.status === 'revision_requested',
      can_revise: submission?.status === 'revision_requested',
      review_feedback: submission?.status === 'revision_requested' || submission?.status === 'rejected' ? {
        notes: submission.review_notes,
        score: submission.score,
        reviewed_at: submission.reviewed_at,
        reviewer: reviewerProfile?.full_name || 'Reviewer',
        response_file_url: submission.response_file_url
      } : null,
      revision_count: submission?.submission_data?.revision_count || 0
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch submission status' 
    }, { status: 500 });
  }
}