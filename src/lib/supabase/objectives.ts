import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Objective } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

const supabase = createClientComponentClient();

export interface ObjectiveFilters {
  categoryId?: string;
  bloomLevel?: string;
  measurable?: boolean;
  isTemplate?: boolean;
  search?: string;
  tags?: string[];
}

export interface CreateObjectiveData {
  title: string;
  description?: string;
  category_id?: string;
  bloom_level?: string;
  measurable?: boolean;
  tags?: string[];
  is_template?: boolean;
}

export interface UpdateObjectiveData extends Partial<CreateObjectiveData> {
  id: string;
}

export const objectiveService = {
  // Get all objectives with optional filters
  async getObjectives(filters: ObjectiveFilters = {}) {
    let query = supabase
      .from('objectives')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    if (filters.bloomLevel) {
      query = query.eq('bloom_level', filters.bloomLevel);
    }
    
    if (filters.measurable !== undefined) {
      query = query.eq('measurable', filters.measurable);
    }
    
    if (filters.isTemplate !== undefined) {
      query = query.eq('is_template', filters.isTemplate);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Objective[];
  },

  // Get single objective by ID
  async getObjective(id: string) {
    const { data, error } = await supabase
      .from('objectives')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Objective;
  },

  // Create new objective
  async createObjective(objectiveData: CreateObjectiveData) {
    const { data, error } = await supabase
      .from('objectives')
      .insert({
        ...objectiveData,
        user_id: SHARED_USER_ID,
        measurable: objectiveData.measurable ?? true,
        is_template: objectiveData.is_template ?? false,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Objective;
  },

  // Update objective
  async updateObjective({ id, ...objectiveData }: UpdateObjectiveData) {
    const { data, error } = await supabase
      .from('objectives')
      .update({
        ...objectiveData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Objective;
  },

  // Delete objective
  async deleteObjective(id: string) {
    const { error } = await supabase
      .from('objectives')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get Bloom's taxonomy levels
  getBloomLevels() {
    return [
      { value: 'remember', label: 'Remember' },
      { value: 'understand', label: 'Understand' },
      { value: 'apply', label: 'Apply' },
      { value: 'analyze', label: 'Analyze' },
      { value: 'evaluate', label: 'Evaluate' },
      { value: 'create', label: 'Create' },
    ];
  },

  // Get objectives by category
  async getObjectivesByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('objectives')
      .select('*')
      .eq('category_id', categoryId)
      .order('title', { ascending: true });
    
    if (error) throw error;
    return data as Objective[];
  },

  // Get template objectives
  async getTemplateObjectives() {
    const { data, error } = await supabase
      .from('objectives')
      .select('*')
      .eq('is_template', true)
      .order('title', { ascending: true });
    
    if (error) throw error;
    return data as Objective[];
  },

  // Clone objective as template
  async cloneAsTemplate(id: string, newTitle?: string) {
    const original = await this.getObjective(id);
    
    return this.createObjective({
      title: newTitle || `${original.title} (Template)`,
      description: original.description,
      category_id: original.category_id,
      bloom_level: original.bloom_level,
      measurable: original.measurable,
      tags: original.tags,
      is_template: true,
    });
  },

  // Get objective statistics
  async getObjectiveStats() {
    const { data, error } = await supabase
      .from('objectives')
      .select('bloom_level, is_template', { count: 'exact' });
    
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      templates: data?.filter(o => o.is_template).length || 0,
      byBloomLevel: {
        remember: data?.filter(o => o.bloom_level === 'remember').length || 0,
        understand: data?.filter(o => o.bloom_level === 'understand').length || 0,
        apply: data?.filter(o => o.bloom_level === 'apply').length || 0,
        analyze: data?.filter(o => o.bloom_level === 'analyze').length || 0,
        evaluate: data?.filter(o => o.bloom_level === 'evaluate').length || 0,
        create: data?.filter(o => o.bloom_level === 'create').length || 0,
      },
    };

    return stats;
  },
};