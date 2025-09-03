import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// GET course vocabulary groups
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Fetch course vocabulary groups with group details
    const { data, error } = await supabase
      .from('course_vocabulary_groups')
      .select(`
        id,
        position,
        vocabulary_group:vocabulary_groups (
          id,
          name,
          description,
          language,
          difficulty,
          category:categories (
            id,
            name,
            color,
            icon
          )
        )
      `)
      .eq('course_id', params.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching course vocabulary:', error);
      return NextResponse.json({ error: 'Failed to fetch course vocabulary' }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/courses/[id]/vocabulary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add vocabulary group to course
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

    const body = await request.json();
    const { vocabularyGroupId, position } = body;

    if (!vocabularyGroupId) {
      return NextResponse.json({ error: 'Vocabulary group ID is required' }, { status: 400 });
    }

    // Get the current max position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
      const { data: existingGroups } = await supabase
        .from('course_vocabulary_groups')
        .select('position')
        .eq('course_id', params.id)
        .order('position', { ascending: false })
        .limit(1);

      finalPosition = existingGroups && existingGroups.length > 0 
        ? (existingGroups[0].position || 0) + 1 
        : 0;
    }

    // Add vocabulary group to course
    const { data, error } = await supabase
      .from('course_vocabulary_groups')
      .insert({
        course_id: params.id,
        vocabulary_group_id: vocabularyGroupId,
        position: finalPosition
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding vocabulary to course:', error);
      return NextResponse.json({ error: 'Failed to add vocabulary to course' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/courses/[id]/vocabulary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove vocabulary group from course
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const vocabularyGroupId = searchParams.get('vocabularyGroupId');

    if (!vocabularyGroupId) {
      return NextResponse.json({ error: 'Vocabulary group ID is required' }, { status: 400 });
    }

    // Remove vocabulary group from course
    const { error } = await supabase
      .from('course_vocabulary_groups')
      .delete()
      .match({ course_id: params.id, vocabulary_group_id: vocabularyGroupId });

    if (error) {
      console.error('Error removing vocabulary from course:', error);
      return NextResponse.json({ error: 'Failed to remove vocabulary from course' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/courses/[id]/vocabulary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update vocabulary group position in course
export async function PUT(
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

    const body = await request.json();
    const { vocabularyGroupId, position } = body;

    if (!vocabularyGroupId) {
      return NextResponse.json({ error: 'Vocabulary group ID is required' }, { status: 400 });
    }

    // Update position
    const { data, error } = await supabase
      .from('course_vocabulary_groups')
      .update({ position })
      .match({ course_id: params.id, vocabulary_group_id: vocabularyGroupId })
      .select()
      .single();

    if (error) {
      console.error('Error updating vocabulary position:', error);
      return NextResponse.json({ error: 'Failed to update vocabulary position' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/courses/[id]/vocabulary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}