import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

// File validation constants
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'],
  video: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv'],
  audio: ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac', '.wma'],
  document: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.xls', '.ppt', '.pptx', '.odt', '.rtf', '.xml', '.json', '.zip', '.rar', '.7z', '.tar', '.gz']
};

const MAX_FILE_SIZES: Record<string, number> = {
  image: 50 * 1024 * 1024,      // 50MB
  video: 200 * 1024 * 1024,     // 200MB
  audio: 50 * 1024 * 1024,      // 50MB
  document: 100 * 1024 * 1024   // 100MB
};

const MIME_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/x-icon'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/x-flv', 'video/x-ms-wmv'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/x-ms-wma'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
             'text/plain', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
             'application/vnd.ms-excel', 'application/vnd.ms-powerpoint', 
             'application/vnd.openxmlformats-officedocument.presentationml.presentation',
             'application/vnd.oasis.opendocument.text', 'application/rtf', 'text/xml', 'application/json',
             'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
             'application/x-tar', 'application/gzip']
};

function getFileType(mimeType: string, fileName: string): string | null {
  const ext = path.extname(fileName).toLowerCase();
  
  for (const [type, mimes] of Object.entries(MIME_TYPES)) {
    if (mimes.includes(mimeType) || ALLOWED_EXTENSIONS[type].includes(ext)) {
      return type;
    }
  }
  
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get task details to check permissions and requirements
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*, task_media(*)')
      .eq('id', params.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const fileType = getFileType(file.type, file.name);
    if (!fileType) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Check if file type is allowed for this task
    if (task.allowed_media_types && !task.allowed_media_types.includes(fileType)) {
      return NextResponse.json({ 
        error: `File type ${fileType} not allowed. Allowed types: ${task.allowed_media_types.join(', ')}` 
      }, { status: 400 });
    }

    // Check file size
    const maxSize = task.max_file_size_mb 
      ? task.max_file_size_mb * 1024 * 1024 
      : MAX_FILE_SIZES[fileType];
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Check file count limit
    const existingFiles = task.task_media?.filter((m: any) => m.is_active) || [];
    if (task.max_files_count && existingFiles.length >= task.max_files_count) {
      return NextResponse.json({ 
        error: `Maximum number of files (${task.max_files_count}) reached` 
      }, { status: 400 });
    }

    // Generate secure filename
    const timestamp = Date.now();
    const hash = createHash('md5')
      .update(file.name + timestamp + user.id)
      .digest('hex')
      .slice(0, 8);
    const ext = path.extname(file.name);
    const safeFileName = `${user.id}_${timestamp}_${hash}${ext}`;
    
    // Create directory structure
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join(
      process.cwd(), 
      'public', 
      'uploads', 
      'tasks', 
      String(year), 
      month, 
      params.id
    );
    
    await mkdir(uploadDir, { recursive: true });
    
    // Save file
    const filePath = path.join(uploadDir, safeFileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Save reference to database
    const relativePath = `/uploads/tasks/${year}/${month}/${params.id}/${safeFileName}`;
    
    const { data: mediaEntry, error: dbError } = await supabase
      .from('task_media')
      .insert({
        task_id: params.id,
        user_id: user.id,
        file_path: relativePath,
        file_name: file.name,
        display_name: file.name,
        file_type: fileType,
        file_size: file.size,
        mime_type: file.type,
        metadata: {
          original_name: file.name,
          upload_timestamp: timestamp,
          year,
          month
        }
      })
      .select()
      .single();

    if (dbError) {
      // If database save fails, try to delete the uploaded file
      try {
        const fs = await import('fs/promises');
        await fs.unlink(filePath);
      } catch (e) {
        console.error('Failed to cleanup uploaded file:', e);
      }
      
      return NextResponse.json({ 
        error: 'Failed to save file information' 
      }, { status: 500 });
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      file: {
        id: mediaEntry.id,
        file_path: relativePath,
        file_name: file.name,
        file_size: file.size,
        file_type: fileType,
        mime_type: file.type,
        upload_date: mediaEntry.upload_date
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 });
  }
}