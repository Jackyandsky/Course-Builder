import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { vocabularyService } from '@/lib/supabase/vocabulary';
import { categoryService } from '@/lib/supabase/categories';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const partOfSpeech = searchParams.get('partOfSpeech') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const groupId = searchParams.get('groupId') || '';
    const viewType = searchParams.get('viewType') || 'individual'; // 'individual' or 'groups'
    const operation = searchParams.get('operation');

    // Add timeout to prevent indefinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // Handle stats operation
      if (operation === 'stats') {
        const { data: vocabularyData } = await supabase
          .from('vocabulary')
          .select('difficulty');
        
        const { data: groupsData } = await supabase
          .from('vocabulary_groups')
          .select('difficulty');
        
        const vocabStats = {
          total: vocabularyData?.length || 0,
          basic: vocabularyData?.filter(v => v.difficulty === 'basic').length || 0,
          standard: vocabularyData?.filter(v => v.difficulty === 'standard').length || 0,
          premium: vocabularyData?.filter(v => v.difficulty === 'premium').length || 0,
        };
        
        const groupStats = {
          total: groupsData?.length || 0,
          basic: groupsData?.filter(g => g.difficulty === 'basic').length || 0,
          standard: groupsData?.filter(g => g.difficulty === 'standard').length || 0,
          premium: groupsData?.filter(g => g.difficulty === 'premium').length || 0,
        };
        
        clearTimeout(timeoutId);
        return NextResponse.json({
          vocabulary: vocabStats,
          groups: groupStats
        });
      }

      if (viewType === 'groups') {
        // Load vocabulary groups directly
        let query = supabase
          .from('vocabulary_groups')
          .select(`
            *,
            vocabulary_group_items(vocabulary_id)
          `)
          .order('name', { ascending: true });

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }
        if (difficulty) {
          query = query.eq('difficulty', difficulty);
        }
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        const { data: vocabularyGroups, error: groupsError } = await query;
        
        if (groupsError) throw groupsError;

        // Add vocabulary_count to each group
        const groupsWithCount = (vocabularyGroups || []).map(group => ({
          ...group,
          vocabulary_count: group.vocabulary_group_items?.length || 0
        }));

        // Get categories
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('type', 'vocabulary');

        clearTimeout(timeoutId);
        return NextResponse.json({
          success: true,
          data: {
            vocabularyGroups: groupsWithCount,
            categories: categories || [],
            languages: [],
            viewType: 'groups'
          }
        });
        
      } else {
        // Load individual vocabulary items
        let query = supabase
          .from('vocabulary')
          .select('*')
          .order('word', { ascending: true });

        if (search) {
          query = query.or(`word.ilike.%${search}%,translation.ilike.%${search}%`);
        }
        if (difficulty) {
          query = query.eq('difficulty', difficulty);
        }
        if (partOfSpeech) {
          query = query.eq('part_of_speech', partOfSpeech);
        }
        if (groupId) {
          // Need to join with vocabulary_group_items
          const { data: groupItems } = await supabase
            .from('vocabulary_group_items')
            .select('vocabulary_id')
            .eq('group_id', groupId);
          
          if (groupItems && groupItems.length > 0) {
            const vocabIds = groupItems.map(item => item.vocabulary_id);
            query = query.in('id', vocabIds);
          }
        }

        const { data: vocabulary, error: vocabError } = await query;
        
        if (vocabError) throw vocabError;

        // Get categories
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('type', 'vocabulary');

        // Get unique parts of speech
        const { data: partsData } = await supabase
          .from('vocabulary')
          .select('part_of_speech')
          .not('part_of_speech', 'is', null);
        
        const partsOfSpeech = [...new Set(partsData?.map(p => p.part_of_speech) || [])];

        // Get unique languages (hardcoded for now as they're not in DB)
        const languages = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko'];

        clearTimeout(timeoutId);
        return NextResponse.json({
          success: true,
          data: {
            vocabulary: vocabulary || [],
            categories: categories || [],
            partsOfSpeech,
            languages,
            viewType: 'individual'
          }
        });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Vocabulary API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}