import { createSupabaseClient } from '@/lib/supabase';
import { Vocabulary, VocabularyGroup, VocabularyGroupItem, DifficultyLevel } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

const getSupabase = () => createSupabaseClient();
const supabase = getSupabase();

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
    try {
      const params = new URLSearchParams();
      params.append('viewType', 'individual');
      
      if (filters.search) params.append('search', filters.search);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.partOfSpeech) params.append('partOfSpeech', filters.partOfSpeech);
      if (filters.groupId) params.append('groupId', filters.groupId);
      
      const response = await fetch(`/api/admin/vocabulary?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vocabulary');
      }
      
      const { data } = await response.json();
      return data.vocabulary || [];
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error);
      return [];
    }
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
    try {
      const params = new URLSearchParams();
      params.append('viewType', 'groups');
      
      if (filters.search) params.append('search', filters.search);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.language) params.append('language', filters.language);
      if (filters.targetLanguage) params.append('targetLanguage', filters.targetLanguage);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());
      
      const response = await fetch(`/api/admin/vocabulary?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vocabulary groups');
      }
      
      const { data } = await response.json();
      return data.vocabularyGroups || [];
    } catch (error) {
      console.error('Failed to fetch vocabulary groups:', error);
      return [];
    }
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
    try {
      const response = await fetch('/api/admin/vocabulary?operation=stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vocabulary stats');
      }
      
      const stats = await response.json();
      return stats;
    } catch (error) {
      console.error('Failed to fetch vocabulary stats:', error);
      return {
        vocabulary: { total: 0, basic: 0, standard: 0, premium: 0 },
        groups: { total: 0, basic: 0, standard: 0, premium: 0 }
      };
    }
  },

  // Get unique part of speech values
  async getPartsOfSpeech() {
    try {
      const response = await fetch('/api/admin/vocabulary?viewType=individual', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch parts of speech');
      }
      
      const { data } = await response.json();
      return data.partsOfSpeech || [];
    } catch (error) {
      console.error('Failed to fetch parts of speech:', error);
      return [];
    }
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
      { value: 'basic', label: 'Basic', color: 'green' },
      { value: 'standard', label: 'Standard', color: 'yellow' },
      { value: 'premium', label: 'Premium', color: 'purple' },
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
