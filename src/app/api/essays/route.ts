import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

// GET: Fetch all essays or filtered essays
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const bookIds = searchParams.get('bookIds')?.split(',') || [];
    const search = searchParams.get('search') || '';
    const isPublished = searchParams.get('published');
    
    // Build query using the view
    let query = supabase
      .from('v_essays')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (bookIds.length > 0) {
      query = query.in('book_id', bookIds);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,thesis_statement.ilike.%${search}%,book_title.ilike.%${search}%,book_author.ilike.%${search}%`);
    }
    
    if (isPublished !== null) {
      query = query.eq('is_published', isPublished === 'true');
    }
    
    const { data: essays, error } = await query;
    
    if (error) {
      console.error('Error fetching essays:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(essays || []);
  } catch (error) {
    console.error('Error in GET /api/essays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new essay with paragraphs and sentences
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Start a transaction by creating the essay first
    // Note: book_title and book_author will be auto-synced by database trigger
    const { data: essay, error: essayError } = await supabase
      .from('essay_content')
      .insert({
        content_type: 'essay',
        content_level: 1,
        content_text: body.title,
        thesis_statement: body.thesis_statement,
        book_id: body.book_id,
        // Don't need to set book_title/book_author - trigger handles it
        difficulty_level: body.difficulty_level || 'intermediate',
        is_published: body.is_published || false,
        created_by: user.id,
        metadata: body.metadata || {}
      })
      .select()
      .single();
    
    if (essayError) {
      console.error('Error creating essay:', essayError);
      return NextResponse.json({ error: essayError.message }, { status: 500 });
    }
    
    // If paragraphs are provided, create them
    if (body.paragraphs && Array.isArray(body.paragraphs)) {
      for (let pIndex = 0; pIndex < body.paragraphs.length; pIndex++) {
        const paragraph = body.paragraphs[pIndex];
        
        // Create paragraph
        const { data: paragraphData, error: paragraphError } = await supabase
          .from('essay_content')
          .insert({
            parent_id: essay.id,
            content_type: 'paragraph',
            content_level: 2,
            position_order: pIndex + 1,
            paragraph_type: paragraph.type,
            content_text: paragraph.content || '',
            metadata: paragraph.metadata || {}
          })
          .select()
          .single();
        
        if (paragraphError) {
          console.error('Error creating paragraph:', paragraphError);
          // Rollback by deleting the essay (cascade will handle children)
          await supabase.from('essay_content').delete().eq('id', essay.id);
          return NextResponse.json({ error: paragraphError.message }, { status: 500 });
        }
        
        // Create sentences for this paragraph
        if (paragraph.sentences && Array.isArray(paragraph.sentences)) {
          for (let sIndex = 0; sIndex < paragraph.sentences.length; sIndex++) {
            const sentence = paragraph.sentences[sIndex];
            
            const { error: sentenceError } = await supabase
              .from('essay_content')
              .insert({
                parent_id: paragraphData.id,
                content_type: 'sentence',
                content_level: 3,
                position_order: sIndex + 1,
                sentence_function: sentence.function || null,
                content_text: sentence.text,
                metadata: sentence.metadata || {}
              });
            
            if (sentenceError) {
              console.error('Error creating sentence:', sentenceError);
              // Rollback
              await supabase.from('essay_content').delete().eq('id', essay.id);
              return NextResponse.json({ error: sentenceError.message }, { status: 500 });
            }
          }
        }
      }
    }
    
    // Fetch the complete essay with counts
    const { data: completeEssay } = await supabase
      .from('v_essays')
      .select('*')
      .eq('id', essay.id)
      .single();
    
    return NextResponse.json(completeEssay);
  } catch (error) {
    console.error('Error in POST /api/essays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an essay
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Essay ID required' }, { status: 400 });
    }
    
    // Build update object
    const updateObject: any = {
      content_text: updateData.title,
      thesis_statement: updateData.thesis_statement,
      difficulty_level: updateData.difficulty_level,
      is_published: updateData.is_published,
      metadata: updateData.metadata,
      updated_at: new Date().toISOString()
    };
    
    // If book_id is being updated, include it (trigger will sync book_title/author)
    if (updateData.book_id !== undefined) {
      updateObject.book_id = updateData.book_id;
    }
    
    // Update the essay
    const { data, error } = await supabase
      .from('essay_content')
      .update(updateObject)
      .eq('id', id)
      .eq('content_type', 'essay')
      .select()
      .single();
    
    if (error) {
      console.error('Error updating essay:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/essays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete an essay (cascade will handle children)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Essay ID required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('essay_content')
      .delete()
      .eq('id', id)
      .eq('content_type', 'essay');
    
    if (error) {
      console.error('Error deleting essay:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/essays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}