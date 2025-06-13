import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Vocabulary, VocabularyGroup, VocabularyGroupItem, DifficultyLevel } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

const supabase = createClientComponentClient();

export interface VocabularyFilters {
  search?: string;
  difficulty?: DifficultyLevel;
  partOfSpeech?: string;
  tags?: string[];
  groupId?: string;
}

export interface VocabularyGroupFilters {
  search?: string;
  difficulty?: DifficultyLevel;
  language?: string;
  targetLanguage?: string;
  categoryId?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface CreateVocabularyData {
  word: string;
  translation?: string;
  pronunciation?: string;
  part_of_speech?: string;
  definition?: string;
  example_sentence?: string;
  example_translation?: string;
  notes?: string;
  difficulty: DifficultyLevel;
  audio_url?: string;
  image_url?: string;
  tags?: string[];
}

export interface UpdateVocabularyData extends Partial<CreateVocabularyData> {
  id: string;
}

export interface CreateVocabularyGroupData {
  name: string;
  description?: string;
  category_id?: string;
  language: string;
  target_language?: string;
  difficulty: DifficultyLevel;
  tags?: string[];
  is_public?: boolean;
}

export interface UpdateVocabularyGroupData extends Partial<CreateVocabularyGroupData> {
  id: string;
}

export const vocabularyService = {
  // ==================== VOCABULARY ITEMS ====================
  
  // Get all vocabulary items with optional filters
  async getVocabulary(filters: VocabularyFilters = {}) {
    let query = supabase
      .from('vocabulary')
      .select('*')
      .order('word', { ascending: true });

    // Apply filters
    if (filters.search) {
      query = query.or(`word.ilike.%${filters.search}%,translation.ilike.%${filters.search}%,definition.ilike.%${filters.search}%`);
    }
    
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    
    if (filters.partOfSpeech) {
      query = query.eq('part_of_speech', filters.partOfSpeech);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Vocabulary[];
  },

  // Get vocabulary items in a specific group
  async getVocabularyInGroup(groupId: string) {
    const { data, error } = await supabase
      .from('vocabulary_group_items')
      .select(`
        *,
        vocabulary(*)
      `)
      .eq('vocabulary_group_id', groupId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data as (VocabularyGroupItem & { vocabulary: Vocabulary })[];
  },

  // Get single vocabulary item by ID
  async getVocabularyItem(id: string) {
    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Vocabulary;
  },

  // Create new vocabulary item
  async createVocabulary(vocabularyData: CreateVocabularyData) {
    const dataWithDefaults = {
      ...vocabularyData,
      difficulty: vocabularyData.difficulty || 'beginner' as DifficultyLevel,
      user_id: SHARED_USER_ID,
    };

    const { data, error } = await supabase
      .from('vocabulary')
      .insert(dataWithDefaults)
      .select()
      .single();
    
    if (error) throw error;
    return data as Vocabulary;
  },

  // Update vocabulary item
  async updateVocabulary({ id, ...vocabularyData }: UpdateVocabularyData) {
    const { data, error } = await supabase
      .from('vocabulary')
      .update({
        ...vocabularyData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Vocabulary;
  },

  // Delete vocabulary item
  async deleteVocabulary(id: string) {
    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ==================== VOCABULARY GROUPS ====================
  
  // Get all vocabulary groups with optional filters
  async getVocabularyGroups(filters: VocabularyGroupFilters = {}) {
    let query = supabase
      .from('vocabulary_groups')
      .select(`
        *,
        category:categories(id, name, color, icon),
        vocabulary_group_items(count),
        vocabulary_group_books(
          book:books(
            id,
            title,
            author,
            cover_image_url
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    
    if (filters.language) {
      query = query.eq('language', filters.language);
    }
    
    if (filters.targetLanguage) {
      query = query.eq('target_language', filters.targetLanguage);
    }
    
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    if (filters.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Add vocabulary count to each group
    const groupsWithCount = data?.map(group => ({
      ...group,
      vocabulary_count: group.vocabulary_group_items?.[0]?.count || 0
    })) || [];
    
    return groupsWithCount as (VocabularyGroup & { vocabulary_count: number })[];
  },

  // Get single vocabulary group by ID
  async getVocabularyGroup(id: string) {
    const { data, error } = await supabase
      .from('vocabulary_groups')
      .select(`
        *,
        category:categories(id, name, color, icon),
        vocabulary_group_items(
          *,
          vocabulary(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as VocabularyGroup & { vocabulary_group_items: (VocabularyGroupItem & { vocabulary: Vocabulary })[] };
  },

  // Create new vocabulary group
  async createVocabularyGroup(groupData: CreateVocabularyGroupData) {
    const dataWithDefaults = {
      ...groupData,
      language: groupData.language || 'en',
      difficulty: groupData.difficulty || 'beginner' as DifficultyLevel,
      is_public: groupData.is_public || false,
      user_id: SHARED_USER_ID,
    };

    const { data, error } = await supabase
      .from('vocabulary_groups')
      .insert(dataWithDefaults)
      .select()
      .single();
    
    if (error) throw error;
    return data as VocabularyGroup;
  },

  // Update vocabulary group
  async updateVocabularyGroup({ id, ...groupData }: UpdateVocabularyGroupData) {
    const { data, error } = await supabase
      .from('vocabulary_groups')
      .update({
        ...groupData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as VocabularyGroup;
  },

  // Delete vocabulary group
  async deleteVocabularyGroup(id: string) {
    const { error } = await supabase
      .from('vocabulary_groups')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ==================== GROUP MEMBERSHIP ====================
  
  // Add vocabulary item to group
  async addVocabularyToGroup(vocabularyId: string, groupId: string, position?: number) {
    // Get current max position if not provided
    if (position === undefined) {
      const { data: items } = await supabase
        .from('vocabulary_group_items')
        .select('position')
        .eq('vocabulary_group_id', groupId)
        .order('position', { ascending: false })
        .limit(1);
      
      position = items && items.length > 0 ? items[0].position + 1 : 0;
    }

    const { data, error } = await supabase
      .from('vocabulary_group_items')
      .insert({
        vocabulary_group_id: groupId,
        vocabulary_id: vocabularyId,
        position: position,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as VocabularyGroupItem;
  },

  // Remove vocabulary item from group
  async removeVocabularyFromGroup(vocabularyId: string, groupId: string) {
    const { error } = await supabase
      .from('vocabulary_group_items')
      .delete()
      .eq('vocabulary_group_id', groupId)
      .eq('vocabulary_id', vocabularyId);
    
    if (error) throw error;
  },

  // Update vocabulary position in group
  async updateVocabularyPosition(vocabularyId: string, groupId: string, newPosition: number) {
    const { data, error } = await supabase
      .from('vocabulary_group_items')
      .update({ position: newPosition })
      .eq('vocabulary_group_id', groupId)
      .eq('vocabulary_id', vocabularyId)
      .select()
      .single();
    
    if (error) throw error;
    return data as VocabularyGroupItem;
  },

  // ==================== STATISTICS ====================
  
  // Get vocabulary statistics
  async getVocabularyStats() {
    const [vocabularyData, groupsData] = await Promise.all([
      supabase
        .from('vocabulary')
        .select('difficulty', { count: 'exact' })
        .eq('user_id', SHARED_USER_ID),
      supabase
        .from('vocabulary_groups')
        .select('difficulty', { count: 'exact' })
        .eq('user_id', SHARED_USER_ID),
    ]);
    
    if (vocabularyData.error) throw vocabularyData.error;
    if (groupsData.error) throw groupsData.error;

    const vocabularyStats = {
      total: vocabularyData.data?.length || 0,
      beginner: vocabularyData.data?.filter(v => v.difficulty === 'beginner').length || 0,
      intermediate: vocabularyData.data?.filter(v => v.difficulty === 'intermediate').length || 0,
      advanced: vocabularyData.data?.filter(v => v.difficulty === 'advanced').length || 0,
      expert: vocabularyData.data?.filter(v => v.difficulty === 'expert').length || 0,
    };

    const groupStats = {
      total: groupsData.data?.length || 0,
      beginner: groupsData.data?.filter(g => g.difficulty === 'beginner').length || 0,
      intermediate: groupsData.data?.filter(g => g.difficulty === 'intermediate').length || 0,
      advanced: groupsData.data?.filter(g => g.difficulty === 'advanced').length || 0,
      expert: groupsData.data?.filter(g => g.difficulty === 'expert').length || 0,
    };

    return { vocabulary: vocabularyStats, groups: groupStats };
  },

  // Get unique part of speech values
  async getPartsOfSpeech() {
    const { data, error } = await supabase
      .from('vocabulary')
      .select('part_of_speech')
      .eq('user_id', SHARED_USER_ID)
      .not('part_of_speech', 'is', null);
    
    if (error) throw error;

    // Extract unique parts of speech
    const partsOfSpeechSet = new Set(data?.map(vocab => vocab.part_of_speech).filter(Boolean));
    const partsOfSpeech = Array.from(partsOfSpeechSet).sort();
    return partsOfSpeech;
  },

  // Get unique languages used in vocabulary groups
  async getLanguages() {
    const { data, error } = await supabase
      .from('vocabulary_groups')
      .select('language, target_language')
      .eq('user_id', SHARED_USER_ID);
    
    if (error) throw error;

    // Extract unique languages
    const languages = new Set<string>();
    data?.forEach(group => {
      if (group.language) languages.add(group.language);
      if (group.target_language) languages.add(group.target_language);
    });

    return Array.from(languages).sort();
  },

  // Get difficulty level options
  getDifficultyLevels(): { value: DifficultyLevel; label: string; color: string }[] {
    return [
      { value: 'beginner', label: 'Beginner', color: 'green' },
      { value: 'intermediate', label: 'Intermediate', color: 'yellow' },
      { value: 'advanced', label: 'Advanced', color: 'orange' },
      { value: 'expert', label: 'Expert', color: 'red' },
    ];
  },

  // Get common parts of speech options
  getPartsOfSpeechOptions(): { value: string; label: string }[] {
    return [
      { value: 'noun', label: 'Noun' },
      { value: 'verb', label: 'Verb' },
      { value: 'adjective', label: 'Adjective' },
      { value: 'adverb', label: 'Adverb' },
      { value: 'pronoun', label: 'Pronoun' },
      { value: 'preposition', label: 'Preposition' },
      { value: 'conjunction', label: 'Conjunction' },
      { value: 'interjection', label: 'Interjection' },
      { value: 'article', label: 'Article' },
    ];
  },
};
