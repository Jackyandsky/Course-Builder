import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// GET single objective
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data, error } = await supabase
      .from('objectives')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .eq('id', params.id)
      .single();
    
    if (error) {
      console.error('Error fetching objective:', error);
      return NextResponse.json({ error: 'Failed to fetch objective' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/objectives/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update objective
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
    const { title, description, category_id, tags } = body;

    const { data, error } = await supabase
      .from('objectives')
      .update({
        title,
        description,
        category_id,
        tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating objective:', error);
      return NextResponse.json({ error: 'Failed to update objective' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/objectives/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE objective
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
      .from('objectives')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting objective:', error);
      return NextResponse.json({ error: 'Failed to delete objective' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/objectives/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}