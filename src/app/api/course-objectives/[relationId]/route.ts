import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// DELETE - Remove course-objective relation by relation ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { relationId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove by relation ID
    const { error } = await supabase
      .from('course_objectives')
      .delete()
      .eq('id', params.relationId);

    if (error) {
      console.error('Error removing objective from course:', error);
      return NextResponse.json({ error: 'Failed to remove objective from course' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/course-objectives/[relationId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}