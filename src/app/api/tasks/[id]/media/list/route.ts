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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or task owner
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    // Get task media
    let query = supabase
      .from('task_media')
      .select('*')
      .eq('task_id', params.id)
      .eq('is_active', true)
      .order('upload_date', { ascending: false });

    // If not admin, only show user's own uploads
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: media, error } = await query;

    if (error) {
      console.error('Error fetching task media:', error);
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
    }

    return NextResponse.json({ media: media || [] });

  } catch (error) {
    console.error('Error in media list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}