import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SHARED_USER_ID } from '@/lib/constants/shared';
import { 
  Content, 
  ContentFilters, 
  CreateContentData, 
  UpdateContentData,
  ProprietaryProductCategory 
} from '@/types/content';

const supabase = createClientComponentClient();

export const contentService = {
  // Get all content with optional filters
  async getContent(filters: ContentFilters & { sortField?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    let query = supabase
      .from('content')
      .select(`
        *,
        category:categories!category_id(
          id,
          name,
          color,
          icon
        ),
        content_books(
          book_id,
          is_primary,
          book:books(
            id,
            title
          )
        )
      `);

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }
    
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    
    if (filters.parent_category_id) {
      query = query.eq('parent_category_id', filters.parent_category_id);
    }
    
    if (filters.book_id) {
      query = query.eq('book_id', filters.book_id);
    }
    
    if (filters.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    // Apply sorting
    const sortField = filters.sortField || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Content[];
  },

  // Get total count of content items with filters
  async getContentCount(filters: ContentFilters = {}) {
    let query = supabase
      .from('content')
      .select('id', { count: 'exact', head: true });

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }
    
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    
    if (filters.parent_category_id) {
      query = query.eq('parent_category_id', filters.parent_category_id);
    }
    
    if (filters.book_id) {
      query = query.eq('book_id', filters.book_id);
    }
    
    if (filters.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { count, error } = await query;
    
    if (error) throw error;
    return count || 0;
  },

  // Get content by category name (e.g., "Decoders", "Study Packages")
  async getContentByCategory(categoryName: string, filters: ContentFilters & { sortField?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    // First get the category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .eq('type', 'content')
      .single();
    
    if (categoryError) throw categoryError;
    
    return this.getContent({ ...filters, category_id: category.id });
  },

  // Get single content item by ID
  async getContentById(id: string) {
    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        category:categories!category_id(
          id,
          name,
          color,
          icon,
          parent_id,
          description
        ),
        parent_category:categories!parent_category_id(
          id,
          name,
          color,
          icon,
          description
        ),
        book:books(
          id,
          title,
          author,
          content_type,
          description,
          publication_year,
          publisher,
          total_pages,
          category:categories(id, name, color, icon)
        ),
        content_books(
          id,
          book_id,
          is_primary,
          notes,
          position,
          book:books(
            id,
            title,
            author,
            content_type,
            description,
            publication_year,
            publisher,
            total_pages,
            category:categories(id, name, color, icon)
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Content;
  },

  // Create new content
  async createContent(contentData: CreateContentData) {
    const { book_ids, ...dataWithoutBookIds } = contentData;
    
    const dataWithDefaults = {
      ...dataWithoutBookIds,
      is_public: contentData.is_public || false,
      status: contentData.status || 'active',
      user_id: SHARED_USER_ID,
      tags: contentData.tags || [],
      content_data: contentData.content_data || {},
    };

    // Create the content first
    const { data: newContent, error } = await supabase
      .from('content')
      .insert(dataWithDefaults)
      .select(`
        *,
        category:categories!category_id(
          id,
          name,
          color,
          icon,
          parent_id
        ),
        parent_category:categories!parent_category_id(
          id,
          name,
          color,
          icon
        ),
        book:books(
          id,
          title,
          author,
          content_type
        )
      `)
      .single();
    
    if (error) throw error;
    
    // If book_ids are provided, create content_books relationships
    if (book_ids && book_ids.length > 0) {
      const contentBookData = book_ids.map((bookId, index) => ({
        content_id: newContent.id,
        book_id: bookId,
        is_primary: index === 0, // First book is primary
        position: index
      }));
      
      const { error: bookError } = await supabase
        .from('content_books')
        .insert(contentBookData);
        
      if (bookError) {
        console.error('Failed to create content-book relationships:', bookError);
        // Don't throw - content was created successfully
      }
    }
    
    // Return the content with its relationships
    return this.getContentById(newContent.id);
  },

  // Update content
  async updateContent({ id, ...contentData }: UpdateContentData) {
    const { book_ids, ...dataWithoutBookIds } = contentData;
    
    // Update the content first
    const { data, error } = await supabase
      .from('content')
      .update({
        ...dataWithoutBookIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        category:categories!category_id(
          id,
          name,
          color,
          icon,
          parent_id
        ),
        parent_category:categories!parent_category_id(
          id,
          name,
          color,
          icon
        ),
        book:books(
          id,
          title,
          author,
          content_type
        )
      `)
      .single();
    
    if (error) throw error;
    
    // If book_ids are provided, update content_books relationships
    if (book_ids !== undefined) {
      // First, delete existing relationships
      const { error: deleteError } = await supabase
        .from('content_books')
        .delete()
        .eq('content_id', id);
        
      if (deleteError) {
        console.error('Failed to delete existing content-book relationships:', deleteError);
      }
      
      // Then create new relationships
      if (book_ids.length > 0) {
        const contentBookData = book_ids.map((bookId, index) => ({
          content_id: id,
          book_id: bookId,
          is_primary: index === 0, // First book is primary
          position: index
        }));
        
        const { error: bookError } = await supabase
          .from('content_books')
          .insert(contentBookData);
          
        if (bookError) {
          console.error('Failed to create content-book relationships:', bookError);
        }
      }
    }
    
    // Return the content with its relationships
    return this.getContentById(id);
  },

  // Delete content
  async deleteContent(id: string) {
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get proprietary product categories (subcategories under "Proprietary Products")
  async getProprietaryProductCategories(): Promise<ProprietaryProductCategory[]> {
    // First get the parent category - this should be shared across all users
    const { data: parentCategory, error: parentError } = await supabase
      .from('categories')
      .select('id, user_id')
      .eq('name', 'Proprietary Products')
      .eq('type', 'proprietary_product')
      .single();
    
    if (parentError) {
      // If parent category doesn't exist, create it
      console.warn('Proprietary Products parent category not found, creating it');
      const { data: newParent, error: createError } = await supabase
        .from('categories')
        .insert({
          name: 'Proprietary Products',
          description: 'Parent category for all proprietary product types',
          type: 'proprietary_product',
          color: '#9333EA',
          icon: 'package',
          user_id: SHARED_USER_ID // Use shared user ID for shared categories
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to create parent category:', createError);
        return [];
      }
      
      return [];
    }
    
    // Then get all subcategories - these should also be visible to all users
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentCategory.id)
      .eq('type', 'content')
      .order('name');
    
    if (error) {
      console.error('Error fetching proprietary product categories:', error);
      throw error;
    }
    
    // For now, return without content count - we'll add it separately if needed
    return (data || []).map(cat => ({
      ...cat,
      content_count: 0 // Will be implemented separately if needed
    })) as ProprietaryProductCategory[];
  },

  // Create a new proprietary product category
  async createProprietaryProductCategory(categoryData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }) {
    // First get the parent category
    let parentCategory;
    const { data: existingParent, error: parentError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Proprietary Products')
      .eq('type', 'proprietary_product')
      .single();
    
    if (parentError) {
      // Create parent category if it doesn't exist
      const { data: newParent, error: createError } = await supabase
        .from('categories')
        .insert({
          name: 'Proprietary Products',
          description: 'Parent category for all proprietary product types',
          type: 'proprietary_product',
          color: '#8B5CF6',
          icon: 'package',
          user_id: SHARED_USER_ID,
        })
        .select()
        .single();
      
      if (createError) throw createError;
      parentCategory = newParent;
    } else {
      parentCategory = existingParent;
    }
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...categoryData,
        type: 'content',
        parent_id: parentCategory.id,
        user_id: SHARED_USER_ID,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as ProprietaryProductCategory;
  },

  // Get content statistics by category
  async getContentStats() {
    const categories = await this.getProprietaryProductCategories();
    const stats = await Promise.all(
      categories.map(async (category) => {
        const { data, error } = await supabase
          .from('content')
          .select('id, is_public, status', { count: 'exact' })
          .eq('category_id', category.id);
        
        if (error) throw error;
        
        return {
          category: category.name,
          category_id: category.id,
          total: data?.length || 0,
          public: data?.filter(c => c.is_public).length || 0,
          private: data?.filter(c => !c.is_public).length || 0,
          active: data?.filter(c => c.status === 'active').length || 0,
          draft: data?.filter(c => c.status === 'draft').length || 0,
          archived: data?.filter(c => c.status === 'archived').length || 0,
        };
      })
    );
    
    return stats;
  },

  // Delete a proprietary product category
  async deleteProprietaryProductCategory(categoryId: string) {
    // First check if there are any content items in this category
    const { data: contentItems, error: contentError } = await supabase
      .from('content')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);
    
    if (contentError) throw contentError;
    
    if (contentItems && contentItems.length > 0) {
      throw new Error('Cannot delete category with existing content items. Please delete or move all content first.');
    }
    
    // Delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
    
    if (error) throw error;
    
    return { success: true };
  },

  // Check if content name already exists
  async checkDuplicateName(name: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('content')
      .select('id')
      .eq('name', name)
      .limit(1);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data && data.length > 0);
  },

  // Migrate decoder to content (for backwards compatibility)
  async migrateDecoderToContent(decoder: any): Promise<Content> {
    const contentData = {
      name: decoder.name,
      content: decoder.description,
      content_data: {
        type: 'decoder' as const,
        usage_instructions: decoder.usage_instructions,
        legacy_category: decoder.category,
      },
      category_id: '', // Will be set after getting decoder category
      tags: decoder.tags || [],
      book_id: decoder.book_id,
      is_public: decoder.is_public || false,
    };
    
    // Get decoder category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Decoders')
      .eq('type', 'content')
      .single();
    
    if (categoryError) throw categoryError;
    
    contentData.category_id = category.id;
    
    return this.createContent(contentData);
  },
};