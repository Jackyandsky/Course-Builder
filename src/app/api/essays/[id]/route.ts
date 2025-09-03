import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

// GET: Fetch a single essay with complete structure
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { id } = params;
    
    // Get the essay using the function
    const { data: essayStructure, error } = await supabase
      .rpc('get_complete_essay', { essay_id: id });
    
    if (error) {
      console.error('Error fetching essay structure:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!essayStructure || essayStructure.length === 0) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }
    
    // Organize the flat structure into hierarchical format
    const essay = essayStructure.find((item: any) => item.content_type === 'essay');
    const paragraphs = essayStructure
      .filter((item: any) => item.content_type === 'paragraph')
      .sort((a: any, b: any) => a.position_order - b.position_order);
    
    // Attach sentences to paragraphs
    const structuredParagraphs = paragraphs.map((paragraph: any) => {
      const sentences = essayStructure
        .filter((item: any) => 
          item.content_type === 'sentence' && 
          item.parent_id === paragraph.id
        )
        .sort((a: any, b: any) => a.position_order - b.position_order)
        .map((sentence: any) => ({
          id: sentence.id,
          function: sentence.sentence_function,
          text: sentence.content_text,
          position_order: sentence.position_order
        }));
      
      return {
        id: paragraph.id,
        type: paragraph.paragraph_type,
        position_order: paragraph.position_order,
        sentences
      };
    });
    
    // Calculate word count from all sentences if not stored
    let wordCount = essay.word_count || 0;
    if (!wordCount) {
      // Calculate from sentences
      wordCount = essayStructure
        .filter((item: any) => item.content_type === 'sentence')
        .reduce((total: number, sentence: any) => {
          const text = sentence.content_text || '';
          const words = text.trim().split(/\s+/).filter((word: string) => word.length > 0);
          return total + words.length;
        }, 0);
    }
    
    const result = {
      id: essay.id,
      title: essay.content_text,
      book_id: essay.book_id || '',
      book_title: essay.book_title || '',
      book_author: essay.book_author || '',
      thesis_statement: essay.thesis_statement || '',
      difficulty_level: essay.difficulty_level || 'intermediate',
      is_published: essay.is_published || false,
      word_count: wordCount,
      created_at: essay.created_at || new Date().toISOString(),
      updated_at: essay.updated_at || new Date().toISOString(),
      paragraphs: structuredParagraphs
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/essays/[id]:', error);
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
    const { id } = params;
    const body = await request.json();
    
    // Toggle publish status
    const { data, error } = await supabase
      .from('essay_content')
      .update({
        is_published: body.is_published,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('content_type', 'essay')
      .select()
      .single();
    
    if (error) {
      console.error('Error updating essay status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/essays/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}