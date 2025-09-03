import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { unlink } from 'fs/promises';
import path from 'path';

// DELETE endpoint to remove media
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get media entry
    const { data: media, error: mediaError } = await supabase
      .from('task_media')
      .select('*')
      .eq('id', params.mediaId)
      .eq('task_id', params.id)
      .single();

    if (mediaError || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Check permissions (user owns the file or is admin)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';
    const isOwner = media.user_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete in database
    const { error: deleteError } = await supabase
      .from('task_media')
      .update({ is_active: false })
      .eq('id', params.mediaId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
    }

    // Try to delete physical file (but don't fail if it doesn't work)
    try {
      const filePath = path.join(process.cwd(), 'public', media.file_path);
      await unlink(filePath);
      
      // Also try to delete thumbnail if it exists
      if (media.thumbnail_path) {
        const thumbPath = path.join(process.cwd(), 'public', media.thumbnail_path);
        await unlink(thumbPath).catch(() => {}); // Ignore thumbnail deletion errors
      }
    } catch (error) {
      console.error('Failed to delete physical file:', error);
      // Don't fail the request if file deletion fails
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}