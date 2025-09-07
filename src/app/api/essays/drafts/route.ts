import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

// GET: Fetch user's drafts
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    
    // Fetch user's drafts from essay_content
    let query = supabase
      .from('essay_content')
      .select(`
        id,
        content_text,
        created_at,
        updated_at,
        is_published,
        metadata
      `)
      .eq('content_type', 'essay')
      .eq('created_by', user.id)
      .eq('draft_type', 'draft')
      .order('updated_at', { ascending: false });
    
    // Apply search filter
    if (search) {
      query = query.ilike('content_text', `%${search}%`);
    }
    
    const { data: drafts, error } = await query;
    
    if (error) {
      console.error('Error fetching drafts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(drafts || []);
  } catch (error) {
    console.error('Error in GET /api/essays/drafts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new draft
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate required fields
    if (!body.title || !body.essayParts) {
      return NextResponse.json({ error: 'Title and essay parts required' }, { status: 400 });
    }
    
    // Create the main draft essay record
    const { data: essay, error: essayError } = await supabase
      .from('essay_content')
      .insert({
        content_type: 'essay',
        content_level: 1,
        content_text: body.title,
        draft_type: 'draft',
        is_published: body.is_published || false,
        created_by: user.id,
        metadata: {
          selectedEssayTitle: body.selectedEssayTitle || '',
          ...body.metadata
        }
      })
      .select()
      .single();
    
    if (essayError) {
      console.error('Error creating draft essay:', essayError);
      return NextResponse.json({ error: essayError.message }, { status: 500 });
    }
    
    // Create paragraphs from essayParts
    if (body.essayParts && Array.isArray(body.essayParts)) {
      for (let pIndex = 0; pIndex < body.essayParts.length; pIndex++) {
        const part = body.essayParts[pIndex];
        
        // Create paragraph
        const { data: paragraphData, error: paragraphError } = await supabase
          .from('essay_content')
          .insert({
            parent_id: essay.id,
            content_type: 'paragraph',
            content_level: 2,
            position_order: pIndex + 1,
            paragraph_type: part.type,
            content_text: part.generated || '',
            metadata: {
              label: part.label,
              isComplete: part.isComplete,
              isEditing: part.isEditing
            }
          })
          .select()
          .single();
        
        if (paragraphError) {
          console.error('Error creating paragraph:', paragraphError);
          await supabase.from('essay_content').delete().eq('id', essay.id);
          return NextResponse.json({ error: paragraphError.message }, { status: 500 });
        }
        
        // Create sentences for this paragraph
        if (part.sentences) {
          const sentenceKeys = Object.keys(part.sentences);
          for (let sIndex = 0; sIndex < sentenceKeys.length; sIndex++) {
            const sentenceKey = sentenceKeys[sIndex];
            const sentenceText = part.sentences[sentenceKey];
            
            if (sentenceText && sentenceText.trim()) {
              const { error: sentenceError } = await supabase
                .from('essay_content')
                .insert({
                  parent_id: paragraphData.id,
                  content_type: 'sentence',
                  content_level: 3,
                  position_order: sIndex + 1,
                  content_text: sentenceText,
                  metadata: {
                    sentenceKey: sentenceKey,
                    sentenceNumber: sIndex + 1
                  }
                });
              
              if (sentenceError) {
                console.error('Error creating sentence:', sentenceError);
                await supabase.from('essay_content').delete().eq('id', essay.id);
                return NextResponse.json({ error: sentenceError.message }, { status: 500 });
              }
            }
          }
        }
      }
    }
    
    // Return the created draft with metadata
    const draftResponse = {
      id: essay.id,
      title: essay.content_text,
      timestamp: essay.created_at,
      is_published: essay.is_published,
      selectedEssayTitle: essay.metadata?.selectedEssayTitle || '',
      essayParts: body.essayParts
    };
    
    return NextResponse.json(draftResponse);
  } catch (error) {
    console.error('Error in POST /api/essays/drafts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an existing draft
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id, title, essayParts, selectedEssayTitle, is_published } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }
    
    // Verify ownership
    const { data: existingDraft } = await supabase
      .from('essay_content')
      .select('id')
      .eq('id', id)
      .eq('created_by', user.id)
      .eq('content_type', 'essay')
      .eq('draft_type', 'draft')
      .single();
    
    if (!existingDraft) {
      return NextResponse.json({ error: 'Draft not found or not owned by user' }, { status: 404 });
    }
    
    // Update the main draft record
    const { error: updateError } = await supabase
      .from('essay_content')
      .update({
        content_text: title,
        is_published: is_published,
        metadata: {
          selectedEssayTitle: selectedEssayTitle || '',
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('Error updating draft:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // Delete existing paragraphs and sentences to recreate them
    await supabase
      .from('essay_content')
      .delete()
      .eq('parent_id', id);
    
    // Recreate paragraphs and sentences
    if (essayParts && Array.isArray(essayParts)) {
      for (let pIndex = 0; pIndex < essayParts.length; pIndex++) {
        const part = essayParts[pIndex];
        
        // Create paragraph
        const { data: paragraphData, error: paragraphError } = await supabase
          .from('essay_content')
          .insert({
            parent_id: id,
            content_type: 'paragraph',
            content_level: 2,
            position_order: pIndex + 1,
            paragraph_type: part.type,
            content_text: part.generated || '',
            metadata: {
              label: part.label,
              isComplete: part.isComplete,
              isEditing: part.isEditing
            }
          })
          .select()
          .single();
        
        if (paragraphError) {
          console.error('Error creating paragraph:', paragraphError);
          return NextResponse.json({ error: paragraphError.message }, { status: 500 });
        }
        
        // Create sentences
        if (part.sentences) {
          const sentenceKeys = Object.keys(part.sentences);
          for (let sIndex = 0; sIndex < sentenceKeys.length; sIndex++) {
            const sentenceKey = sentenceKeys[sIndex];
            const sentenceText = part.sentences[sentenceKey];
            
            if (sentenceText && sentenceText.trim()) {
              const { error: sentenceError } = await supabase
                .from('essay_content')
                .insert({
                  parent_id: paragraphData.id,
                  content_type: 'sentence',
                  content_level: 3,
                  position_order: sIndex + 1,
                  content_text: sentenceText,
                  metadata: {
                    sentenceKey: sentenceKey,
                    sentenceNumber: sIndex + 1
                  }
                });
              
              if (sentenceError) {
                console.error('Error creating sentence:', sentenceError);
                return NextResponse.json({ error: sentenceError.message }, { status: 500 });
              }
            }
          }
        }
      }
    }
    
    return NextResponse.json({ success: true, id, title });
  } catch (error) {
    console.error('Error in PUT /api/essays/drafts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}