import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

// POST: Duplicate an essay
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { id } = params;
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the complete essay structure
    const { data: essayStructure, error: fetchError } = await supabase
      .rpc('get_complete_essay', { essay_id: id });
    
    if (fetchError) {
      console.error('Error fetching essay:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!essayStructure || essayStructure.length === 0) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }
    
    // Find the original essay
    const originalEssay = essayStructure.find((item: any) => item.content_type === 'essay');
    
    // Create a copy of the essay
    const { data: newEssay, error: essayError } = await supabase
      .from('essay_content')
      .insert({
        content_type: 'essay',
        content_level: 1,
        content_text: `${originalEssay.content_text} (Copy)`,
        thesis_statement: originalEssay.thesis_statement,
        book_id: originalEssay.book_id,
        book_title: originalEssay.book_title,
        book_author: originalEssay.book_author,
        difficulty_level: originalEssay.difficulty_level,
        is_published: false, // Copies start as drafts
        created_by: user.id,
        metadata: originalEssay.metadata || {}
      })
      .select()
      .single();
    
    if (essayError) {
      console.error('Error creating essay copy:', essayError);
      return NextResponse.json({ error: essayError.message }, { status: 500 });
    }
    
    // Copy paragraphs and sentences
    const paragraphs = essayStructure
      .filter((item: any) => item.content_type === 'paragraph')
      .sort((a: any, b: any) => a.position_order - b.position_order);
    
    for (const paragraph of paragraphs) {
      // Create paragraph copy
      const { data: newParagraph, error: paragraphError } = await supabase
        .from('essay_content')
        .insert({
          parent_id: newEssay.id,
          content_type: 'paragraph',
          content_level: 2,
          position_order: paragraph.position_order,
          paragraph_type: paragraph.paragraph_type,
          content_text: paragraph.content_text || '',
          metadata: paragraph.metadata || {}
        })
        .select()
        .single();
      
      if (paragraphError) {
        console.error('Error creating paragraph copy:', paragraphError);
        // Clean up - delete the partially created essay
        await supabase.from('essay_content').delete().eq('id', newEssay.id);
        return NextResponse.json({ error: paragraphError.message }, { status: 500 });
      }
      
      // Copy sentences for this paragraph
      const sentences = essayStructure
        .filter((item: any) => 
          item.content_type === 'sentence' && 
          item.parent_id === paragraph.id
        )
        .sort((a: any, b: any) => a.position_order - b.position_order);
      
      for (const sentence of sentences) {
        const { error: sentenceError } = await supabase
          .from('essay_content')
          .insert({
            parent_id: newParagraph.id,
            content_type: 'sentence',
            content_level: 3,
            position_order: sentence.position_order,
            sentence_function: sentence.sentence_function,
            content_text: sentence.content_text,
            metadata: sentence.metadata || {}
          });
        
        if (sentenceError) {
          console.error('Error creating sentence copy:', sentenceError);
          // Clean up
          await supabase.from('essay_content').delete().eq('id', newEssay.id);
          return NextResponse.json({ error: sentenceError.message }, { status: 500 });
        }
      }
    }
    
    // Increment reference count on original
    await supabase
      .from('essay_content')
      .update({
        reference_count: (originalEssay.reference_count || 0) + 1,
        last_referenced: new Date().toISOString()
      })
      .eq('id', id);
    
    // Return the new essay
    const { data: completeEssay } = await supabase
      .from('v_essays')
      .select('*')
      .eq('id', newEssay.id)
      .single();
    
    return NextResponse.json(completeEssay);
  } catch (error) {
    console.error('Error in POST /api/essays/[id]/duplicate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}