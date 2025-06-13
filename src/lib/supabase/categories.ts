import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Category } from '@/types/database';

const supabase = createClientComponentClient();

export interface CategoryFilters {
  type?: string;
  parentId?: string | null;
  search?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  type: string;
  parent_id?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
}

export const categoryService = {
  // Get all categories with optional filters
  async getCategories(filters: CategoryFilters = {}) {
    let query = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.parentId !== undefined) {
      query = query.eq('parent_id', filters.parentId);
    }
    
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Category[];
  },

  // Get single category by ID
  async getCategory(id: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Category;
  },

  // Create new category
  async createCategory(categoryData: CreateCategoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...categoryData,
        user_id: 'shared-user', // Use shared user ID since authentication is not required
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Category;
  },

  // Update category
  async updateCategory({ id, ...categoryData }: UpdateCategoryData) {
    const { data, error } = await supabase
      .from('categories')
      .update({
        ...categoryData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Category;
  },

  // Delete category
  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get category types
  getCategoryTypes() {
    return [
      { value: 'course', label: 'Course' },
      { value: 'book', label: 'Book' },
      { value: 'vocabulary', label: 'Vocabulary' },
      { value: 'objective', label: 'Objective' },
      { value: 'method', label: 'Method' },
      { value: 'task', label: 'Task' },
    ];
  },
};
