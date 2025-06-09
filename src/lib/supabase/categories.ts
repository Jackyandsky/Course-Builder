import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Category } from '@/types/database';

const supabase = createClientComponentClient();

export interface CreateCategoryData {
  name: string;
  description?: string;
  type: string;
  parent_id?: string;
  color?: string;
  icon?: string;
}

export const categoryService = {
  // Get all categories by type
  async getCategories(type: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('type', type)
      .order('name');
    
    if (error) throw error;
    return data as Category[];
  },

  // Create new category
  async createCategory(categoryData: CreateCategoryData) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...categoryData,
        user_id: user.user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Category;
  },

  // Update category
  async updateCategory(id: string, categoryData: Partial<CreateCategoryData>) {
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
};
