import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// GET course objectives
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Fetch course objectives with objective details
    const { data, error } = await supabase
      .from('course_objectives')
      .select(`
        id,
        position,
        objective:objectives (
          id,
          title,
          description,
          bloom_level,
          measurable,
          tags,
          is_template,
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
      console.error('Error fetching course objectives:', error);
      return NextResponse.json({ error: 'Failed to fetch course objectives' }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/courses/[id]/objectives:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add objective to course
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
    const { objectiveIds } = body;

    if (!objectiveIds || !Array.isArray(objectiveIds)) {
      return NextResponse.json({ error: 'Objective IDs array is required' }, { status: 400 });
    }

    // Get the current max position
    const { data: existingObjectives } = await supabase
      .from('course_objectives')
      .select('position')
      .eq('course_id', params.id)
      .order('position', { ascending: false })
      .limit(1);

    const startPosition = existingObjectives && existingObjectives.length > 0 
      ? (existingObjectives[0].position || 0) + 1 
      : 0;

    // Add objectives to course
    const inserts = objectiveIds.map((objectiveId: string, index: number) => ({
      course_id: params.id,
      objective_id: objectiveId,
      position: startPosition + index
    }));

    const { data, error } = await supabase
      .from('course_objectives')
      .insert(inserts)
      .select();

    if (error) {
      console.error('Error adding objectives to course:', error);
      return NextResponse.json({ error: 'Failed to add objectives to course' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/courses/[id]/objectives:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove objective from course
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
    const objectiveId = searchParams.get('objectiveId');

    if (!objectiveId) {
      return NextResponse.json({ error: 'Objective ID is required' }, { status: 400 });
    }

    // Remove objective from course
    const { error } = await supabase
      .from('course_objectives')
      .delete()
      .match({ course_id: params.id, objective_id: objectiveId });

    if (error) {
      console.error('Error removing objective from course:', error);
      return NextResponse.json({ error: 'Failed to remove objective from course' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/courses/[id]/objectives:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update objective position in course
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
    const { objectiveOrders } = body;

    if (!objectiveOrders || !Array.isArray(objectiveOrders)) {
      return NextResponse.json({ error: 'Objective orders array is required' }, { status: 400 });
    }

    // Update positions
    const updates = objectiveOrders.map(({ objectiveId, position }: any) =>
      supabase
        .from('course_objectives')
        .update({ position })
        .match({ course_id: params.id, objective_id: objectiveId })
    );

    const results = await Promise.all(updates);
    
    // Check if any update failed
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error updating objective positions:', errors);
      return NextResponse.json({ error: 'Failed to update objective positions' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/courses/[id]/objectives:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}