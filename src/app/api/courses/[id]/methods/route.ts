import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// GET course methods
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Fetch course methods with method details
    const { data, error } = await supabase
      .from('course_methods')
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
      .eq('course_id', params.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching course methods:', error);
      return NextResponse.json({ error: 'Failed to fetch course methods' }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/courses/[id]/methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add method to course
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
    const { methodIds } = body;

    if (!methodIds || !Array.isArray(methodIds)) {
      return NextResponse.json({ error: 'Method IDs array is required' }, { status: 400 });
    }

    // Get the current max position
    const { data: existingMethods } = await supabase
      .from('course_methods')
      .select('position')
      .eq('course_id', params.id)
      .order('position', { ascending: false })
      .limit(1);

    const startPosition = existingMethods && existingMethods.length > 0 
      ? (existingMethods[0].position || 0) + 1 
      : 0;

    // Add methods to course
    const inserts = methodIds.map((methodId: string, index: number) => ({
      course_id: params.id,
      method_id: methodId,
      position: startPosition + index
    }));

    const { data, error } = await supabase
      .from('course_methods')
      .insert(inserts)
      .select();

    if (error) {
      console.error('Error adding methods to course:', error);
      return NextResponse.json({ error: 'Failed to add methods to course' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/courses/[id]/methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove method from course
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
    const methodId = searchParams.get('methodId');

    if (!methodId) {
      return NextResponse.json({ error: 'Method ID is required' }, { status: 400 });
    }

    // Remove method from course
    const { error } = await supabase
      .from('course_methods')
      .delete()
      .match({ course_id: params.id, method_id: methodId });

    if (error) {
      console.error('Error removing method from course:', error);
      return NextResponse.json({ error: 'Failed to remove method from course' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/courses/[id]/methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update method position in course
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
        .from('course_methods')
        .update({ position })
        .match({ course_id: params.id, method_id: methodId })
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
    console.error('Error in PUT /api/courses/[id]/methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}