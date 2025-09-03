import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[LessonStats] Getting lesson statistics');
    const startTime = Date.now();

    // Get lesson counts by status
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, status');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    const endTime = Date.now();
    
    // Calculate statistics
    const stats = {
      total: lessons?.length || 0,
      scheduled: lessons?.filter(l => l.status === 'scheduled').length || 0,
      completed: lessons?.filter(l => l.status === 'completed').length || 0,
      draft: lessons?.filter(l => l.status === 'draft').length || 0,
      cancelled: lessons?.filter(l => l.status === 'cancelled').length || 0,
    };

    console.log(`[LessonStats] Calculated stats in ${endTime - startTime}ms:`, stats);

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error in GET /api/lessons/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}