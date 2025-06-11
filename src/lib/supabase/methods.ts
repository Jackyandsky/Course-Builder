import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Method } from '@/types/database';

const supabase = createClientComponentClient();

export interface MethodFilters {
  categoryId?: string;
  durationMin?: number;
  durationMax?: number;
  groupSizeMin?: number;
  groupSizeMax?: number;
  isTemplate?: boolean;
  search?: string;
  tags?: string[];
}

export interface CreateMethodData {
  name: string;
  description?: string;
  category_id?: string;
  instructions?: string;
  duration_minutes?: number;
  group_size_min?: number;
  group_size_max?: number;
  materials_needed?: string[];
  tags?: string[];
  is_template?: boolean;
}

export interface UpdateMethodData extends Partial<CreateMethodData> {
  id: string;
}

export const methodService = {
  // Get all methods with optional filters
  async getMethods(filters: MethodFilters = {}) {
    let query = supabase
      .from('methods')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    if (filters.durationMin !== undefined) {
      query = query.gte('duration_minutes', filters.durationMin);
    }
    
    if (filters.durationMax !== undefined) {
      query = query.lte('duration_minutes', filters.durationMax);
    }
    
    if (filters.groupSizeMin !== undefined) {
      query = query.gte('group_size_min', filters.groupSizeMin);
    }
    
    if (filters.groupSizeMax !== undefined) {
      query = query.lte('group_size_max', filters.groupSizeMax);
    }
    
    if (filters.isTemplate !== undefined) {
      query = query.eq('is_template', filters.isTemplate);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,instructions.ilike.%${filters.search}%`);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Method[];
  },

  // Get single method by ID
  async getMethod(id: string) {
    const { data, error } = await supabase
      .from('methods')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Method;
  },

  // Create new method
  async createMethod(methodData: CreateMethodData) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('methods')
      .insert({
        ...methodData,
        user_id: user.user.id,
        group_size_min: methodData.group_size_min ?? 1,
        is_template: methodData.is_template ?? false,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Method;
  },

  // Update method
  async updateMethod({ id, ...methodData }: UpdateMethodData) {
    const { data, error } = await supabase
      .from('methods')
      .update({
        ...methodData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Method;
  },

  // Delete method
  async deleteMethod(id: string) {
    const { error } = await supabase
      .from('methods')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get methods by category
  async getMethodsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('methods')
      .select('*')
      .eq('category_id', categoryId)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as Method[];
  },

  // Get template methods
  async getTemplateMethods() {
    const { data, error } = await supabase
      .from('methods')
      .select('*')
      .eq('is_template', true)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as Method[];
  },

  // Get methods by duration range
  async getMethodsByDuration(minMinutes: number, maxMinutes: number) {
    const { data, error } = await supabase
      .from('methods')
      .select('*')
      .gte('duration_minutes', minMinutes)
      .lte('duration_minutes', maxMinutes)
      .order('duration_minutes', { ascending: true });
    
    if (error) throw error;
    return data as Method[];
  },

  // Get methods by group size
  async getMethodsByGroupSize(groupSize: number) {
    const { data, error } = await supabase
      .from('methods')
      .select('*')
      .lte('group_size_min', groupSize)
      .or(`group_size_max.gte.${groupSize},group_size_max.is.null`)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as Method[];
  },

  // Clone method as template
  async cloneAsTemplate(id: string, newName?: string) {
    const original = await this.getMethod(id);
    
    return this.createMethod({
      name: newName || `${original.name} (Template)`,
      description: original.description,
      category_id: original.category_id,
      instructions: original.instructions,
      duration_minutes: original.duration_minutes,
      group_size_min: original.group_size_min,
      group_size_max: original.group_size_max,
      materials_needed: original.materials_needed,
      tags: original.tags,
      is_template: true,
    });
  },

  // Get method statistics
  async getMethodStats() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('methods')
      .select('duration_minutes, group_size_min, group_size_max, is_template', { count: 'exact' })
      .eq('user_id', user.user.id);
    
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      templates: data?.filter(m => m.is_template).length || 0,
      averageDuration: data?.length ? 
        Math.round(data.reduce((sum, m) => sum + (m.duration_minutes || 0), 0) / data.length) : 0,
      byDurationRange: {
        short: data?.filter(m => (m.duration_minutes || 0) <= 15).length || 0, // 0-15 mins
        medium: data?.filter(m => (m.duration_minutes || 0) > 15 && (m.duration_minutes || 0) <= 45).length || 0, // 16-45 mins
        long: data?.filter(m => (m.duration_minutes || 0) > 45).length || 0, // 45+ mins
      },
      byGroupSize: {
        individual: data?.filter(m => (m.group_size_min || 1) === 1 && (m.group_size_max || 1) === 1).length || 0,
        small: data?.filter(m => (m.group_size_min || 1) <= 5 && (m.group_size_max || 100) > 1).length || 0,
        large: data?.filter(m => (m.group_size_min || 1) > 5).length || 0,
      },
    };

    return stats;
  },

  // Get popular materials
  async getPopularMaterials(limit: number = 10) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('methods')
      .select('materials_needed')
      .eq('user_id', user.user.id)
      .not('materials_needed', 'is', null);
    
    if (error) throw error;

    // Flatten and count materials
    const materialCounts: Record<string, number> = {};
    data?.forEach(method => {
      method.materials_needed?.forEach((material: string) => {
        materialCounts[material] = (materialCounts[material] || 0) + 1;
      });
    });

    // Sort by count and return top items
    return Object.entries(materialCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([material, count]) => ({ material, count }));
  },
};