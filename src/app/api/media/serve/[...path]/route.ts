import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { readFile } from 'fs/promises';
import path from 'path';

const MIME_TYPE_MAP: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  
  // Videos
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  
  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed'
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPE_MAP[ext] || 'application/octet-stream';
}

function extractTaskId(filePath: string): string | null {
  // Path format: /uploads/tasks/YYYY/MM/task_id/filename
  const parts = filePath.split('/');
  if (parts.length >= 5 && parts[0] === 'uploads' && parts[1] === 'tasks') {
    return parts[4]; // task_id is at index 4
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the file path
    const requestedPath = params.path.join('/');
    
    // Security check: prevent directory traversal
    if (requestedPath.includes('..') || requestedPath.includes('~')) {
      return new NextResponse('Invalid path', { status: 400 });
    }
    
    // Check authentication
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    // For public access (if needed in future), you can modify this
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Extract task ID from path
    const taskId = extractTaskId(requestedPath);
    if (!taskId) {
      return new NextResponse('Invalid file path', { status: 400 });
    }

    // Check if user has access to this task's files
    // First check if media entry exists and is active
    const { data: mediaEntry } = await supabase
      .from('task_media')
      .select('*, tasks!inner(*)')
      .eq('file_path', `/uploads/tasks/${requestedPath}`)
      .eq('is_active', true)
      .single();

    if (!mediaEntry) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Check permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';
    const isOwner = mediaEntry.user_id === user.id;
    
    // For now, allow access if user is admin, owner, or has access to the task
    // You can make this more restrictive based on your needs
    if (!isAdmin && !isOwner) {
      // Check if user has any relationship with the task (e.g., enrolled in course)
      // This is a simplified check - expand based on your business logic
      const { data: hasAccess } = await supabase
        .from('user_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .single();
      
      if (!hasAccess) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    // Construct full file path
    const fullPath = path.join(process.cwd(), 'public', 'uploads', 'tasks', requestedPath);
    
    try {
      // Read and serve the file
      const file = await readFile(fullPath);
      const mimeType = getMimeType(fullPath);
      
      // Set appropriate headers
      const headers = new Headers({
        'Content-Type': mimeType,
        'Content-Length': file.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      });
      
      // Add content-disposition for downloads (documents)
      if (mimeType.startsWith('application/') || mimeType === 'text/csv') {
        headers.set('Content-Disposition', `attachment; filename="${path.basename(fullPath)}"`);
      } else {
        headers.set('Content-Disposition', `inline; filename="${path.basename(fullPath)}"`);
      }
      
      return new NextResponse(file, { headers });
      
    } catch (error) {
      console.error('Error reading file:', error);
      return new NextResponse('File not found', { status: 404 });
    }
    
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}