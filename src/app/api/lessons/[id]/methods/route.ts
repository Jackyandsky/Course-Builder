import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// GET lesson methods
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Fetch lesson methods with method details
    const { data, error } = await supabase
      .from('lesson_methods')
      .select(`
        id,
        position,
        method:methods (
          id,
          name,
          description,
          tags,
          category:categories (
            id,
            name,
            color,
            icon
          )
        )
      `)
      .eq('lesson_id', params.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching lesson methods:', error);
      return NextResponse.json({ error: 'Failed to fetch lesson methods' }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/lessons/[id]/methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add method to lesson
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
    const { methodId, position } = body;

    if (!methodId) {
      return NextResponse.json({ error: 'Method ID is required' }, { status: 400 });
    }

    // Get the current max position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
      const { data: existingMethods } = await supabase
        .from('lesson_methods')
        .select('position')
        .eq('lesson_id', params.id)
        .order('position', { ascending: false })
        .limit(1);

      finalPosition = existingMethods && existingMethods.length > 0 
        ? (existingMethods[0].position || 0) + 1 
        : 0;
    }

    // Add method to lesson
    const { data, error } = await supabase
      .from('lesson_methods')
      .insert({
        lesson_id: params.id,
        method_id: methodId,
        position: finalPosition
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding method to lesson:', error);
      return NextResponse.json({ error: 'Failed to add method to lesson' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/lessons/[id]/methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove method from lesson  
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
    const relationId = searchParams.get('relationId');

    if (!relationId) {
      return NextResponse.json({ error: 'Relation ID is required' }, { status: 400 });
    }

    // Remove method from lesson by relation ID
    const { error } = await supabase
      .from('lesson_methods')
      .delete()
      .eq('id', relationId);

    if (error) {
      console.error('Error removing method from lesson:', error);
      return NextResponse.json({ error: 'Failed to remove method from lesson' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/lessons/[id]/methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update method position in lesson
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
    const { methodOrders } = body;

    if (!methodOrders || !Array.isArray(methodOrders)) {
      return NextResponse.json({ error: 'Method orders array is required' }, { status: 400 });
    }

    // Update positions
    const updates = methodOrders.map(({ methodId, position }: any) =>
      supabase
        .from('lesson_methods')
        .update({ position })
        .match({ lesson_id: params.id, method_id: methodId })
    );

    const results = await Promise.all(updates);
    
    // Check if any update failed
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error updating method positions:', errors);
      return NextResponse.json({ error: 'Failed to update method positions' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/lessons/[id]/methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}