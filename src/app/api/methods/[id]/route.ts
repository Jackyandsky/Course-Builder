import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// GET single method
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data, error } = await supabase
      .from('methods')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .eq('id', params.id)
      .single();
    
    if (error) {
      console.error('Error fetching method:', error);
      return NextResponse.json({ error: 'Failed to fetch method' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/methods/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update method
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
    const { name, description, category_id, tags } = body;

    const { data, error } = await supabase
      .from('methods')
      .update({
        name,
        description,
        category_id,
        tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating method:', error);
      return NextResponse.json({ error: 'Failed to update method' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/methods/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE method
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

    const { error } = await supabase
      .from('methods')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting method:', error);
      return NextResponse.json({ error: 'Failed to delete method' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/methods/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}