import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

// GET: Fetch a specific draft with its full content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the main draft
    const { data: draft, error: draftError } = await supabase
      .from('essay_content')
      .select('*')
      .eq('id', params.id)
      .eq('content_type', 'essay')
      .eq('created_by', user.id)
      .eq('draft_type', 'draft')
      .single();
    
    if (draftError || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    
    // Get paragraphs
    const { data: paragraphs, error: paragraphsError } = await supabase
      .from('essay_content')
      .select('*')
      .eq('parent_id', params.id)
      .eq('content_type', 'paragraph')
      .order('position_order');
    
    if (paragraphsError) {
      console.error('Error fetching paragraphs:', paragraphsError);
      return NextResponse.json({ error: paragraphsError.message }, { status: 500 });
    }
    
    // Get sentences for each paragraph
    const essayParts = [];
    
    for (const paragraph of paragraphs || []) {
      const { data: sentences, error: sentencesError } = await supabase
        .from('essay_content')
        .select('*')
        .eq('parent_id', paragraph.id)
        .eq('content_type', 'sentence')
        .order('position_order');
      
      if (sentencesError) {
        console.error('Error fetching sentences:', sentencesError);
        continue;
      }
      
      // Reconstruct sentences object
      const sentencesObj: any = {
        sentence1: '',
        sentence2: '',
        sentence3: '',
        sentence4: '',
        sentence5: ''
      };
      
      sentences?.forEach((sentence) => {
        const sentenceKey = sentence.metadata?.sentenceKey || `sentence${sentence.position_order}`;
        if (sentenceKey && sentencesObj.hasOwnProperty(sentenceKey)) {
          sentencesObj[sentenceKey] = sentence.content_text || '';
        }
      });
      
      essayParts.push({
        type: paragraph.paragraph_type,
        label: paragraph.metadata?.label || 'Paragraph',
        sentences: sentencesObj,
        generated: paragraph.content_text || '',
        isEditing: paragraph.metadata?.isEditing || false,
        isComplete: paragraph.metadata?.isComplete || false
      });
    }
    
    const response = {
      id: draft.id,
      title: draft.content_text,
      timestamp: draft.updated_at || draft.created_at,
      is_published: draft.is_published,
      selectedEssayTitle: draft.metadata?.selectedEssayTitle || '',
      essayParts
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/essays/drafts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a specific draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify ownership and delete
    const { error } = await supabase
      .from('essay_content')
      .delete()
      .eq('id', params.id)
      .eq('content_type', 'essay')
      .eq('created_by', user.id)
      .eq('draft_type', 'draft');
    
    if (error) {
      console.error('Error deleting draft:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/essays/drafts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Toggle publish status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { is_published } = body;
    
    // Update publish status
    const { data, error } = await supabase
      .from('essay_content')
      .update({
        is_published: is_published,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('content_type', 'essay')
      .eq('created_by', user.id)
      .eq('draft_type', 'draft')
      .select()
      .single();
    
    if (error) {
      console.error('Error updating publish status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, is_published: data.is_published });
  } catch (error) {
    console.error('Error in PATCH /api/essays/drafts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}