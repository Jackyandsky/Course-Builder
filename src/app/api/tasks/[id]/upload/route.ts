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
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const courseId = formData.get('courseId') as string;
    const lessonId = formData.get('lessonId') as string;
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Get task details to validate requirements
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Validate files against task requirements
    const maxFiles = task.max_files_count || 5;
    const maxSizeMB = task.max_file_size_mb || 200;
    const allowedTypes = task.allowed_media_types || ['image', 'video', 'audio', 'document'];

    if (files.length > maxFiles) {
      return NextResponse.json({ 
        error: `Maximum ${maxFiles} files allowed` 
      }, { status: 400 });
    }

    const uploadedFiles = [];
    
    for (const file of files) {
      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        return NextResponse.json({ 
          error: `File ${file.name} exceeds ${maxSizeMB}MB limit` 
        }, { status: 400 });
      }

      // Check file type
      const fileCategory = getFileCategory(file.type);
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
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tasks', user.id, taskId);
      
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
      const fileUrl = `/uploads/tasks/${user.id}/${taskId}/${safeFileName}`;

      uploadedFiles.push({
        name: file.name,
        url: fileUrl,
        size: file.size,
        type: file.type,
        category: fileCategory,
        path: filePath
      });
    }

    // Check if submission already exists
    const { data: existingSubmission } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .single();

    let submission;
    let submissionError;

    if (existingSubmission) {
      // Update existing submission - remove old files if they exist
      if (existingSubmission.submission_data?.files) {
        // Clean up old files from filesystem
        for (const oldFile of existingSubmission.submission_data.files) {
          if (oldFile.path && existsSync(oldFile.path)) {
            try {
              const fs = await import('fs/promises');
              await fs.unlink(oldFile.path);
            } catch (err) {
              console.error('Failed to delete old file:', err);
            }
          }
        }
      }
      
      // Update existing submission
      const { data, error } = await supabase
        .from('task_submissions')
        .update({
          submission_data: { files: uploadedFiles },
          course_id: courseId || existingSubmission.course_id,
          lesson_id: lessonId || existingSubmission.lesson_id,
          submitted_at: new Date().toISOString(),
          status: 'submitted',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubmission.id)
        .select()
        .single();
      submission = data;
      submissionError = error;
    } else {
      // Create new submission
      const { data, error } = await supabase
        .from('task_submissions')
        .insert({
          task_id: taskId,
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          submission_data: { files: uploadedFiles },
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        })
        .select()
        .single();
      submission = data;
      submissionError = error;
    }

    if (submissionError) {
      console.error('Submission error:', submissionError);
      // Try to clean up uploaded files from filesystem
      for (const file of uploadedFiles) {
        if (file.path && existsSync(file.path)) {
          try {
            const fs = await import('fs/promises');
            await fs.unlink(file.path);
          } catch (err) {
            console.error('Failed to delete uploaded file:', err);
          }
        }
      }
      return NextResponse.json({ 
        error: 'Failed to create submission record' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      submission,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}